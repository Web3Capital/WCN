# ADR-0003 — Week 2 Kickoff: RBAC migration execution

- **Status**: Accepted (planning)
- **Date**: 2026-04-30 (Week 1 Day 5)
- **Decider**: Tech Lead
- **Depends on**: [ADR-0001](./0001-strangler-fig-evolution.md), [ADR-0002](./0002-rbac-migration-week2.md)

## Goal

Migrate **35 `requireAdmin()` call sites** in `app/api/` to `requirePermission(action, resource)` + row-level scope checks, in 5 working days.

By the end of Week 2:
- `requireAdmin` no longer imported anywhere except its own definition (and the definition itself is deleted in the final PR).
- Each migrated handler has at least one e2e test exercising the role-based path AND row-level scope.
- ESLint rule severity escalates from `warn` to `error`.
- baseline-metrics shows real `requireAdmin` call sites = 0.

## Daily PR plan

Each PR follows the cookbook in [ADR-0002](./0002-rbac-migration-week2.md). Test required per migrated handler:
1. Authorized role + owns resource → 200
2. Authorized role + does NOT own resource → 401 (IDOR check)
3. Unauthenticated → 401

Estimated 30–60 min per simple handler, 1–2 h for handlers needing row-level work.

### Mon — POB + Tasks (7 handlers, ~5 hours)

| # | File | Handler | (action, resource) | Row scope |
|---|---|---|---|---|
| 1 | [app/api/pob/route.ts:59](app/api/pob/route.ts:59) | POST | `create`, `pob` | `nodeId in ownedNodeIds` |
| 2 | [app/api/pob/[id]/route.ts:49](app/api/pob/%5Bid%5D/route.ts:49) | PATCH | `update`, `pob` | `ownsPoB(...)` |
| 3 | [app/api/pob/attribution/route.ts:8](app/api/pob/attribution/route.ts:8) | POST | `update`, `pob` | `ownsPoB(...)` |
| 4 | [app/api/pob/auto-attribute/route.ts:7](app/api/pob/auto-attribute/route.ts:7) | GET | `read`, `pob` | `ownsPoB(...)` |
| 5 | [app/api/pob/auto-attribute/route.ts:23](app/api/pob/auto-attribute/route.ts:23) | POST | `update`, `pob` | `ownsPoB(...)` |
| 6 | [app/api/pob/confirmations/route.ts:8](app/api/pob/confirmations/route.ts:8) | POST | `review`, `pob` | reviewer-of-pob check |
| 7 | [app/api/tasks/route.ts:39](app/api/tasks/route.ts:39) | POST | `create`, `task` | `ownerNodeId in ownedNodeIds` |
| 8 | [app/api/tasks/[id]/route.ts:47](app/api/tasks/%5Bid%5D/route.ts:47) | PATCH | `update`, `task` | `ownsTask(...)` |

PR per file or per cohesive group. Estimated 8 PRs.

### Tue — Projects + Nodes (11 handlers, ~7 hours)

| # | File | Handler | (action, resource) | Row scope |
|---|---|---|---|---|
| 9 | [app/api/projects/route.ts:37](app/api/projects/route.ts:37) | POST | `create`, `project` | self-creates allowed |
| 10 | [app/api/projects/[id]/route.ts:38](app/api/projects/%5Bid%5D/route.ts:38) | PATCH | `update`, `project` | `ownsProject(...)` |
| 11 | [app/api/projects/[id]/route.ts:100](app/api/projects/%5Bid%5D/route.ts:100) | DELETE | `delete`, `project` | admin-only |
| 12 | [app/api/projects/[id]/files/route.ts](app/api/projects/%5Bid%5D/files/route.ts) | POST | `create`, `file` | project-scoped |
| 13 | [app/api/nodes/route.ts](app/api/nodes/route.ts) | POST | `create`, `node` | self-creates always allowed |
| 14 | [app/api/nodes/[id]/route.ts:53](app/api/nodes/%5Bid%5D/route.ts:53) | PATCH | `update`, `node` | `ownsNode(...)` |
| 15 | [app/api/nodes/[id]/category/route.ts](app/api/nodes/%5Bid%5D/category/route.ts) | PATCH | `update`, `node` | admin-only |
| 16 | [app/api/nodes/[id]/penalties/route.ts](app/api/nodes/%5Bid%5D/penalties/route.ts) | POST | `manage`, `risk` | RISK_DESK + admins |
| 17 | [app/api/nodes/[id]/scope/route.ts](app/api/nodes/%5Bid%5D/scope/route.ts) | PATCH | `update`, `node` | admin-only |
| 18 | [app/api/nodes/[id]/scorecard/route.ts](app/api/nodes/%5Bid%5D/scorecard/route.ts) | POST | `update`, `node` | admin-only |
| 19 | [app/api/nodes/[id]/seats/route.ts](app/api/nodes/%5Bid%5D/seats/route.ts) | POST | `manage`, `node` | admin-only |
| 20 | [app/api/nodes/[id]/stake/route.ts](app/api/nodes/%5Bid%5D/stake/route.ts) | POST | `manage`, `node` | admin-only |
| 21 | [app/api/nodes/[id]/territories/route.ts](app/api/nodes/%5Bid%5D/territories/route.ts) | POST | `update`, `node` | admin-only |

### Wed — Agents + Territories + Reviews (7 handlers, ~5 hours)

| # | File | Handler | (action, resource) | Row scope |
|---|---|---|---|---|
| 22 | [app/api/agents/route.ts:31](app/api/agents/route.ts:31) | POST | `create`, `agent` | `ownerNodeId in ownedNodeIds` |
| 23 | [app/api/agents/[id]/route.ts:45](app/api/agents/%5Bid%5D/route.ts:45) | PATCH | `update`, `agent` | `ownsAgent(...)` |
| 24 | [app/api/agents/[id]/permissions/route.ts](app/api/agents/%5Bid%5D/permissions/route.ts) | POST | `manage`, `agent` | admin-only |
| 25 | [app/api/agents/runs/route.ts](app/api/agents/runs/route.ts) | GET | `read`, `agent` | per-agent scope |
| 26 | [app/api/territories/[territoryId]/route.ts:20](app/api/territories/%5BterritoryId%5D/route.ts:20) | PATCH | `update`, `node` | admin-only |
| 27 | [app/api/territories/[territoryId]/route.ts:61](app/api/territories/%5BterritoryId%5D/route.ts:61) | DELETE | `delete`, `node` | admin-only |
| 28 | [app/api/territories/conflicts/route.ts:11](app/api/territories/conflicts/route.ts:11) | GET | `read`, `node` | admin-only |
| 29 | [app/api/reviews/route.ts](app/api/reviews/route.ts) | POST | `create`, `review` | reviewer-assigned check |

### Thu — Policies + Settlement + Users (9 handlers, ~6 hours)

| # | File | Handler | (action, resource) | Row scope |
|---|---|---|---|---|
| 30 | [app/api/policies/route.ts](app/api/policies/route.ts) | POST | `create`, `policy` | admin-only |
| 31 | [app/api/policies/[id]/route.ts](app/api/policies/%5Bid%5D/route.ts) | PATCH/DELETE | `update`/`delete`, `policy` | admin-only |
| 32 | [app/api/policies/[id]/activate/route.ts](app/api/policies/%5Bid%5D/activate/route.ts) | POST | `update`, `policy` | admin-only |
| 33 | [app/api/policies/[id]/evaluate/route.ts](app/api/policies/%5Bid%5D/evaluate/route.ts) | POST | `review`, `policy` | REVIEWER + admins |
| 34 | [app/api/settlement/cycles/route.ts](app/api/settlement/cycles/route.ts) | POST | `create`, `settlement` | finance + admins |
| 35 | [app/api/settlement/cycles/[id]/generate/route.ts](app/api/settlement/cycles/%5Bid%5D/generate/route.ts) | POST | `update`, `settlement` | finance + admins |
| 36 | [app/api/settlement/cycles/[id]/reconcile/route.ts](app/api/settlement/cycles/%5Bid%5D/reconcile/route.ts) | POST | `review`, `settlement` | finance + admins |
| 37 | [app/api/users/route.ts](app/api/users/route.ts) | GET | `read`, `user` | admin-only |
| 38 | [app/api/users/[id]/route.ts](app/api/users/%5Bid%5D/route.ts) | PATCH/DELETE | `update`/`delete`, `user` | admin-only |

### Fri — Cleanup + ESLint upgrade + demo

1. **Delete `requireAdmin`** from `lib/admin.ts`. Final PR.
2. **Migrate ESLint to flat config** (`eslint.config.mjs`) — fixes [issue 0001](../issues/0001-eslint-flat-config.md). Replace `package.json:scripts.lint` with direct `eslint .`.
3. **Escalate `no-restricted-imports` from `warn` to `error`**.
4. **Run `npx vitest run` + `npx tsc --noEmit` + `npm run lint`** — all clean.
5. **Snapshot `bash scripts/baseline-metrics.sh week-2-friday`** — confirm `requireAdmin: 0`, `requirePermission: ≥130`.
6. **Friday demo**.

## Done criteria — Week 2 acceptance

| # | Criterion | Verification |
|---|---|---|
| 1 | All 35 handlers migrated | `grep -rn 'requireAdmin\b' app/api` returns 0 |
| 2 | `requireAdmin` definition deleted | `grep -n 'export.*requireAdmin' lib/admin.ts` returns 0 |
| 3 | ESLint rule at error severity | `.eslintrc.json` / `eslint.config.mjs` |
| 4 | `npm run lint` runs and is clean | CI signal |
| 5 | E2E specs ≥ 7 | `find e2e -name '*.spec.ts' \| wc -l` |
| 6 | All vitest passing | `npx vitest run` |
| 7 | All tsc passing | `npx tsc --noEmit` |
| 8 | Baseline metrics confirms targets | `metrics/2026-05-07-week-2-friday.md` |

## Risks & mitigation

| Risk | Mitigation |
|---|---|
| Operator scripts depend on FOUNDER/ADMIN exclusivity | Matrix already grants both full access on every resource — behavior preserved |
| Row-level work takes longer than 60 min/handler | Helpers in `lib/auth/resource-scope.ts` already extracted. Worst case: descope 2–3 to Week 3 |
| Some handler has subtle role logic (e.g. evaluate-policy) | Document deviation in PR description. Pair on the migration if needed |
| E2E spec setup takes a day in itself | Day 1 deviates: write the e2e harness as an isolated PR before starting handler migrations |
| Scope creep ("while I'm here let me also refactor…") | ADR-0001 forbids. Each PR ≤ 1 handler + its tests |

## What "demo" means at end of Week 2

5-minute walkthrough:
1. Show `metrics/` diff: `requireAdmin: 35→0`, `requirePermission: 104→139+`.
2. Show one e2e spec running (NODE_OWNER updating their own node = 200; updating someone else's = 401).
3. Show `lib/admin.ts` no longer exports `requireAdmin`.
4. Show ESLint rule blocking re-introduction (deliberately try to import it; see error).
