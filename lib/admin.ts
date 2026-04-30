import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import type { Role } from "@prisma/client";
import { can, type Action, type Resource } from "@/lib/permissions";

type OkResult = { ok: true; session: Session & { user: NonNullable<Session["user"]> } };
type FailResult = { ok: false };
type AuthResult = OkResult | FailResult;

const BLOCKED = new Set(["LOCKED", "OFFBOARDED", "SUSPENDED"]);

function isBlocked(session: Session): boolean {
  const status = (session.user as any)?.accountStatus;
  return status ? BLOCKED.has(status) : false;
}

/** Any signed-in user with ACTIVE account. */
export async function requireSignedIn(): Promise<AuthResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { ok: false as const };
  if (isBlocked(session)) return { ok: false as const };
  return { ok: true as const, session: session as any };
}

/** Require one of the specified roles. */
export async function requireRole(...roles: Role[]): Promise<AuthResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { ok: false as const };
  if (isBlocked(session)) return { ok: false as const };
  if (!roles.includes((session.user as any).role)) return { ok: false as const };
  return { ok: true as const, session: session as any };
}

/** Require permission: role must have action on resource. */
export async function requirePermission(action: Action, resource: Resource): Promise<AuthResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { ok: false as const };
  if (isBlocked(session)) return { ok: false as const };
  if (!can((session.user as any).role ?? "USER", action, resource)) return { ok: false as const };
  return { ok: true as const, session: session as any };
}

// requireAdmin removed 2026-04-30 (Week 2 of Q1 stabilization).
// All 35 prior call sites migrated to requirePermission(action, resource) +
// row-level checks via lib/auth/resource-scope.ts. See:
//   - docs/architecture/adr/0002-rbac-migration-week2.md
//   - docs/architecture/adr/0003-week2-kickoff.md
// New code that genuinely needs an admin-only gate should use either:
//   - requireRole("FOUNDER", "ADMIN") for explicit role check, or
//   - requirePermission(action, resource) where the matrix grants `manage`
//     or `delete` only to admins (prefer this — keeps RBAC matrix the
//     single source of truth).
