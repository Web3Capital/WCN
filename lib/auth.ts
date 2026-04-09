import { getPrisma } from "@/lib/prisma";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

const MAX_FAILED_ATTEMPTS = 10;

export const authOptions: NextAuthOptions = (() => {
  const prisma = getPrisma();
  return {
    secret: process.env.NEXTAUTH_SECRET,
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" },
    pages: {
      signIn: "/login"
    },
    providers: [
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
      async jwt({ token, user }) {
        if (user) {
          token.id = user.id;
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { role: true, accountStatus: true }
          });
          token.role = dbUser?.role ?? "USER";
          token.accountStatus = dbUser?.accountStatus ?? "ACTIVE";
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
