import type { ReactNode } from "react";
import type { Session } from "next-auth";
import { can, type Action, type Resource } from "@/lib/permissions";

/**
 * Server-side RBAC gate.
 *
 * Usage:
 *
 *   const session = await getServerSession(authOptions);
 *   <Authorized session={session} action="review" resource="node">
 *     <ApproveButton />
 *   </Authorized>
 *
 * This is intentionally a *server* component:
 *   - The role × resource × action permission matrix lives in
 *     `lib/permissions.ts`. Shipping `can()` to the browser would expose
 *     that matrix to anyone with devtools.
 *   - Server-side gating means denied UI never enters the page payload at
 *     all. There is nothing for an attacker to flip with a console hack.
 *   - For client islands that need to know permissions dynamically (e.g.
 *     a row-level action menu), use `getAvailableActions` in the parent
 *     server component and pass the result as a `string[]` prop. Never
 *     pass the session itself to a client component.
 *
 * This is the canonical replacement for `{isAdmin && <X />}` and other
 * inline role-name branching in pages.
 */
export function Authorized({
  session,
  action,
  resource,
  fallback = null,
  children,
}: {
  session: Session | null;
  action: Action;
  resource: Resource;
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const role = session?.user?.role;
  if (!role) return <>{fallback}</>;
  return can(role, action, resource) ? <>{children}</> : <>{fallback}</>;
}
