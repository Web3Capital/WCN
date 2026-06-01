import type { Session } from "next-auth";
import type { Role } from "@prisma/client";
import { isAdminRole } from "@/lib/permissions";

/**
 * Workspace-scoped context derived from a session.
 *
 * Phase 1 contract (mirrored from `prisma/schema.prisma` near `model Workspace`):
 *   Many entities carry `workspaceId String?` without a formal FK. Tenant
 *   scoping is enforced at the application layer — every list query that
 *   could return data belonging to multiple workspaces must thread
 *   `activeWorkspaceId` through to the scope helpers.
 *
 *   Until a UI workspace switcher ships, `activeWorkspaceId` is typically
 *   `null` and helpers fall back to no-scope (effectively single-tenant).
 *   That preserves current behavior. Once the switcher exists, every call
 *   site receiving `null` is a cross-tenant leak — use `requireWorkspaceContext`
 *   in any path where `null` is unacceptable (finance, settlement, exports).
 */
export interface WorkspaceContext {
  userId: string;
  /** Primary user role (User.role). */
  role: Role;
  /** Currently active role (User.activeRole). May differ in multi-role contexts. */
  activeRole: Role;
  /** Currently active workspace (User.activeWorkspaceId). Null when none selected. */
  activeWorkspaceId: string | null;
  /** Convenience: FOUNDER or ADMIN at the platform level. */
  isAdmin: boolean;
}

/**
 * Build a WorkspaceContext from a session. Returns null when unauthenticated.
 *
 * Most pages should use this and pass `activeWorkspaceId` to scope helpers.
 */
export function getWorkspaceContext(session: Session | null | undefined): WorkspaceContext | null {
  const u = session?.user;
  if (!u?.id) return null;
  return {
    userId: u.id,
    role: u.role,
    activeRole: u.activeRole ?? u.role,
    activeWorkspaceId: u.activeWorkspaceId ?? null,
    isAdmin: isAdminRole(u.role),
  };
}

/**
 * Stricter variant — throws when authentication or workspace selection is
 * missing. Use in flows that must never run cross-workspace (settlement
 * generation, payout export, finance reports).
 */
export function requireWorkspaceContext(
  session: Session | null | undefined,
): WorkspaceContext & { activeWorkspaceId: string } {
  const ctx = getWorkspaceContext(session);
  if (!ctx) {
    const err = new Error("UNAUTHENTICATED");
    (err as Error & { code?: string }).code = "UNAUTHORIZED";
    throw err;
  }
  if (!ctx.activeWorkspaceId) {
    const err = new Error("WORKSPACE_REQUIRED");
    (err as Error & { code?: string }).code = "WORKSPACE_REQUIRED";
    throw err;
  }
  return ctx as WorkspaceContext & { activeWorkspaceId: string };
}
