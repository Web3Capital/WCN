# ADR-0002 — Week 2 RBAC Migration: requireAdmin → requirePermission

- **Status**: Accepted (planning)
- **Date**: 2026-04-30
- **Decider**: Tech Lead
- **Scope**: Replace 35 `requireAdmin()` call sites with `requirePermission(action, resource)` + row-level scope where applicable.

## Background

`lib/permissions.ts` defines a 12-role × 22-resource × 9-action RBAC matrix. `requirePermission(action, resource)` (lib/admin.ts:36) consults it. `requireAdmin()` (lib/admin.ts:48) does not — it allows only FOUNDER + ADMIN regardless of what the matrix says.

35 API route handlers still use `requireAdmin`. Effects:

- NODE_OWNER, REVIEWER, RISK_DESK, FINANCE_ADMIN etc. cannot do things the matrix says they can (e.g., NODE_OWNER updating their own node).
- The matrix is decorative. A future RBAC change will not change actual behavior until handlers are migrated.

## Decision

Replace every `requireAdmin()` with `requirePermission(action, resource)` matched to the HTTP method and the resource the handler operates on. Where ownership applies, add row-level scoping in the WHERE clause.

The legacy `requireAdmin()` export will be deleted once all call sites are migrated. An ESLint rule will block re-introduction.

## Migration mapping (35 handlers)

Each row is one PR (or a small batch sharing a resource). Goal: complete in the 5 working days of Week 2.

### POB domain — resource: `pob` / `evidence` (5 files)

| File | Method | Action | Resource | Row-level scope? |
|---|---|---|---|---|
| `app/api/pob/route.ts:59` | POST | `create` | `pob` | yes — `nodeId in ownedNodeIds` |
| `app/api/pob/[id]/route.ts:49` | PATCH | `update` | `pob` | yes — same |
| `app/api/pob/attribution/route.ts:8` | POST | `update` | `pob` | yes — same |
| `app/api/pob/auto-attribute/route.ts:7,23` | GET/POST | `update` | `pob` | yes — same |
| `app/api/pob/confirmations/route.ts:8` | POST | `review` | `pob` | for non-admin: only on PoBs they're a reviewer for |

### Tasks domain — resource: `task` (2 files)

| File | Method | Action | Resource | Row-level scope? |
|---|---|---|---|---|
| `app/api/tasks/route.ts:39` | POST | `create` | `task` | NODE_OWNER only on owned-node tasks |
| `app/api/tasks/[id]/route.ts:47` | PATCH | `update` | `task` | NODE_OWNER only on owned-node tasks; SERVICE_NODE only on assigned tasks |

### Projects domain — resource: `project` (3 files)

| File | Method | Action | Resource | Row-level scope? |
|---|---|---|---|---|
| `app/api/projects/route.ts:37` | POST | `create` | `project` | yes — owner is always self |
| `app/api/projects/[id]/route.ts:38` | PATCH | `update` | `project` | yes — `ownerNodeId in ownedNodeIds` |
| `app/api/projects/[id]/route.ts:100` | DELETE | `delete` | `project` | admin-only (matrix limits delete to FOUNDER/ADMIN) |
| `app/api/projects/[id]/files/route.ts` | POST | `create` | `file` | yes — project-scoped |

### Nodes domain — resource: `node` (8 files)

| File | Method | Action | Resource | Row-level scope? |
|---|---|---|---|---|
| `app/api/nodes/route.ts` | POST | `create` | `node` | self-creates always allowed; admin creates anyone |
| `app/api/nodes/[id]/route.ts:53` | PATCH | `update` | `node` | yes — `ownerUserId === me` for non-admin |
| `app/api/nodes/[id]/category/route.ts` | PATCH | `update` | `node` | admin-only (category change is high-trust) |
| `app/api/nodes/[id]/penalties/route.ts` | POST | `manage` | `risk` | RISK_DESK / ADMIN / FOUNDER |
| `app/api/nodes/[id]/scope/route.ts` | PATCH | `update` | `node` | admin-only (scope is high-trust) |
| `app/api/nodes/[id]/scorecard/route.ts` | POST | `update` | `node` | admin-only |
| `app/api/nodes/[id]/seats/route.ts` | POST | `manage` | `node` | admin-only |
| `app/api/nodes/[id]/stake/route.ts` | POST | `manage` | `node` | admin-only |
| `app/api/nodes/[id]/territories/route.ts` | POST | `update` | `node` | admin-only |

### Agents domain — resource: `agent` (4 files)

| File | Method | Action | Resource | Row-level scope? |
|---|---|---|---|---|
| `app/api/agents/route.ts:31` | POST | `create` | `agent` | AGENT_OWNER on own agents |
| `app/api/agents/[id]/route.ts:45` | PATCH | `update` | `agent` | AGENT_OWNER on own agents |
| `app/api/agents/[id]/permissions/route.ts` | POST | `manage` | `agent` | admin-only |
| `app/api/agents/runs/route.ts` | GET | `read` | `agent` | per-agent scope |

### Territories — resource: `node` (no `territory` resource; territories are node-scoped) (2 files)

| File | Method | Action | Resource | Row-level scope? |
|---|---|---|---|---|
| `app/api/territories/[territoryId]/route.ts:20,61` | PATCH/DELETE | `update`/`delete` | `node` | admin-only |
| `app/api/territories/conflicts/route.ts:11` | GET | `read` | `node` | admin-only |

### Policies — **needs new `policy` resource** in lib/permissions.ts (4 files)

| File | Method | Action | Resource | Row-level scope? |
|---|---|---|---|---|
| `app/api/policies/route.ts` | POST | `create` | `policy` (new) | admin-only |
| `app/api/policies/[id]/route.ts` | PATCH/DELETE | `update`/`delete` | `policy` (new) | admin-only |
| `app/api/policies/[id]/activate/route.ts` | POST | `update` | `policy` (new) | admin-only |
| `app/api/policies/[id]/evaluate/route.ts` | POST | `read` | `policy` (new) | REVIEWER + admins |

**Action**: add `policy` to the `Resource` union in `lib/permissions.ts` and populate POLICIES.

### Reviews — resource: `review` (1 file)

| File | Method | Action | Resource | Row-level scope? |
|---|---|---|---|---|
| `app/api/reviews/route.ts` | POST | `create` | `review` | REVIEWER / RISK_DESK on assigned reviews |

### Settlement — resource: `settlement` (3 files)

| File | Method | Action | Resource | Row-level scope? |
|---|---|---|---|---|
| `app/api/settlement/cycles/route.ts` | POST | `create` | `settlement` | FINANCE_ADMIN / FOUNDER / ADMIN |
| `app/api/settlement/cycles/[id]/generate/route.ts` | POST | `update` | `settlement` | FINANCE_ADMIN / FOUNDER / ADMIN |
| `app/api/settlement/cycles/[id]/reconcile/route.ts` | POST | `review` | `settlement` | FINANCE_ADMIN / FOUNDER / ADMIN |

### Users — resource: `user` (2 files)

| File | Method | Action | Resource | Row-level scope? |
|---|---|---|---|---|
| `app/api/users/route.ts` | GET | `read` | `user` | admin-only |
| `app/api/users/[id]/route.ts` | PATCH/DELETE | `update`/`delete` | `user` | admin-only |

## Migration cookbook (per handler)

Each PR is small and follows the same template:

```diff
- import { requireAdmin } from "@/lib/admin";
+ import { requirePermission } from "@/lib/admin";
+ import { isAdminRole } from "@/lib/permissions";

  export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
-   const admin = await requireAdmin();
-   if (!admin.ok) return apiUnauthorized();
+   const auth = await requirePermission("update", "project");
+   if (!auth.ok) return apiUnauthorized();

    const prisma = getPrisma();
    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) return apiNotFound("Project");

+   // Row-level scope: non-admins can only mutate their own resources.
+   const isAdmin = isAdminRole(auth.session.user.role);
+   if (!isAdmin && existing.ownerNodeId !== /* user's owned node */) {
+     return apiUnauthorized();
+   }

    const updated = await prisma.project.update({ where: { id }, data: ... });
    return apiOk(updated);
  }
```

For row-level scope, prefer the existing `getOwnedNodeIds(prisma, userId)` helper from `lib/member-data-scope.ts` so the migration is consistent across handlers.

### Test requirement per migrated handler

- One e2e or integration test asserting that:
  1. The intended role (e.g., NODE_OWNER) succeeds on a resource they own.
  2. The same role fails on a resource they do not own (IDOR check).
  3. An unauthenticated request returns 401.

E2E target by Q1 end: ≥ 7 specs (one per major domain). Currently 1.

## Sequencing (Week 2)

| Day | Domain | Files |
|---|---|---|
| Mon | POB + Tasks | 7 |
| Tue | Projects + Nodes | 11 |
| Wed | Agents + Territories + Reviews | 7 |
| Thu | Policies (incl. lib/permissions.ts addition) + Settlement + Users | 9 |
| Fri | Delete legacy `requireAdmin`; add ESLint rule banning it; demo |

## Done criteria

- `requireAdmin` no longer imported anywhere except its own definition (which is then deleted).
- ESLint rule prevents re-introduction.
- Each domain has at least one e2e test exercising the role-based + row-level paths.
- baseline-metrics shows `requireAdmin_calls: 0` and `requirePermission_calls: ≥ 130`.

## Risks

- **Existing operator scripts may rely on FOUNDER/ADMIN exclusivity** — likely fine because the matrix already grants FOUNDER/ADMIN full access on every resource.
- **Row-level scope is more invasive than a simple replace** — the easy wins (add `requirePermission`) are 1 line; the hard wins (add `where: { ownerUserId: me }`) require domain understanding. Allocate 2x effort to row-level work.
- **`policy` resource doesn't exist in matrix** — must add to `lib/permissions.ts` first; one of the four-policy-handler PRs depends on this.
