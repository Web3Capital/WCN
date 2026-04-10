import { getPrisma } from "@/lib/prisma";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import AppleProvider from "next-auth/providers/apple";
import AzureADProvider from "next-auth/providers/azure-ad";
import bcrypt from "bcryptjs";
import { SiweMessage } from "siwe";

/*
 * OAuth Environment Variables (add to Vercel / .env.local):
 *
 * GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
 * AZURE_AD_CLIENT_ID / AZURE_AD_CLIENT_SECRET / AZURE_AD_TENANT_ID
 * APPLE_ID / APPLE_SECRET
 * GITHUB_ID / GITHUB_SECRET
 *
 * WeChat:
 * WECHAT_APP_ID / WECHAT_APP_SECRET
 *
 * SMS (Twilio):
 * TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_PHONE_NUMBER
 */

const MAX_FAILED_ATTEMPTS = 10;

export const authOptions: NextAuthOptions = (() => {
  const prisma = getPrisma();

  const oauthProviders = [
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          allowDangerousEmailAccountLinking: true,
        })
      : null,

    process.env.GITHUB_ID && process.env.GITHUB_SECRET
      ? GitHubProvider({
          clientId: process.env.GITHUB_ID,
          clientSecret: process.env.GITHUB_SECRET,
          allowDangerousEmailAccountLinking: true,
        })
      : null,

    process.env.APPLE_ID && process.env.APPLE_SECRET
      ? AppleProvider({
          clientId: process.env.APPLE_ID,
          clientSecret: process.env.APPLE_SECRET,
          allowDangerousEmailAccountLinking: true,
        })
      : null,

    process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET
      ? AzureADProvider({
          clientId: process.env.AZURE_AD_CLIENT_ID,
          clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
          tenantId: process.env.AZURE_AD_TENANT_ID || "common",
          allowDangerousEmailAccountLinking: true,
        })
      : null,

    process.env.WECHAT_APP_ID && process.env.WECHAT_APP_SECRET
      ? {
          id: "wechat",
          name: "WeChat",
          type: "oauth" as const,
          authorization: {
            url: "https://open.weixin.qq.com/connect/qrconnect",
            params: {
              appid: process.env.WECHAT_APP_ID,
              response_type: "code",
              scope: "snsapi_login",
            },
          },
          token: {
            url: "https://api.weixin.qq.com/sns/oauth2/access_token",
            async request({ params }: { params: { code?: string } }) {
              const res = await fetch(
                `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${process.env.WECHAT_APP_ID}&secret=${process.env.WECHAT_APP_SECRET}&code=${params.code}&grant_type=authorization_code`
              );
              const data = await res.json();
              return { tokens: { access_token: data.access_token, id_token: data.openid } };
            },
          },
          userinfo: {
            url: "https://api.weixin.qq.com/sns/userinfo",
            async request({ tokens }: { tokens: { access_token?: string; id_token?: string } }) {
              const res = await fetch(
                `https://api.weixin.qq.com/sns/userinfo?access_token=${tokens.access_token}&openid=${tokens.id_token}&lang=zh_CN`
              );
              return await res.json();
            },
          },
          profile(profile: any) {
            return {
              id: profile.unionid || profile.openid,
              name: profile.nickname,
              image: profile.headimgurl,
              email: null,
            };
          },
          clientId: process.env.WECHAT_APP_ID,
          clientSecret: process.env.WECHAT_APP_SECRET,
          allowDangerousEmailAccountLinking: true,
        }
      : null,
  ].filter(Boolean) as NonNullable<NextAuthOptions["providers"][number]>[];

  return {
    secret: process.env.NEXTAUTH_SECRET,
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" },
    pages: {
      signIn: "/login",
      error: "/login",
    },
    providers: [
      ...oauthProviders,

      // ── Email + Password ───────────────────────────────────────────
      CredentialsProvider({
        id: "credentials",
        name: "Credentials",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
          totpCode: { label: "2FA Code", type: "text" }
        },
        async authorize(credentials, req) {
          const email = credentials?.email?.toLowerCase().trim();
          const password = credentials?.password ?? "";
          if (!email || !password) return null;

          const user = await prisma.user.findUnique({ where: { email } });
          if (!user?.passwordHash) return null;

          if (user.accountStatus === "LOCKED" || user.accountStatus === "OFFBOARDED" || user.accountStatus === "SUSPENDED") {
            return null;
          }

          if (user.failedLoginCount >= MAX_FAILED_ATTEMPTS) {
            await prisma.user.update({
              where: { id: user.id },
              data: { accountStatus: "LOCKED", lockedAt: new Date(), lockReason: "max_failed_attempts" }
            });
            return null;
          }

          const ok = await bcrypt.compare(password, user.passwordHash);
          if (!ok) {
            await prisma.user.update({
              where: { id: user.id },
              data: { failedLoginCount: { increment: 1 } }
            });
            return null;
          }

          if (user.twoFactorEnabled) {
            const totpCode = credentials?.totpCode?.trim();
            if (!totpCode || !user.twoFactorSecret) {
              throw new Error("2FA_REQUIRED");
            }
            const { TOTPVerify } = await import("@/lib/totp");
            if (!TOTPVerify(user.twoFactorSecret, totpCode)) {
              throw new Error("INVALID_2FA_CODE");
            }
          }

          const headers = req?.headers;
          const loginIp = (headers as any)?.["x-forwarded-for"]?.split(",")[0]?.trim()
            ?? (headers as any)?.["x-real-ip"]
            ?? null;
          const loginDevice = (headers as any)?.["user-agent"] ?? null;

          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginCount: 0,
              lastLoginAt: new Date(),
              lastLoginIp: loginIp,
              lastLoginDevice: loginDevice,
              accountStatus: user.accountStatus === "INVITED" ? "ACTIVE" : user.accountStatus === "PENDING_2FA" ? "ACTIVE" : user.accountStatus,
            }
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image
          };
        }
      }),

      // ── Wallet Login (SIWE — Sign In With Ethereum) ────────────────
      CredentialsProvider({
        id: "wallet",
        name: "Wallet",
        credentials: {
          message: { label: "Message", type: "text" },
          signature: { label: "Signature", type: "text" },
        },
        async authorize(credentials) {
          if (!credentials?.message || !credentials?.signature) return null;

          try {
            const siweMessage = new SiweMessage(credentials.message);
            const result = await siweMessage.verify({ signature: credentials.signature });
            if (!result.success) return null;

            const address = result.data.address.toLowerCase();

            let user = await prisma.user.findUnique({ where: { walletAddress: address } });

            if (!user) {
              user = await prisma.user.create({
                data: {
                  walletAddress: address,
                  name: `${address.slice(0, 6)}...${address.slice(-4)}`,
                  accountStatus: "ACTIVE",
                },
              });
            }

            if (user.accountStatus === "LOCKED" || user.accountStatus === "OFFBOARDED" || user.accountStatus === "SUSPENDED") {
              return null;
            }

            await prisma.user.update({
              where: { id: user.id },
              data: { lastLoginAt: new Date() },
            });

            return { id: user.id, email: user.email, name: user.name, image: user.image };
          } catch {
            return null;
          }
        },
      }),

      // ── Phone Number Login (SMS OTP) ───────────────────────────────
      CredentialsProvider({
        id: "phone",
        name: "Phone",
        credentials: {
          phone: { label: "Phone", type: "text" },
          code: { label: "Code", type: "text" },
        },
        async authorize(credentials) {
          const phone = credentials?.phone?.trim();
          const code = credentials?.code?.trim();
          if (!phone || !code) return null;

          const { verifyOTP } = await import("@/lib/modules/sms/otp");
          const valid = await verifyOTP(phone, code);
          if (!valid) return null;

          let user = await prisma.user.findUnique({ where: { phone } });

          if (!user) {
            user = await prisma.user.create({
              data: {
                phone,
                phoneVerified: new Date(),
                name: phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2"),
                accountStatus: "ACTIVE",
              },
            });
          } else {
            if (user.accountStatus === "LOCKED" || user.accountStatus === "OFFBOARDED" || user.accountStatus === "SUSPENDED") {
              return null;
            }
            if (!user.phoneVerified) {
              await prisma.user.update({ where: { id: user.id }, data: { phoneVerified: new Date() } });
            }
          }

          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          });

          return { id: user.id, email: user.email, name: user.name, image: user.image };
        },
      }),
    ],
    callbacks: {
      async jwt({ token, user, account }) {
        if (user) {
          token.id = user.id;
        }
        if (account) {
          token.provider = account.provider;
        }

        const REFRESH_MS = 5 * 60 * 1000;
        const now = Date.now();
        const lastRefresh = (token.refreshedAt as number) || 0;

        if (user || now - lastRefresh > REFRESH_MS) {
          const id = (token.id ?? user?.id) as string | undefined;
          if (id) {
            const dbUser = await prisma.user.findUnique({
              where: { id },
              select: { role: true, accountStatus: true, tokenInvalidatedAt: true },
            });
            if (dbUser) {
              token.role = dbUser.role;
              token.accountStatus = dbUser.accountStatus;
              if (dbUser.tokenInvalidatedAt) {
                const iat = token.iat as number | undefined;
                if (iat && dbUser.tokenInvalidatedAt.getTime() / 1000 > iat) {
                  return {} as any;
                }
              }
            }
            token.refreshedAt = now;
          }
        }

        return token;
      },
      async session({ session, token }) {
        if (session.user) {
          session.user.id = typeof token.id === "string" ? token.id : "";
          session.user.role = token.role ?? "USER";
          session.user.accountStatus = token.accountStatus ?? "ACTIVE";
        }
        return session;
      }
    }
  };
})();
