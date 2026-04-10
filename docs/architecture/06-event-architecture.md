# 06 — Event Architecture

> Domain events, event bus design, saga patterns, and eventual consistency strategy.

---

## Why Event-Driven?

WCN's business logic is inherently **reactive**: when a deal closes, seven things need to happen across five modules. Without events:

```
// Tightly coupled nightmare ❌
async function closeDeal(dealId) {
  await updateDealStatus(dealId, "CLOSED_WON");
  await createEvidencePacket(dealId);        // proof-desk module
  await notifyParticipants(dealId);          // notifications module
  await updateProjectStatus(dealId);         // projects module
  await updateCapitalDeployment(dealId);     // capital module
  await updateCockpitMetrics();              // cockpit module
  await logAuditEvent(dealId);              // audit module
}
```

With events:
```
// Loosely coupled ✅
async function closeDeal(dealId) {
  await updateDealStatus(dealId, "CLOSED_WON");
  await emit("deal.closed", { dealId });     // one line. Everyone else reacts.
}
```

---

## Event Bus — Progressive Implementation

### Phase 1: In-Process Event Emitter (Implemented)

The in-process EventBus is running in production (`lib/core/event-bus.ts`). It handles 50+ event types with 11 per-module handler registrations.

```typescript
// lib/core/event-bus.ts (implemented)
type EventHandler = (payload: unknown) => Promise<void>;

class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();

  on(event: string, handler: EventHandler) {
    const existing = this.handlers.get(event) || [];
    existing.push(handler);
    this.handlers.set(event, existing);
  }

  async emit(event: string, payload: unknown) {
    const handlers = this.handlers.get(event) || [];
    await Promise.allSettled(
      handlers.map(h => h(payload).catch(err => {
        console.error(`Event handler failed for ${event}:`, err);
      }))
    );
  }
}

export const eventBus = new EventBus();
```

**Pros**: Zero infrastructure, works in Vercel serverless, simple debugging.
**Cons**: Events lost if process crashes mid-handling, no replay.
**Mitigation**: The Transactional Outbox (see below) provides durability for critical events without requiring external infrastructure.

### Phase 2: Redis Streams (When Volume Exceeds In-Process)

```
Redis Streams:
  Stream: wcn:events
  Consumer Groups: proof-desk, notifications, cockpit, audit, search, risk
  Each group independently tracks its read position
  Failed messages go to Pending Entries List for retry
```

**Migration**: Same event names and payloads. Only the transport changes. Handlers register with Redis consumer group instead of in-process emitter.

### Phase 3: Kafka / NATS (When Multi-Service)

If/when WCN splits into separate services, Kafka provides:
- Durable event log (replay from any point)
- Partitioned processing (parallel consumers)
- Cross-service communication
- Event sourcing foundation

---

## Domain Event Catalog

### Naming Convention
```
{entity}.{past_tense_verb}

Examples:
  deal.created         (not deal.create — events describe what happened)
  task.completed       (not task.complete)
  evidence.approved    (not evidence.approve)
  settlement.distributed
```

### Complete Event Registry

#### Foundation Layer (L1)

```yaml
# @wcn/identity
user.created:
  payload: { userId, email, role }
  consumers: [audit, notifications, search]

user.login:
  payload: { userId, ip, device, method }
  consumers: [audit, risk]

user.login_failed:
  payload: { email, ip, attempt_count }
  consumers: [audit, risk]

user.role_changed:
  payload: { userId, oldRole, newRole, changedBy }
  consumers: [audit, notifications]

user.suspended:
  payload: { userId, reason, suspendedBy }
  consumers: [audit, notifications]

user.locked:
  payload: { userId, reason }
  consumers: [audit, notifications, risk]

# @wcn/nodes
node.created:
  payload: { nodeId, type, name, ownerId }
  consumers: [audit, search, cockpit]

node.activated:
  payload: { nodeId, activatedBy }
  consumers: [audit, notifications, cockpit, search]

node.suspended:
  payload: { nodeId, reason, suspendedBy }
  consumers: [audit, notifications, risk, cockpit]

application.submitted:
  payload: { applicationId, applicantName, nodeType }
  consumers: [audit, notifications]

application.approved:
  payload: { applicationId, nodeId, approvedBy }
  consumers: [audit, notifications]

# @wcn/governance
approval.requested:
  payload: { approvalId, action, entityType, entityId, requestedBy }
  consumers: [audit, notifications]

approval.granted:
  payload: { approvalId, grantedBy }
  consumers: [audit, notifications]

entity.frozen:
  payload: { entityType, entityId, frozenBy, reason }
  consumers: [audit, notifications, risk]
```

#### Business Layer (L3)

```yaml
# @wcn/projects
project.created:
  payload: { projectId, nodeId, sector, stage }
  consumers: [audit, search, cockpit, capital(trigger matching)]

project.updated:
  payload: { projectId, changedFields }
  consumers: [audit, search, capital(re-match if criteria changed)]

project.status_changed:
  payload: { projectId, oldStatus, newStatus }
  consumers: [audit, cockpit, notifications]

# @wcn/capital
match.generated:
  payload: { matchId, projectId, capitalNodeId, score }
  consumers: [audit, notifications]

capital.profile_updated:
  payload: { capitalProfileId, nodeId, changedFields }
  consumers: [audit, search]

# @wcn/deals
deal.created:
  payload: { dealId, projectId, leadNodeId, dealType }
  consumers: [audit, tasks(auto-DD-checklist), agents(assign-execution), cockpit, notifications]

deal.stage_changed:
  payload: { dealId, oldStage, newStage, changedBy }
  consumers: [audit, notifications, cockpit, risk(check velocity)]

deal.participant_added:
  payload: { dealId, nodeId, userId, role }
  consumers: [audit, notifications]

deal.closed:
  payload: { dealId, outcome, totalAmount }
  consumers: [audit, proof-desk(create-packet), projects(update-status), capital(update-deployment), cockpit, notifications]

# @wcn/tasks
task.created:
  payload: { taskId, dealId, assigneeId, assigneeType }
  consumers: [audit, notifications]

task.assigned:
  payload: { taskId, assigneeId, assigneeNodeId }
  consumers: [audit, notifications]

task.completed:
  payload: { taskId, dealId, outputs }
  consumers: [audit, notifications, proof-desk(add-evidence-item)]

task.overdue:
  payload: { taskId, assigneeId, dueDate }
  consumers: [notifications, risk]

# @wcn/distribution (future)
distribution.campaign_started:
  payload: { campaignId, projectId }
  consumers: [audit, cockpit, notifications]
```

#### Verification Layer (L2)

```yaml
# @wcn/proof-desk
evidence.packet_created:
  payload: { packetId, dealId }
  consumers: [audit]

evidence.submitted:
  payload: { packetId, submittedBy }
  consumers: [audit, notifications(notify-reviewers)]

evidence.approved:
  payload: { packetId, dealId, reviewerId }
  consumers: [audit, pob(generate-pob-event), notifications]

evidence.rejected:
  payload: { packetId, reason, reviewerId }
  consumers: [audit, notifications]

# @wcn/pob
pob.created:
  payload: { pobId, dealId, totalValue, attributions }
  consumers: [audit, settlement(include-in-cycle), reputation(update-score), cockpit, notifications]

pob.flagged:
  payload: { pobId, reason, flaggedBy }
  consumers: [audit, risk, notifications]

pob.dispute_raised:
  payload: { disputeId, pobId, raisedBy }
  consumers: [audit, notifications]

# @wcn/settlement
settlement.cycle_created:
  payload: { cycleId, periodStart, periodEnd }
  consumers: [audit]

settlement.calculated:
  payload: { cycleId, totalEntries, totalAmount }
  consumers: [audit, notifications(notify-admin)]

settlement.approved:
  payload: { cycleId, approvedBy }
  consumers: [audit]

settlement.distributed:
  payload: { cycleId, totalDistributed, nodeCount }
  consumers: [audit, notifications(notify-all-nodes), cockpit]
```

#### Intelligence Layer (L4)

```yaml
# @wcn/agents
agent.run_started:
  payload: { runId, agentId, agentType, triggeredBy }
  consumers: [audit]

agent.output_generated:
  payload: { runId, agentId, outputType, output }
  consumers: [audit, tasks(create-review-task if needed)]

agent.output_reviewed:
  payload: { runId, reviewStatus, reviewedBy }
  consumers: [audit]

# @wcn/risk
risk.alert_created:
  payload: { alertId, ruleId, entityType, entityId, severity }
  consumers: [audit, notifications, governance(auto-freeze if critical)]

risk.alert_resolved:
  payload: { alertId, resolvedBy, resolution }
  consumers: [audit]
```

---

## Event Sovereignty — Per-Module Handler Ownership

Each module owns its event reactions in a dedicated `handlers.ts` file. The central `lib/core/event-handlers.ts` is a thin orchestrator (47 lines) that imports and calls each module's initialization function. This replaces the previous "God Object" pattern where a single 668-line file contained all event handling logic.

### Per-Module Handler Pattern

```typescript
// lib/modules/evidence/handlers.ts — Evidence module owns its reactions
import { eventBus } from "@/lib/core/event-bus";

let _initialized = false;

export function initEvidenceHandlers(): void {
  if (_initialized) return;
  _initialized = true;

  eventBus.on("deal.closed", async (payload) => {
    const { dealId } = payload as { dealId: string };
    await assemblePacketForDeal(dealId);
  });

  eventBus.on("task.completed", async (payload) => {
    const { taskId, dealId } = payload as { taskId: string; dealId: string };
    await addEvidenceFromTask(taskId, dealId);
  });
}
```

### Central Orchestrator

```typescript
// lib/core/event-handlers.ts — thin orchestrator, ~47 lines
import { initAuditHandler } from "./handlers/audit";
import { initDealHandlers } from "@/lib/modules/deals/handlers";
import { initMatchingHandlers } from "@/lib/modules/matching/handlers";
import { initEvidenceHandlers } from "@/lib/modules/evidence/handlers";
import { initPobHandlers } from "@/lib/modules/pob/handlers";
import { initSettlementHandlers } from "@/lib/modules/settlement/handlers";
import { initReputationHandlers } from "@/lib/modules/reputation/handlers";
import { initRiskHandlers } from "@/lib/modules/risk/handlers";
import { initAgentHandlers } from "@/lib/modules/agents/handlers";
import { initNotificationHandlers } from "@/lib/modules/notification/handlers";
import { initSearchHandlers } from "@/lib/modules/search/handlers";
import { initRealtimeHandlers } from "@/lib/modules/realtime/handlers";

export function initEventHandlers(): void {
  initAuditHandler();       // universal audit listener (lib/core/handlers/audit.ts)
  initDealHandlers();
  initMatchingHandlers();
  initEvidenceHandlers();
  initPobHandlers();
  initSettlementHandlers();
  initReputationHandlers();
  initRiskHandlers();
  initAgentHandlers();
  initNotificationHandlers();
  initSearchHandlers();
  initRealtimeHandlers();
}
```

### Benefits of Event Sovereignty

- **Module autonomy**: Changing how matching reacts to `project.created` requires editing only `lib/modules/matching/handlers.ts`
- **Testability**: Each handler module can be tested in isolation
- **Discoverability**: `grep` for event reactions is scoped to one file per module
- **No God Object**: No single file grows unboundedly with every new event reaction

---

## Saga Pattern — Multi-Step Workflows

For operations that span multiple modules and require compensation on failure:

### Settlement Saga

```
┌─────────────────────────────────────────────────────────────────┐
│ SETTLEMENT SAGA                                                  │
│                                                                  │
│  1. CreateCycle        ──→ success ──→ 2. AggregatePOB          │
│       ↓ fail                              ↓ success              │
│     (abort)                          3. Calculate               │
│                                           ↓ success              │
│                                      4. AdminReview             │
│                                           ↓ approved             │
│                                      5. Distribute              │
│                                        ↓ partial fail            │
│                                   5a. RetryFailed              │
│                                        ↓ all done               │
│                                      6. Complete                │
│                                                                  │
│  Compensation:                                                   │
│    Step 5 fail → Mark entries as FAILED, keep cycle DISTRIBUTING│
│    Step 4 rejected → Reopen cycle, allow re-calculation         │
│    Step 3 error → Reset cycle to OPEN, log error                │
└─────────────────────────────────────────────────────────────────┘
```

### Deal Close Saga

```
1. Validate deal can close (state machine check)
2. Update deal status to CLOSED_WON
3. Emit deal.closed event (triggers cascading handlers)
4. If any critical handler fails (e.g., audit log fails):
   → Retry 3 times with exponential backoff
   → If still fails: flag for manual intervention, DO NOT rollback deal close
```

**Design decision**: Deal close is the source of truth. Downstream effects are eventually consistent. We never rollback a deal close because a notification failed.

---

## Idempotency

All event handlers MUST be idempotent. The same event delivered twice must produce the same result.

```typescript
// ❌ Not idempotent
eventBus.on("deal.closed", async ({ dealId }) => {
  await prisma.evidencePacket.create({ data: { dealId } }); // creates duplicate!
});

// ✅ Idempotent
eventBus.on("deal.closed", async ({ dealId }) => {
  await prisma.evidencePacket.upsert({
    where: { dealId },
    create: { dealId, status: "DRAFT" },
    update: {}, // no-op if already exists
  });
});
```

---

## Transactional Outbox — Reliable Event Delivery

The in-process EventBus is fast but best-effort: if the process crashes mid-handling, events are lost. For critical state changes, the **Transactional Outbox** pattern guarantees atomicity between the state change and the event.

### How It Works

```
1. Service function opens a Prisma transaction
2. State change and event write happen in the SAME transaction:
     prisma.$transaction([
       prisma.deal.update({ status: "CLOSED_WON" }),
       writeToOutbox(tx, "deal.closed", { dealId, totalAmount })
     ])
3. Both persist atomically (or neither does)
4. Cron job (app/api/cron/route.ts) polls undelivered Outbox rows
5. For each: emit to EventBus → mark delivered → record deliveredAt
6. On failure: increment retryCount, record lastError, retry next cycle
7. After 10 retries: row stays for manual investigation (acts as DLQ)
8. Weekly cleanup removes delivered events older than 30 days
```

### Outbox Schema

```prisma
model Outbox {
  id          String   @id @default(cuid())
  eventName   String
  payload     Json
  actorId     String?
  requestId   String?
  delivered   Boolean  @default(false)
  deliveredAt DateTime?
  retryCount  Int      @default(0)
  lastError   String?
  createdAt   DateTime @default(now())

  @@index([delivered, createdAt])
  @@index([eventName])
}
```

### API

```typescript
// lib/core/outbox.ts
writeToOutbox(tx, eventName, payload, opts?)  // use inside Prisma transaction
processOutbox(batchSize?)                     // poll + emit (called by cron)
cleanupOutbox(retentionDays?)                 // remove old delivered events
getOutboxMetrics()                            // pending/failed/oldest (used by /api/health)
```

### Monitoring

The `/api/health` endpoint includes outbox metrics: pending count, failed count (retryCount > 0), and age of the oldest undelivered event. This enables alerting on delivery backlogs.

---

## Dead Letter Queue

The Outbox model doubles as the Dead Letter Queue. Events that fail after 10 retries remain in the table with `delivered: false` and `retryCount >= 10` for manual investigation. The admin health endpoint surfaces these as "failed" outbox entries.

```
Outbox rows where:
  delivered = false AND retryCount >= 10
  → Visible in /api/health as "failedCount"
  → Manual investigation: inspect payload + lastError
  → Resolution: fix root cause, reset retryCount to 0, or delete
```
