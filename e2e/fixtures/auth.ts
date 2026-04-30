/**
 * E2E auth helpers — sign a NextAuth-compatible JWT cookie for a given
 * userId + role, so tests can hit authenticated API routes without going
 * through the OAuth/SIWE/SMS flow.
 *
 * The JWT format and salt MUST match what NextAuth uses at runtime so the
 * server's getToken() in middleware.ts accepts our cookie. We import
 * `next-auth/jwt`'s encode() so any future change to NextAuth's encoding
 * is automatically picked up.
 */

import { encode } from "next-auth/jwt";
import type { Role } from "@prisma/client";

/**
 * Default cookie name when NEXTAUTH_URL is http:// (dev / test). Production
 * uses `__Secure-next-auth.session-token`. Tests run against localhost so we
 * use the unprefixed name.
 */
export const SESSION_COOKIE_NAME = "next-auth.session-token";

export type TestSessionInput = {
  userId: string;
  role: Role;
  email?: string | null;
  name?: string | null;
  /** AccountStatus claim. Defaults to ACTIVE. */
  accountStatus?: "ACTIVE" | "PENDING_2FA" | "INVITED";
};

/**
 * Signs a JWT and returns the cookie value. Caller adds it to Playwright's
 * request context with `request.newContext({ extraHTTPHeaders: { cookie: ... } })`
 * or via `setStorageState`.
 */
export async function signSession(input: TestSessionInput): Promise<string> {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET must be set for e2e auth fixtures");
  }
  // Match the shape produced by lib/auth.ts's jwt callback.
  const token = {
    id: input.userId,
    sub: input.userId,
    email: input.email ?? null,
    name: input.name ?? null,
    role: input.role,
    accountStatus: input.accountStatus ?? "ACTIVE",
  };
  const jwt = await encode({ token, secret });
  return jwt;
}

/**
 * Convenience: returns the `Cookie:` header value string for use in
 * Playwright `extraHTTPHeaders`.
 */
export async function sessionCookieHeader(input: TestSessionInput): Promise<string> {
  const value = await signSession(input);
  return `${SESSION_COOKIE_NAME}=${value}`;
}
