import type { Session } from "next-auth";
import { can, type Action, type Resource } from "@/lib/permissions";

/**
 * Every action defined in the permission matrix. Mirrors the `Action`
 * union in `lib/permissions.ts`. If that union grows, this list must
 * too — kept here as the canonical "iterate every action" set so
 * `getAvailableActions` doesn't grow stale.
 */
const ALL_ACTIONS: Action[] = [
  "read",
  "create",
  "update",
  "delete",
  "review",
  "export",
  "freeze",
  "override",
  "manage",
];

/**
 * Compute the list of actions a session's actor is permitted to perform
 * on a given resource.
 *
 * Use in a server component (page or layout) and pass the result as a
 * `string[]` prop to client islands that need to render conditional
 * affordances. NEVER ship the session or `can()` to the client — they
 * would expose the full permission matrix.
 *
 * Example:
 *
 *   // page.tsx (server)
 *   const session = await getServerSession(authOptions);
 *   const dealActions = getAvailableActions(session, "deal");
 *   return <DealUi allowedActions={dealActions} />;
 *
 *   // ui.tsx (client)
 *   {props.allowedActions.includes("update") && <EditButton />}
 */
export function getAvailableActions(
  session: Session | null,
  resource: Resource,
): Action[] {
  const role = session?.user?.role;
  if (!role) return [];
  return ALL_ACTIONS.filter((action) => can(role, action, resource));
}

/**
 * Multi-resource variant for pages that render affordances over several
 * entity kinds. Keys mirror the resources passed in.
 */
export function getAvailableActionsMap<R extends Resource>(
  session: Session | null,
  resources: readonly R[],
): Record<R, Action[]> {
  const out = {} as Record<R, Action[]>;
  for (const r of resources) {
    out[r] = getAvailableActions(session, r);
  }
  return out;
}
