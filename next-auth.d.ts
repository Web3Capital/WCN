import "next-auth";
import type { Role, AccountStatus } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user?: {
      id: string;
      role: Role;
      accountStatus: AccountStatus;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
    accountStatus?: AccountStatus;
  }
}
