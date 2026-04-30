# ADR-0004 — PoB Domain: Event Sourcing Pilot (Q2)

- **Status**: Proposed (Q2 kickoff)
- **Date**: 2026-04-30
- **Decider**: Tech Lead
- **Depends on**: [ADR-0001](./0001-strangler-fig-evolution.md) (Strangler Fig)
- **Scope**: Q2 — single bounded context (PoB) only

## Context

[ADR-0001](./0001-strangler-fig-evolution.md) committed to evolving WCN toward event sourcing + CQRS, one bounded context per quarter. Q1 closed RBAC + perf + lint. Q2 begins the architectural pivot.

PoB is selected as the pilot for the reasons in ADR-0001:

- Most complex domain (submission → witness selection → review → confirmation → dispute → settlement)
- Multi-actor flow (NODE_OWNER submits, REVIEWER attests, RISK_DESK can dispute, FINANCE_ADMIN settles)
- Naturally event-shaped (each step is a discrete attestation)
- Failure-recoverable (PoB submission can pause for hours)
- Highest ROI from event log: "who attested what when" becomes a first-class artifact

## What's already in place (Phase 0 — done)

The repo isn't starting from zero. As of `b119cd3` (end of Week 2):

| Asset | Status | Where |
|---|---|---|
| `Outbox` Prisma model | ✅ exists, has `delivered`/`retryCount`/`lastError` | `prisma/schema.prisma` |
| In-process event bus (`DomainEventBus`) | ✅ typed via `EventMap` | `lib/core/event-bus.ts` |
| Event vocabulary (incl. 3 PoB events) | ✅ `POB_CREATED`, `POB_FLAGGED`, `POB_DISPUTE_RAISED` | `lib/core/event-types.ts` |
| Event handlers (audit + side effects) | ✅ wildcard + named | `lib/core/event-handlers.ts` |
| Permissions matrix (`policy` resource added) | ✅ | `lib/permissions.ts` |
| Row-level scope helpers | ✅ `ownsPoB` etc. | `lib/auth/resource-scope.ts` |

What's **missing** for true event sourcing:

1. **Outbox is not currently written transactionally with DB mutations.** Events fire via in-memory bus; they are notifications, not source of truth. Process crash between DB write and event emit = lost event.
2. **No projection layer.** Dashboard PoB list reads from `prisma.poBRecord` directly. No read model.
3. **No aggregate / command-bus pattern.** Mutations happen in route handlers via direct Prisma calls. No domain aggregate enforces invariants.
4. **No saga / process manager.** Cross-aggregate workflows (PoB → Settlement) are inline; no orchestrator manages compensation or retries.
5. **No event durability / replay.** Outbox row exists but no consumer reads it.

## Decision

Adopt **event sourcing + CQRS for the PoB bounded context**, leveraging the existing infrastructure where possible and following the [ADR-0001](./0001-strangler-fig-evolution.md) Strangler Fig discipline.

**Concrete commitments**:

1. Postgres outbox + **Inngest** as event delivery (per ADR-0001 no-list: no Kafka, no Temporal).
2. 5-phase migration over **6–8 weeks**, each phase reversible via feature flag.
3. PoB aggregate root + command bus for mutations; events as source of truth; DB row for PoB becomes a projection.
4. Read model `pob_read_model` for dashboard queries.
5. `PoBReviewSaga` as the first orchestrator (replaces the existing inline review flow).
6. Witness selection in this phase = configured reviewer set (deterministic). Random/VRF-based selection deferred to a separate ADR.

## Phase plan

Each phase is ≤ 2 weeks. Each ends with a demo + metrics gate.

### Phase A — Transactional outbox (Week 1)

**Goal**: every PoB mutation in `app/api/pob/**` writes an outbox row in the **same transaction** as the DB write.

- Wrap each `prisma.poBRecord.{create,update}` call (and related sub-tables: Attribution, Confirmation, Dispute) in `prisma.$transaction([…, outbox.write(…)])`.
- New helper `lib/core/outbox/write.ts` exports `writeOutbox(tx, eventName, payload, meta)` that the route handlers call inside their transaction.
- Inngest consumer subscribes to outbox; for now it only logs (no projection writes yet).
- Existing in-process `eventBus.emit()` calls remain — they're now redundant for PoB but staying behind a feature flag during migration.

**Done criteria**: outbox lag P95 < 1s; 100% of PoB mutations produce a corresponding outbox row; lost-event audit (kill DB write, observe whether outbox row exists or is rolled back).

### Phase B — Read model build (Week 2–3)

**Goal**: Inngest projects PoB events → `pob_read_model` table; dashboard reads via dual-path (old direct query + new read model) with diff alarm.

- New table `PoBReadModel` in Prisma schema. Fields denormalized for the list view: id, status, score, businessType, taskId, projectId, nodeId, attributionsSummary (JSON), confirmationCount, disputeCount, lastEventAt.
- Inngest function `projectPoB(event)` upserts `pob_read_model` for each PoB-related event.
- Dashboard PoB list page (`app/[locale]/dashboard/pob/page.tsx`) queries both the old way and the new way, asserts equality, logs divergence to Sentry.

**Done criteria**: divergence rate < 0.01% sustained 7 days; replay-from-zero produces same final state as live data.

### Phase C — Cut read (Week 4)

**Goal**: feature-flag the dashboard read path from old → projection.

- Feature flag `read_pob_from_projection` (Edge Config or env-driven for fast flip).
- Roll: 5% → 50% → 100% over the week, monitoring P95 latency + error rate.
- Old query path retained for 30 days behind the flag for rollback.

**Done criteria**: 100% read traffic on projection for 7 days; P95 latency ≤ pre-cut baseline; 0 rollbacks.

### Phase D — Cut write (Week 5–6)

**Goal**: PoB mutations go through `PoBAggregate` + `CommandBus`; DB write becomes a side-effect of event projection.

New code:

- `lib/modules/pob/aggregate.ts` — `PoBAggregate` class. Methods: `submit`, `assignAttribution`, `confirm`, `dispute`, `resolveDispute`. Each emits events; no direct DB writes.
- `lib/core/command-bus.ts` — generic command dispatch. `commandBus.dispatch(command)` → handler → aggregate.handle → events → outbox.
- Server Actions on `app/[locale]/dashboard/pob/page.tsx` (replacing API-route-driven mutations) → command bus.
- Inngest projector also writes to `PoBRecord` table (now a pure read projection).

**Done criteria**: write path 100% event-first; old `/api/pob` POST/PATCH paths return deprecation 410 (or proxy to command bus during overlap); chaos test (kill projector mid-run) → resumable.

### Phase E — Saga (Week 6–7)

**Goal**: extract the implicit "PoB review workflow" into an explicit `PoBReviewSaga` managed by Inngest.

- Steps: `PoBSubmitted` → select witnesses (configured reviewer set) → notify → wait for k confirmations OR timeout → emit `PoBReviewCompleted` → trigger settlement-eligible flag.
- Compensations: timeout → emit `PoBReviewTimedOut`; admin can retry/escalate.
- Replaces the current implicit flow where review happens via direct PATCH on `/api/pob/[id]`.

**Done criteria**: saga handles full round-trip happy path + 1 timeout case; failure mode = saga state visible via Inngest dashboard, manually restartable.

### Phase F (optional, Week 8) — Cleanup

- Remove old `/api/pob` POST/PATCH route handlers (now 410 → 404).
- Remove `lib/core/event-bus.ts` PoB emits (replaced by outbox-driven flow).
- Backfill: replay outbox from start; assert read model is byte-identical to current DB.
- Documentation: ADR-0005 (witness selection algorithm — VRF / committee / etc.); ADR-0006 (Capital domain ES — copy the cookbook).

## Event vocabulary (Q2 PoB)

Existing 3 events are kept; new ones added. All emitted to outbox.

```ts
// lib/core/event-types.ts (additions)

PoBSubmitted               // status: PENDING -> SUBMITTED equivalent
PoBAttributionAssigned     // shareBps + role per node
PoBReviewRequested         // saga emits when witnesses selected
PoBConfirmed               // by node or user (existing Confirmation logic)
PoBRejected                // negative confirmation
PoBDisputeRaised           // (already exists)
PoBDisputeResolved
PoBStatusChanged           // generic — for any PoBRecordStatus transition
PoBLinkedToDeal            // when dealId is set
PoBSettlementTriggered     // saga -> settlement input
PoBReviewCompleted         // saga end
PoBReviewTimedOut          // saga compensation
```

Each event payload has: `pobId`, `version` (aggregate version), `payload-specific data`, `causationId` (the command/event that caused it), `correlationId` (tracks a workflow). Outbox stores them.

## Feature flags

| Flag | Default | Used by | Rollback path |
|---|---|---|---|
| `pob_outbox_write` | on | Phase A | off → revert to in-memory bus only |
| `read_pob_from_projection` | off → 100% | Phase C | flag off → query old path |
| `write_pob_via_command_bus` | off → 100% | Phase D | flag off → API route handlers active again |
| `pob_review_saga` | off → 100% | Phase E | flag off → inline review path resumed |

Mechanism: Vercel Edge Config OR env var. Decision in Phase A.

## Done criteria for Q2 (the whole pilot)

- All 5 phases shipped, each with passing demo + metrics gate
- PoB read path 100% on projection for ≥ 7 days
- PoB write path 100% event-driven for ≥ 7 days
- 1 saga in production
- 0 production incidents traced to ES infrastructure
- Cookbook (`docs/architecture/cookbook/event-sourcing.md`) written so the next bounded context (Capital, Q3) can be done in 4 weeks instead of 8
- Unit tests + e2e specs still green
- Baseline metrics show:
  - `"use server"` files: ≥ 5 (PoB Server Actions)
  - `unstable_cache` / `revalidateTag` / `revalidatePath`: ≥ 5 (around the projection)
  - Streaming AI: > 0 (PoB review summarization, optional)

## Risks & mitigation

| Risk | Mitigation |
|---|---|
| Inngest down → outbox stuck | Outbox stays in DB; manual replay tool (`scripts/replay-outbox.ts`); sane retry/backoff |
| Schema drift between aggregate and read model | Contract tests asserting read model fields ⊆ event payload union |
| Existing PoB records have no events | Phase B includes a one-time migration: synthesize `PoBSubmitted` events from current DB rows (idempotent) |
| Team learning curve | Internal lunch-and-learn after Phase A; pair on first command/saga; weekly demos |
| Performance regression on projection | Diff alarm in Phase B catches before cut; rollback flag stays available 30 days |
| Dual-write race during Phase A | Outbox + main write in same transaction — atomic |
| The complexity of replaying ~N existing PoBs | Phase B starts with a one-shot synthesis script; estimated dataset size known by then |

## Out of scope for Q2 (per ADR-0001)

- Capital / Settlement / Governance / Reputation / Node domains — Q3+.
- VRF-based witness selection — separate ADR (ADR-0005 future).
- Cryptographic anchoring of three-ledger Merkle roots — Q3.
- DID/VC standard adoption — Q4.
- Replacing in-process event bus globally — only PoB migrates this quarter; other modules continue with the existing bus.

## Tracking

This ADR opens a long-running PR series. Each phase is one (or more) PRs:

- Phase A: 1 PR (`q2-pob-phase-a-outbox`)
- Phase B: 1 PR (`q2-pob-phase-b-projection`)
- Phase C: 1 PR (`q2-pob-phase-c-cut-read`)
- Phase D: 2-3 PRs (`q2-pob-phase-d-aggregate`, `q2-pob-phase-d-server-actions`, `q2-pob-phase-d-cut-write`)
- Phase E: 1 PR (`q2-pob-phase-e-saga`)
- Phase F: 1 PR (`q2-pob-phase-f-cleanup`)

Each PR ≤ 800 lines diff. Each must pass: tsc, vitest, e2e, baseline-metrics.

## Decision required from operator

Before Phase A starts:

1. **Feature flag mechanism**: Vercel Edge Config (paid feature) vs env var with redeploy. Recommend Edge Config for fast rollback.
2. **Inngest setup**: Vercel Marketplace install (zero-config) vs self-managed. Recommend marketplace.
3. **PoB read traffic baseline**: capture P95 latency + req/min before Phase A so Phase C has a target.
4. **Greenlight to start**: this ADR is a proposal; an explicit "go" from the operator opens Phase A's PR.

Until decisions land, this ADR sits as a planning artifact — no code changes.
