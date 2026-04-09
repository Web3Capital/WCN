import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import type { Role } from "@prisma/client";
import { can, isAdminRole, type Action, type Resource } from "@/lib/permissions";

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

/**
 * Legacy helper — checks FOUNDER or ADMIN.
 * Prefer requireRole() or requirePermission() in new code.
 */
export async function requireAdmin(): Promise<AuthResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { ok: false as const };
  if (!isAdminRole((session.user as any).role ?? "USER")) return { ok: false as const };
  return { ok: true as const, session: session as any };
}
