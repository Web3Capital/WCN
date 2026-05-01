# Console System Design

> Version: 1.0 (initial draft — stress-tested) | Classification: Internal — Engineering + Product
> Status: **Reference**, not yet binding. Adopted patterns are referenced inline; aspirational items are flagged as such.

---

## 0. Purpose & scope

The WCN console (`app/[locale]/dashboard/`, 29 pages spanning 18 PRD subsystems) is the operational surface for every role in the platform. This document captures the **design language** for the console: shared infrastructure every page consumes, the per-page design template, the cluster groupings used to plan work, the world-class principles we adopted (and the ones we **rejected after stress-testing**), the 5-layer target architecture, the IA folding strategy, and the migration phases.

It is not a PRD. PRDs ([01–18](../prd)) own *what* each subsystem does. This document owns *how* the console hangs together across them.

---

## 1. What the console actually is (current state)

| Dimension | Reality on `main` |
|---|---|
| Pages | 29 under `app/[locale]/dashboard/`, plus 15 sub-pages in `node-system/` (5-layer drill-in) |
| Backing PRDs | 18 (see [docs/prd](../prd)) |
| Roles | 13 (see `prisma/schema.prisma` `Role` enum) |
| State machines | 8 explicit FSMs in [`lib/core/state-machine.ts`](../../lib/core/state-machine.ts) (Account, Project, Deal, Node, Task, Evidence, PoB, Settlement, plus Policy) |
| API routes | 50+ under `app/api/` |
| Domain modules | 27 under [`lib/modules`](../../lib/modules) |
| Page convention | `page.tsx` (server, fetch + RBAC branch) + `ui.tsx` (client interaction) + `[id]/` (detail) |
| Auth | NextAuth v4 + JWT + per-role 2FA enforcement (`lib/auth/two-factor.ts`) |
| Tenant model | Workspace exists in DB + session, **app-layer enforcement is the contract** (Phase 1, no FK yet — see schema comment near `model Workspace`) |
| Caching | None at present. `force-dynamic` everywhere. Outbox + event bus exist (`lib/core/{outbox,event-bus}.ts`) but only one mutation handler currently uses outbox (`PATCH /api/applications/[id]`). |

**Maturity is uneven.** `lib/core/` (event bus, outbox, state machine, optimistic lock, validation, audit) is a strong foundation. The page layer is in transition: some pages already use shared `_components`, some hand-roll. Several mutation handlers do not pass through the SM/outbox path that would make them safe under crash.

---

## 2. Cross-cutting infrastructure (the 13 systems each page leverages)

Each console page is a thin choice over these. **Designs that re-implement any of these are wrong.**

| # | System | Primary file(s) | Page-layer interface |
|---|---|---|---|
| 1 | Auth + 2FA + blocked status | [`middleware.ts`](../../middleware.ts), [`lib/auth/two-factor.ts`](../../lib/auth/two-factor.ts) | `getServerSession`; high-priv roles 2FA-enforced; `LOCKED/SUSPENDED/OFFBOARDED` short-circuited in middleware |
| 2 | RBAC matrix | [`lib/permissions.ts`](../../lib/permissions.ts) | `can(role, action, resource)` / `isAdminRole(role)` / `requiresTwoFactor(role)` / `canAccessNodeReviewQueue(role)` |
| 3 | Workspace context | [`lib/auth/workspace-context.ts`](../../lib/auth/workspace-context.ts) (in PR #22) | `getWorkspaceContext(session)` / `requireWorkspaceContext(session)` for must-be-scoped flows |
| 4 | Row-level data scope | [`lib/member-data-scope.ts`](../../lib/member-data-scope.ts) | `getOwnedNodeIds(prisma, userId, { workspaceId? })` + `member{Projects,Tasks,PoB,Agents,Evidence,AgentRuns}Where` |
| 5 | State machines | [`lib/core/state-machine.ts`](../../lib/core/state-machine.ts) | `canTransitionX` / `validNextX` / `<EntityMachine>.transition()`; SM violations throw `TransitionError` with `*_INVALID_TRANSITION` code |
| 6 | Unified API responses | [`lib/core/api-response.ts`](../../lib/core/api-response.ts) | `apiOk` / `apiCreated` / `apiList` / `apiError` / `apiBusinessError` / `zodToApiError`; envelope `{ ok, data, meta?, error? }` |
| 7 | Event bus + transactional outbox | [`lib/core/event-bus.ts`](../../lib/core/event-bus.ts), [`lib/core/outbox.ts`](../../lib/core/outbox.ts) | `eventBus.emit` for non-durable; `writeToOutbox(tx, ...)` for durable; `processOutbox()` is the dispatcher (currently called fire-and-forget post-commit + cron is the safety net) |
| 8 | Optimistic locking | [`lib/core/optimistic-lock.ts`](../../lib/core/optimistic-lock.ts) | Apply only to high-contention entities (settlement cycle, freeze actions). Conflict → `CONFLICT` error code. **Not global.** |
| 9 | Audit log | [`lib/audit.ts`](../../lib/audit.ts), [`lib/core/handlers/audit.ts`](../../lib/core/handlers/audit.ts) | `writeAudit` for explicit rows; `eventBus.onAny` handler auto-writes per emit (current handler dual-writes — consolidation deferred) |
| 10 | Rate limiting (3 tiers) | [`lib/rate-limit.ts`](../../lib/rate-limit.ts), middleware integration | standard / auth / admin; user-id + IP keyed |
| 11 | Request tracing | `middleware.ts` x-request-id | Threaded through API responses, audit, outbox; correlated with Sentry/pino |
| 12 | i18n | [`i18n/`](../../i18n), `AutoTranslateProvider`, `<T>` | Namespace `dashboard.<page>.*`; runtime fallback via `/api/translate` |
| 13 | Console UI kit | [`app/[locale]/dashboard/_components/`](../../app/[locale]/dashboard/_components) | DataTable, FilterToolbar, PageHeader, DetailLayout, FormCard, StatusBadge, EmptyState, LoadingState, ConfirmDialog, StatCard, DistributionCharts, ReadOnlyBanner, Spotlight, TranslatedText |

**Non-negotiable conventions** read directly from the codebase:

- `page.tsx` (server) + `ui.tsx` (client) + `[id]/` (detail). Do not deviate.
- `force-dynamic` is the default. Caching is opt-in with explicit revalidate tags scoped by workspace (see §11).
- Member view = admin view + a `where` predicate. **One component, two roles.** Do not write parallel pages.
- Mutations live in API routes (`app/api/*`). Page server actions are reserved for trivial form submits; non-trivial actions go through routes so they're auditable, rate-limited, and reusable from non-page entry points (Cmd+K, batch jobs, integrations).

---

## 3. Per-page design template (mandatory fields)

Every new or refactored console page declares these **before** code. A page without a filled template is not "designed" yet. Treat as a checklist.

```yaml
identity:
  route: /dashboard/<...>
  prd: docs/prd/NN-xxx.md
  status: 🆕 | 🔧 | ✅
  owners: { product: ?, eng: ? }

audience:
  primary_roles: [...]
  secondary_roles: [...]      # read-only / observer surface
  denied_roles: [...]         # explicit 403 / hidden in nav
  scope: admin_global | member_owned | mixed

data_contract:
  server_queries:
    - prisma_call: ...
      where: ...              # references member*Where or workspace-scoped admin query
      include: ...
      pagination: cursor | offset | none
  client_fetches:
    - GET /api/...
      cache: no-store | revalidate=N
  filters:                    # URL search params
    - status: enum
    - q: string
    - cursor: string

mutations:
  - action: <verb-noun>
    method: POST | PATCH | DELETE
    endpoint: /api/...
    request_zod: <schema>
    use_case: lib/use-cases/<name>.ts
    sm_transitions: [...]     # which entity SMs this drives
    rbac: <gate function>
    audit_event: <AuditAction>
    domain_event: <Events.X>
    notifications: [...]
    rate_limit: standard | admin | auth
    optimistic_lock: true | false

ux_states:
  - loading
  - empty                     # what's the CTA
  - error                     # boundary + fallback
  - readonly                  # entity_freeze, scope mismatch
  - blocked_2fa               # redirect to /account/2fa
  - scope_empty               # member with no owned nodes
  - partial_permission        # mixed-action rows in list

components:
  shell: PageHeader + (DataTable | DetailLayout | FormCard)
  client_islands: [...]

caching:
  page: dynamic               # default
  list_revalidate: tag-based  # `workspace:<id>:nodes`
  bust_on: [...]

telemetry:
  audit: [...]
  metrics: [...]
  sentry_tags: { page, role }

i18n:
  namespace: dashboard.<page>
  required_keys: [...]

edge_cases:
  - account PENDING_2FA (handled by middleware)
  - account SUSPENDED accessing personal pages (allowed)
  - empty visibility scope (EmptyState, not 403)
  - entity_freeze present (ReadOnlyBanner, mutations disabled)
  - SM invalid transition (toast + form re-render)

open_questions:
  - <PRD ↔ current code gaps>
  - <PM decisions outstanding>
```

---

## 4. Page clustering — 29 pages → 7 domain clusters

Used to plan work, assign owners, and decide which template instantiations share components.

| Cluster | Pages | Primary PRD(s) | Shared design notes |
|---|---|---|---|
| **A. Identity & account** | profile, settings, api-keys, users, admin/invites, notifications | 01 | Self vs. admin separation is strict (`/me` vs `/admin/users`). API key creation shows plaintext exactly once. Invite tokens single-use + expiring. |
| **B. Node domain** | nodes, nodes/[id], nodes/review-queue, applications, **node-system × 15** | 02 | Node has two-layer model (NodeType topology × Registry business role). 13-state SM. Application SM (4-state) drives Node SM via downstream handler — there is **no Application→Node FK** in the schema. |
| **C. Network & capital** | projects, projects/[id], capital, capital/[id], matches, deals, deals/[id], assets | 04, 05, 06 | Deal Room is multi-party. 10-stage SM. Attribution sums must equal 100% (invariant). |
| **D. Work execution** | tasks, tasks/[id], agents, agents/[id], agents/[id]/logs | 07, 08 | Task SM 9-state. Agent runs are tasks. All Agent actions traced to owner Node (audit pillar). |
| **E. Verification & settlement** | proof-desk, pob, pob/[id], disputes, settlement, settlement/[id], approvals | 09, 10, 11 | Platform's economic engine. Evidence (6-state) → PoB (4+5-state) → Settlement (8-state). Settlement LOCK / REOPEN both require FINANCE_ADMIN approval — segregation of duties is **non-negotiable**. |
| **F. Intelligence & risk** | data, risk, reputation | 13, 14, 15 | Read-heavy. Cockpit aggregations may be safely cached (5min). Risk Console links to entity-freeze, watchlist, disputes. Reputation is PoB-derived. |
| **G. Governance & platform** | governance, campaigns, ingestion, audit, dashboard (root) | 03, 16, 17, 18 | Audit is read+export only. Ingestion is ADMIN-gated (data import is high-risk). Dashboard root is KPI aggregation. |

> **Node-system 15 sub-pages** (Layer 1 准入 / Layer 2 经营 / Layer 3 管理 / Layer 4 风控 / Layer 5 系统) currently sit under a *secondary sidebar context* (`dashboard-shell.tsx:64-87`). After stress-testing this IA decision (§9) we recommend folding most into Node detail tabs, keeping a small number of cross-node workflow pages standalone.

---

## 5. World-class principles (kept after stress-test)

The full set of principles considered and the ones rejected are in §10. These five survived.

> **P1. Object-first, page-second** — within reason. The 5–7 highest-traffic entities (Node, Project, Deal, Capital, Settlement Cycle, PoB, Task) get a single canonical detail page. Other entities can have specialized workflow pages. **WCN's domain is graph-shaped; we do not pretend it's tree-shaped like Stripe.**

> **P2. Actions are first-class** — every mutation has one name, one implementation, one RBAC gate, one audit + event signature. The same `freezeEntity` invoked from a list, a detail page, and Cmd+K must hit the same code path. Cmd+K exposes safe + non-destructive actions only; destructive actions (delete, freeze, lock) require the originating context.

> **P3. State machines are user-visible** — the status pill on a row or detail page is a clickable affordance; clicking shows current/next/needs-who. SM is a product feature, not backend plumbing.

> **P4. Permissions are data; UI follows automatically** — `<Authorized do=... on=...>` (server-computed) replaces `{isAdmin && ...}`. The role × resource × action matrix lives in `lib/permissions.ts`; UI never branches on role names directly.

> **P5. Audit is read three ways from one source** — `/audit` (compliance officer), entity timeline tab (operational user), `/me/activity` (self). All three read the same `auditLog` + outbox event store. Per-page audit pages are forbidden.

---

## 6. Five-layer target architecture

```
┌────────────────────────────────────────────────┐
│  L5  Pages (薄壳 — thin shells)                  │
│      page.tsx = pick view + pick actions;       │
│      no business logic; ~30 lines each          │
├────────────────────────────────────────────────┤
│  L4  Console kit (UI primitives)                │
│      DataTable / FilterToolbar / DetailLayout / │
│      Workflow / Authorized / Timeline /         │
│      DecisionQueue / FreezeDialog /             │
│      EntityList (per-entity, NOT polymorphic) / │
│      EmptyState / ConfirmDialog                 │
├────────────────────────────────────────────────┤
│  L3  Read queries (NOT CQRS)                    │
│      lib/queries/<entity>-<view>.ts             │
│      Pure functions: (actor, scope) → data      │
│      Embeds workspace + member-scope            │
├────────────────────────────────────────────────┤
│  L2  Application Services (use-cases)           │
│      lib/use-cases/<verb-noun>.ts               │
│      Single transactional orchestration of      │
│      RBAC + SM + outbox + audit + post-commit   │
│      First example: lib/use-cases/              │
│        approve-application.ts (PR #22)          │
├────────────────────────────────────────────────┤
│  L1  Domain core (pure)                         │
│      lib/core/state-machine.ts                  │
│      lib/state-machines/* (entity wrappers)     │
│      lib/core/event-types.ts                    │
│      Invariants (e.g. attribution sum = 100%)   │
└────────────────────────────────────────────────┘
```

**L1 already exists at ~80% maturity.** L2 has its first example (PR #22 — `approveApplication`). L3 doesn't exist yet — current pages call Prisma directly. L4 is half-built (`_components/`). L5 most pages are not yet thin shells.

The ordering of investment matters: **L2 first** (eliminates mutation duplication), **L4 next** (extract `<Authorized>` and `<DecisionQueue>` from the existing components), **L3 last** (only when the duplication of "page reads X via Prisma" becomes painful — it isn't yet).

---

## 7. IA folding strategy

29 routable destinations is too many; folding to **~12 destinations** is the goal. The post-stress-test, defensible folding is more conservative than "collapse everything":

| Category | Destinations | Replaces (29 today) |
|---|---|---|
| **3 work surfaces** | `/dashboard` (root), `/inbox` (or its 4 retained queues, see below), `/me/activity` | dashboard root, audit (in part), notifications |
| **8 object detail surfaces** | `nodes/[id]`, `projects/[id]`, `deals/[id]`, `capital/[id]`, `tasks/[id]`, `agents/[id]`, `pob/[id]`, `settlement/[cycleId]` | most node-system sub-pages (folded as tabs) |
| **Cross-node workflow pages (kept)** | `node-system/applications`, `node-system/territory`, `node-system/pipeline`, `node-system/collaboration` | (these are NOT Node properties) |
| **Decision queues (kept independent)** | `approvals`, `proof-desk`, `disputes`, `risk` | — |
| **Analytics** | `/insights` (data + reputation; risk dashboards stay under `/risk`) | data, reputation |
| **Governance & platform** | `governance`, `campaigns`, `ingestion`, `audit`, `admin/{users,invites,api-keys}` | — |
| **Personal** | `/me` (profile + settings + 2FA + sessions + my-api-keys) | profile, settings |

**What was tempting but rejected after stress-test:**

- **Folding `approvals + proof-desk + disputes + risk` into a single Inbox.** Rejected: violates maker-checker / segregation-of-duties (financial audit), breaks risk-officer independence, and dilutes dispute-resolution paper trail. **What we do instead:** the four queue pages share a `<DecisionQueue>` component skeleton — same UI primitive, four routes, four audit-distinct chains.
- **Removing `/audit` independent page.** Rejected: compliance officers and external auditors require an unfiltered, actor-centric view. We add per-entity Timeline tabs *in addition*, not as a replacement.
- **Folding all 15 node-system sub-pages into `nodes/[id]` tabs.** Rejected: 15 tabs on one detail page is anti-pattern (Linear stays at 5–7). **What we do instead:** Node detail = ~5 tabs (Overview / PoB & Scorecard / Revenue / Members / Settings); Applications, Territory, Pipeline, Collaboration remain standalone because they are cross-node workflows, not Node properties.

URL changes are the highest-cost component of any IA folding (bookmarks, training docs, screenshots, integrations, E2E tests, telemetry dashboards). Default position: **fold IA visually first** (sidebar grouping, breadcrumbs) and **defer URL changes** until the visual fold is validated by usage data.

---

## 8. Minimum bar for "world-class" (do these or don't claim it)

Eight items are non-negotiable. Each is independently shippable.

1. **Workspace-aware tenant scope** through every query that returns multi-tenant data — `getOwnedNodeIds(prisma, userId, { workspaceId })` (PR #22).
2. **Application Service layer** for every mutation that touches state + audit + events — `lib/use-cases/approve-application.ts` is the template (PR #22). Mechanical to apply to other 28 mutations.
3. **Transactional outbox + dispatcher** — outbox already exists in `lib/core/outbox.ts`; needs cron + DLQ + metrics ([follow-up PR](../../README.md)).
4. **`<Authorized>` server-side** — server computes `availableActions: string[]`, ships to client; never ship the `can()` matrix to the browser.
5. **Status-machine pill UI** — every status badge is hoverable/clickable, shows next-states, who can drive it. Renders from L1 SM definitions.
6. **`<DecisionQueue>` primitive** — 4 review queues (approvals / proof-desk / disputes / risk) compose from one component skeleton with different filter / decision shapes.
7. **Tri-view audit** — `/audit` (filterable, exportable) + per-entity Timeline tab + `/me/activity`. All three read the same store.
8. **Cmd+K command palette = action registry** — every safe action invokable by name; destructive actions require originating context. `Spotlight` already exists.

---

## 9. Migration phases (post-stress-test)

Each phase is independently shippable. The original ambitious 5-phase plan was halved after stress-testing for unrealistic time estimates and dual-codepath risk.

### Phase A — Foundations (~4 weeks)
- A.1 Workspace-aware scope ✅ ([PR #22](https://github.com/Web3Capital/WCN/pull/22) commit 1)
- A.2 Application Service PoC ✅ ([PR #22](https://github.com/Web3Capital/WCN/pull/22) commit 2)
- A.3 Outbox cron dispatcher + DLQ + metrics
- A.4 State machine 100% transition coverage tests

### Phase B — Console kit primitives (~4 weeks)
- B.1 `<Authorized>` server-side + `availableActions` protocol
- B.2 `<DecisionQueue>` skeleton; refactor 4 queue pages to consume it (URLs unchanged)
- B.3 `<Timeline source="...">` primitive backed by audit + outbox + events
- B.4 Status-machine pill UI

### Phase C — IA visual fold (~6 weeks, no URL changes)
- C.1 Sidebar reorganization to reflect §7 destination map (visual only)
- C.2 Node detail = 5-tab refactor; node-system overview becomes `nodes/[id]`
- C.3 Cmd+K registry consolidation; destructive actions removed from palette
- C.4 Per-entity Timeline tab roll-out

### Phase D — Mutation rollout (continuous)
- D.1 Migrate top 5–7 high-frequency mutations to Application Service pattern (`lockSettlementCycle`, `freezeEntity`, `approveDeal`, etc.). Each ~1–2 hours given the template.
- D.2 Decide on URL changes after C lands and usage data accumulates.

**Estimates are double the original optimistic plan.** Reasons: dual codepaths during refactor, organizational coordination across 18 PRD owners, and the cost of URL changes when they happen.

---

## 10. Decisions ledger (what survived stress-test)

| Idea | Status | Reason |
|---|---|---|
| Object-first IA for **all** entities | **modified** | Applies to top 5–7 entities only; WCN's domain is graph-shaped, not tree-shaped (Stripe analogy breaks beyond ~15 entities) |
| Application Service layer | **kept** | High value; PoC proven (PR #22); mechanical to apply |
| Transactional outbox post-commit | **kept** | Closes existing crash-window bug; `lib/core/outbox.ts` already implements pattern |
| CQRS read models layer | **rejected** | Premature — `lib/queries/` is just typed Prisma compositions. Don't pretend it's CQRS. |
| Generic `Approval` entity | **rejected** | Settlement / Node / Freeze / Dispute approvals have distinct regulatory shapes. Share UI components, not data model. |
| Unified `/inbox` for 4 queues | **rejected** | Violates maker-checker / segregation of duties. Share `<DecisionQueue>` component, keep separate routes. |
| Folding 15 node-system pages into Node tabs | **modified** | 5 are Node properties (tabs); 4 are cross-node workflows (standalone); remove the secondary sidebar context. |
| Removing `/audit` page | **rejected** | Compliance requirement. Keep the page; add per-entity Timeline tab as augmentation. |
| Cmd+K = all actions | **modified** | Safe + non-destructive only. Destructive actions stay in originating context. |
| `<Authorized>` component | **kept (server-side variant)** | Computes `availableActions` on server; client receives result. Don't ship the matrix. |
| Status machine UI affordance | **kept** | Real product value; cheap to implement; no regulatory friction. |
| Empty states "selling value" | **rejected (over-design for internal tools)** | Use `<EmptyState>` with brief message + CTA; not transactional onboarding. |
| Errors showing full SM diagram | **rejected (annoying after 3rd time)** | Show current/expected status text; link to `/audit` for context. |
| Property-based SM tests via `fast-check` | **deferred** | Tooling-cost > value at current team size; mandatory single-path tests instead. |
| Polymorphic `<EntityList resource="...">` | **rejected** | Generic DataGrid is a known anti-pattern. Per-entity list components compose the shared DataTable primitive. |
| Optimistic lock everywhere | **modified** | Only on 5–7 high-contention mutations (settlement lock, freeze, etc.). |
| `force-dynamic` everywhere | **modified** | Three tiers: list (SWR + workspace tag) / detail (dynamic) / aggregate (cache 5min). |
| Reducing 13 roles | **rejected** | Roles map to legal / contractual segregation; reducing = compliance regression. |
| 12–16 week rewrite estimate | **rejected** | Real estimate 24–36 weeks across 4 phases; communicate this. |
| URL collapse 29 → 12 | **modified** | Visual fold first, URL changes deferred until validated. |

---

## 11. Caching policy (must be workspace-aware)

When caching is introduced (currently `force-dynamic` everywhere), every revalidate tag **must** include workspace ID:

```ts
// ✅ correct
revalidateTag(`workspace:${workspaceId}:nodes`);

// ❌ wrong — global tag bursts every workspace's cache
revalidateTag("nodes");
```

Tier policy:

| Page kind | Strategy |
|---|---|
| List pages (low personalization) | `revalidate=N` (e.g. 10s) + `revalidateTag(workspace:<id>:<entity>)` |
| Detail pages (high personalization, RBAC-branched) | `force-dynamic` |
| Aggregate dashboards (cockpit, reputation) | `revalidate=300` + manual `revalidateTag` on relevant mutations |

This policy does not apply yet — added here so the first page that needs caching adopts it correctly. Mutations that bust caches do so via the outbox event handler, not inline in the use-case (use-case stays domain-pure).

---

## 12. Open questions for product / leadership

These need PM decision before the corresponding work proceeds.

1. **Workspace selection mandatory for finance flows?** The `requireWorkspaceContext` helper exists; what flows must enforce it? (Settlement, payouts, exports — almost certainly. KYC review — probably. List views — probably not.)
2. **Audit row consolidation.** Today `APPLICATION_STATUS_CHANGE` (legacy) and `application.approved` (event-handler) both write rows. Reports may filter by either. Decision needed: keep dual writes, or consolidate to event-driven only and migrate any consumers.
3. **Idempotency design.** Outbox table has no `idempotencyKey`. Decision: add column, or layer in route-handler middleware, or rely on client retry policy. (Settlement lock, freeze, payout — at-most-once semantics needed.)
4. **`/inbox` future.** Even though we rejected the *unified* inbox, is there a "my pending decisions" digest view across the four queues? (No new route required if so — could be a `/me` widget.)
5. **Node-system second sidebar context.** Recommend removing it (§7). Confirm with the team that owns node-system.
6. **18-PRD ownership vs. cross-cutting work.** Phases B–D touch all 18 areas. Who owns "shared component refactors" — a platform team, or rotating ownership per cluster?

---

## 13. Reference: code patterns to consult

| Concern | File / pattern |
|---|---|
| Workspace-aware scope helper | `lib/auth/workspace-context.ts` (PR #22) |
| Application Service template | `lib/use-cases/approve-application.ts` (PR #22) |
| Thin handler shape | `app/api/applications/[id]/route.ts` (PR #22) |
| State-machine wrapper | `lib/core/state-machine.ts` |
| Outbox writer | `lib/core/outbox.ts` |
| Audit subscription pattern | `lib/core/handlers/audit.ts` (auto-writes from any event) |
| RBAC gates | `lib/permissions.ts` (`can`, `isAdminRole`, `canAccessNodeReviewQueue`, `requiresTwoFactor`) |
| Member visibility predicates | `lib/member-data-scope.ts` |
| Console UI components (current) | `app/[locale]/dashboard/_components/` |

---

## Changelog

- **1.0 (2026-05-01)** — Initial sediment from stress-tested system-design conversation. Phase A.1–A.2 implementations live in [PR #22](https://github.com/Web3Capital/WCN/pull/22).
