import { getPrisma } from "@/lib/prisma";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import AppleProvider from "next-auth/providers/apple";
import AzureADProvider from "next-auth/providers/azure-ad";
import bcrypt from "bcryptjs";

/*
 * OAuth Environment Variables (add to Vercel / .env.local):
 *
 * GOOGLE_CLIENT_ID=...
 * GOOGLE_CLIENT_SECRET=...
 *
 * AZURE_AD_CLIENT_ID=...
 * AZURE_AD_CLIENT_SECRET=...
 * AZURE_AD_TENANT_ID=common          (use "common" for multi-tenant)
 *
 * APPLE_ID=...
 * APPLE_SECRET=...                    (JWT — see Apple docs)
 *
 * GITHUB_ID=...
 * GITHUB_SECRET=...
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
      CredentialsProvider({
        name: "Credentials",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
          totpCode: { label: "2FA Code", type: "text" }
        },
        async authorize(credentials) {
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
              return null;
            }
            const { TOTPVerify } = await import("@/lib/totp");
            if (!TOTPVerify(user.twoFactorSecret, totpCode)) {
              return null;
            }
          }

          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginCount: 0,
              lastLoginAt: new Date(),
              accountStatus: user.accountStatus === "INVITED" ? "ACTIVE" : user.accountStatus === "PENDING_2FA" ? "ACTIVE" : user.accountStatus
            }
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image
          };
        }
      })
    ],
    callbacks: {
      async jwt({ token, user, account }) {
        if (user) {
          token.id = user.id;
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { role: true, accountStatus: true }
          });
          token.role = dbUser?.role ?? "USER";
          token.accountStatus = dbUser?.accountStatus ?? "ACTIVE";
        }
        if (account) {
          token.provider = account.provider;
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
