import "next-auth";
import type { Role, AccountStatus } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user?: {
      id: string;
      role: Role;
      accountStatus: AccountStatus;
      /** IDs of all nodes owned by this user. */
      nodeIds: string[];
      /** Currently active workspace context (if any). */
      activeWorkspaceId: string | null;
      /** Currently active role (may differ from primary role in multi-role contexts). */
      activeRole: Role;
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
    /** IDs of all nodes owned by this user. Refreshed every 5 minutes. */
    nodeIds?: string[];
    /** Currently active workspace context. */
    activeWorkspaceId?: string | null;
    /** Currently active role for permission resolution. */
    activeRole?: Role;
  }
}
