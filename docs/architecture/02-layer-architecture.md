# 02 — Layer Architecture

> Five functional layers + one data layer. Each layer has a clear purpose, defined interfaces, and strict dependency direction.

---

## Layer Dependency Rule

```
L5 Interface    ──→ calls ──→  L4, L3, L2, L1
L4 Intelligence ──→ calls ──→  L3, L2, L1
L3 Business     ──→ calls ──→  L2, L1
L2 Verification ──→ calls ──→  L1
L1 Foundation   ──→ calls ──→  L0
L0 Data         ──→ (base)

NEVER: Lower layer calls upper layer.
CROSS-LAYER: Use events, not direct calls.
```

---

## L0: Data Layer

### Purpose
Persistent storage, caching, file storage, and message transport. No business logic lives here.

### Components

| Component | Technology | Purpose | Current Status |
|-----------|------------|---------|----------------|
| **Primary DB** | PostgreSQL 16 (via Prisma) | All structured data (45 models) | ✅ Running |
| **Cache** | Redis 7 (Upstash) | Rate limiting, matching cache | ⚠️ Partial (rate limiting only) |
| **Object Storage** | S3-compatible (Vercel Blob / AWS S3) | File uploads, materials, exports | ⚠️ Partial (File model exists, no S3) |
| **Event Bus** | In-process EventBus (`lib/core/event-bus.ts`) | Domain event transport | ✅ Running (50+ event types, 11 handler modules) |
| **Outbox** | PostgreSQL (`Outbox` model + `lib/core/outbox.ts`) | Reliable event delivery with retry | ✅ Running (cron-polled, fail-safe) |
| **Search Index** | PostgreSQL FTS → MeiliSearch (future) | Full-text search | ⚠️ Partial (SearchDocument model) |
| **Metrics** | In-process (`lib/core/metrics.ts`) → Prometheus | Counters, histograms, API latency | ✅ Running (`/api/metrics` endpoint) |

### Data Ownership Rules

```
@wcn/identity  owns: User, Account, Session, VerificationToken
@wcn/nodes     owns: Node, NodeSeat, StakeLedger, Application, Invite
@wcn/governance owns: Proposal, Vote, ComplianceRule, ApprovalAction, EntityFreeze
@wcn/audit     owns: AuditLog (append-only, no other module writes)

@wcn/projects  owns: Project, FundingNeed, ServiceNeed, ProjectMaterial
@wcn/capital   owns: CapitalProfile, MatchResult
@wcn/deals     owns: Deal, DealParticipant, DealMilestone, DealNote
@wcn/tasks     owns: Task, TaskAssignment, TaskOutput
@wcn/distribution owns: DistributionCampaign, DistributionChannel, ListingRecord

@wcn/proof-desk owns: Evidence, EvidencePacket, Review
@wcn/pob       owns: PoBRecord, Attribution, Confirmation, Dispute
@wcn/settlement owns: SettlementCycle, SettlementLine

@wcn/agents    owns: Agent, AgentPermission, AgentRun, AgentLog
@wcn/cockpit   owns: DashboardMetric, WeeklyReport (read from all, write to own)
@wcn/risk      owns: RiskRule, RiskAlert, RiskScore, RiskFlag
@wcn/notifications owns: Notification, NotificationPreference
@wcn/search    owns: SearchDocument, SavedSearch

Shared: File, FileAccessLog, Workspace, WorkspaceMembership, RoleAssignment
Cross-cutting: Outbox (reliable event delivery, owned by lib/core/outbox.ts)
```

---

## L1: Foundation Layer

### Purpose
Provides identity, trust, governance, and auditability to all upper layers. Every request to WCN passes through L1 for authentication and authorization.

### Modules

#### M01: `@wcn/identity`
```
Responsibility: Who are you? What can you do?
─────────────────────────────────────────────
Provides:
  - Authentication (email/password, OAuth, 2FA)
  - Session management (JWT issuance, validation, revocation)
  - Permission resolution (role + node + grant → effective permissions)
  - Account lifecycle (active, suspended, locked, offboarded)

Exposes to upper layers:
  - getCurrentUser(token) → User + permissions
  - hasPermission(userId, resource, action) → boolean
  - getUsersByNode(nodeId) → User[]

Events emitted:
  - user.created, user.login, user.login_failed
  - user.role_changed, user.suspended, user.locked
```

#### M02: `@wcn/nodes`
```
Responsibility: What organizational entity do you represent?
────────────────────────────────────────────────────────────
Provides:
  - Node CRUD and lifecycle management
  - Application intake and review workflow
  - Seat/tier management
  - Node capability registry (what each node can do)
  - Member management (users within a node)

Exposes to upper layers:
  - getNode(id) → Node + capabilities
  - getNodesByType(type) → Node[]
  - getNodeCapabilities(nodeId) → CapabilityProfile
  - isNodeActive(nodeId) → boolean

Events emitted:
  - node.created, node.activated, node.suspended
  - node.application_submitted, node.application_approved
  - node.member_added, node.member_removed
```

#### M03: `@wcn/governance`
```
Responsibility: Who decides what? How are rules enforced?
─────────────────────────────────────────────────────────
Provides:
  - Approval workflows (admin actions requiring confirmation)
  - Entity freeze (emergency blocking)
  - Future: Proposal/vote system
  - Future: Compliance rule engine

Exposes to upper layers:
  - requireApproval(action, entity) → ApprovalRequest
  - checkCompliance(action, jurisdiction) → boolean
  - isEntityFrozen(entityId) → boolean

Events emitted:
  - approval.requested, approval.granted, approval.denied
  - entity.frozen, entity.unfrozen
  - proposal.created, proposal.passed (future)
```

#### M18: `@wcn/audit`
```
Responsibility: What happened, when, and who did it?
────────────────────────────────────────────────────
Provides:
  - Append-only audit logging
  - Query interface for audit data
  - Export for compliance

Exposes to upper layers:
  - audit(event) → void (fire-and-forget)
  - queryAuditLog(filters) → AuditEntry[] (admin only)
  - exportAuditLog(dateRange, format) → File

Events emitted:
  - None (audit is a sink, not a source)

Events consumed:
  - ALL events from ALL modules (audit listens to everything)
```

---

## L2: Verification Layer

### Purpose
Converts business outcomes into verifiable proof and distributable value. This layer is what makes WCN unique — it's the PoB consensus engine.

### Flow
```
Business outcome (L3) → Evidence collection (L2) → PoB verification (L2) → Settlement (L2)
     Deal closed    →    Evidence Packet     →    Attribution calc    →    Value distribution
```

#### M09: `@wcn/proof-desk`
```
Responsibility: Collect and validate evidence that business happened.
──────────────────────────────────────────────────────────────────
Consumes events:
  - deal.closed → auto-create Evidence Packet draft
  - task.completed → available as evidence item

Provides:
  - Evidence Packet assembly and completeness checking
  - Reviewer assignment with conflict-of-interest prevention
  - Review workflow (approve, request more, reject)

Events emitted:
  - evidence.packet_submitted, evidence.packet_approved, evidence.packet_rejected
```

#### M10: `@wcn/pob`
```
Responsibility: Generate immutable PoB events with attribution.
───────────────────────────────────────────────────────────────
Consumes events:
  - evidence.packet_approved → generate PoB event

Provides:
  - Attribution calculation engine
  - Anti-gaming checks (circular, wash, self-dealing)
  - PoB event management (immutable after creation)
  - Dispute handling

Events emitted:
  - pob.created, pob.flagged, pob.attribution_calculated
  - pob.dispute_raised, pob.dispute_resolved
```

#### M11: `@wcn/settlement`
```
Responsibility: Convert PoB attribution into actual value distribution.
─────────────────────────────────────────────────────────────────────
Consumes events:
  - pob.created → include in next settlement cycle

Provides:
  - Settlement cycle management (create, calculate, review, distribute)
  - Multi-currency support (fiat, USDC, future token)
  - Fee calculation and deduction
  - Export for accounting

Events emitted:
  - settlement.cycle_created, settlement.calculated
  - settlement.approved, settlement.distributed
```

---

## L3: Business Layer

### Purpose
Core business workflows that generate the outcomes L2 verifies. This is where deals happen, tasks get done, and value is created.

#### M04: `@wcn/projects` — Project intake, structured needs, materials
#### M05: `@wcn/capital` — Capital profiles, matching engine, pipeline
#### M06: `@wcn/deals` — Multi-party deal rooms with milestones
#### M07: `@wcn/tasks` — Task dispatch, assignment, review, outputs
#### M12: `@wcn/distribution` — Market entry coordination
#### M13: `@wcn/reputation` — PoB-driven credibility scoring

### Critical Business Flow (End-to-End)

```
PROJECT ENTERS (M04)
  ↓ project.created event
CAPITAL MATCHING (M05)
  ↓ match.generated event
DEAL ROOM OPENS (M06)
  ↓ deal.created event
TASKS DISPATCHED (M07)
  ↓ task.assigned event
AGENTS ASSIST (M08, L4)
  ↓ agent.output_generated event
DEAL CLOSES (M06)
  ↓ deal.closed event
EVIDENCE COLLECTED (M09, L2)
  ↓ evidence.packet_approved event
POB GENERATED (M10, L2)
  ↓ pob.created event
REPUTATION UPDATED (M13)
  ↓ reputation.score_changed event
SETTLEMENT DISTRIBUTED (M11, L2)
  ↓ settlement.distributed event
DISTRIBUTION BEGINS (M12)
  ↓ distribution.campaign_started event
```

---

## L4: Intelligence Layer

### Purpose
AI capabilities, analytics, risk detection, and information retrieval that augment human decision-making across all business workflows.

#### M08: `@wcn/agents`
```
4 Agent types, each with specific capabilities:
  Research Agent  → project analysis, market research, competitor reports
  Deal Agent      → matching optimization, match memos, due diligence assists
  Execution Agent → meeting notes, action items, follow-up tracking
  Growth Agent    → content generation, distribution planning, attribution

Integration architecture:
  Agent SDK → LLM Router → (OpenAI | Anthropic | Gemini) → Output → Human Review
```

#### M14: `@wcn/cockpit` — Aggregated analytics from all modules
#### M15: `@wcn/risk` — Rule-based + pattern-based risk detection
#### M16: `@wcn/notifications` — Multi-channel delivery engine
#### M17: `@wcn/search` — Full-text search + recommendation engine

---

## L5: Interface Layer

### Purpose
How users and external systems interact with WCN. Currently a Next.js web application; future includes mobile, CLI, and SDK.

### Components

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Web App** | Next.js 14 (App Router, RSC) | Primary user interface |
| **API Gateway** | Next.js API routes + middleware.ts | RESTful API for all modules |
| **Auth Middleware** | NextAuth + JWT + `withAuth()` HOF (`lib/core/with-auth.ts`) | Standardized auth: session + account status + role + permission in one wrapper |
| **Request Correlation** | `X-Request-Id` header (`lib/core/request-id.ts` + `middleware.ts`) | Every response carries a unique request ID for tracing |
| **Error Sanitization** | `lib/core/safe-error.ts` | Production errors return generic messages; no stack traces or internal details exposed |
| **Security Headers** | `next.config.mjs` `headers()` | HSTS, X-Frame-Options, X-Content-Type-Options, Permissions-Policy, Referrer-Policy |
| **Observability** | `/api/metrics` (Prometheus) + `/api/health` (expanded) | Metrics export, health check with outbox/memory/event bus stats |
| **Real-time** | Future: WebSocket / SSE | Live updates for deals, tasks, notifications |
| **Webhooks** | Future: outbound webhook system | External system integration |
| **SDK** | Future: `@wcn/sdk` npm package | Programmatic access for node operators |

### Routing Convention
```
Public pages:     app/(marketing)/    → /, /about, /how-it-works, /nodes, /pob
Public content:   app/wiki/           → /wiki, /wiki/[...slug]
Auth pages:       app/(auth)/         → /login, /signup, /apply
Dashboard:        app/dashboard/      → /dashboard, /dashboard/[module]
API:              app/api/            → /api/[module]
```

---

## Layer Interaction Matrix

| From ↓ \ To → | L0 Data | L1 Foundation | L2 Verification | L3 Business | L4 Intelligence |
|---|---|---|---|---|---|
| **L5 Interface** | — | ✅ Auth check | ✅ Read | ✅ CRUD | ✅ Trigger |
| **L4 Intelligence** | ✅ Read | ✅ Auth check | ✅ Read | ✅ Read | ✅ Internal |
| **L3 Business** | ✅ Read/Write | ✅ Auth check | ✅ Via events | ✅ Internal | — |
| **L2 Verification** | ✅ Read/Write | ✅ Auth check | ✅ Internal | — | — |
| **L1 Foundation** | ✅ Read/Write | ✅ Internal | — | — | — |
