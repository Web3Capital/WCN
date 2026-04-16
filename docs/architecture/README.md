# WCN System Architecture — Master Blueprint

> Version: 2.0 | Classification: Internal — Founding Team
> Author Role: Chief Architect / CTO / Chief Scientist / Product Director
> Date: 2026-04-10 (v2.0 — Six-Pillar Architecture Optimization)

---

## Executive Summary

WCN (World Collaboration Network) is a **permissioned, AI-augmented business coordination network** for the Web3 industry. It connects capital, projects, services, and distribution resources through a structured pipeline backed by a novel consensus mechanism — Proof of Business (PoB).

This document defines the **master architecture** for the WCN platform: how the 18 systems decompose into layers, how they communicate, how data flows, how the system scales, and how it evolves from its current state (~88% built) to a fully operational ecosystem.

---

## Architecture Vision

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│   WCN is NOT a monolithic app.                                           │
│   WCN is a PLATFORM composed of DOMAIN MODULES                          │
│   connected by EVENTS, governed by PERMISSIONS,                          │
│   verified by PROOF, and settled by PROTOCOL.                            │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Design Goals (ranked)

1. **Correctness** — Financial platform; wrong settlement = catastrophic. Correctness > speed.
2. **Auditability** — Every state change traceable. Required for PoB and regulatory compliance.
3. **Modularity** — Each domain module owns its data, exposes APIs, emits events. Independent evolution.
4. **Extensibility** — New node types, new deal types, new Agent types without rewriting core.
5. **Progressive Decentralization** — Start centralized, end decentralized. Architecture must support both.
6. **Performance** — Sub-second UI, <5s for complex matching, <1min for Agent analysis.

---

## Architecture Overview (C4 — Level 1: System Context)

```
                        ┌──────────────┐
                        │  External     │
                        │  World        │
                        │  ───────────  │
                        │  Exchanges    │
                        │  Chains       │
                        │  KYC/AML      │
                        │  LLM APIs     │
                        └──────┬───────┘
                               │
                    ┌──────────▼──────────┐
                    │    WCN PLATFORM      │
                    │                      │
                    │  ┌────────────────┐  │
                    │  │  Interface     │  │ ← Web App, API Gateway, Webhooks
                    │  ├────────────────┤  │
                    │  │  Intelligence  │  │ ← Agents, Search, Analytics, Risk
                    │  ├────────────────┤  │
                    │  │  Business      │  │ ← Deals, Tasks, Distribution, Reputation
                    │  ├────────────────┤  │
                    │  │  Verification  │  │ ← Proof Desk, PoB, Settlement
                    │  ├────────────────┤  │
                    │  │  Foundation    │  │ ← Identity, Nodes, Governance, Audit
                    │  └────────────────┘  │
                    │                      │
                    │  ┌────────────────┐  │
                    │  │  Data Layer    │  │ ← PostgreSQL, Redis, Object Storage, Event Bus
                    │  └────────────────┘  │
                    └──────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Node Operators      │
                    │  ─────────────────   │
                    │  Capital Nodes       │
                    │  Project Nodes       │
                    │  Service Nodes       │
                    │  Regional Nodes      │
                    │  Media/KOL Nodes     │
                    └─────────────────────┘
```

---

## Layer Architecture (5 + 1)

| Layer | Purpose | Systems | Communication |
|-------|---------|---------|---------------|
| **L0: Data** | Persistence, caching, messaging | PostgreSQL, Redis, S3, Event Bus, Outbox | Direct access by domain modules only |
| **L1: Foundation** | Identity, trust, governance, audit | PRD-01, PRD-02, PRD-03, PRD-18 | Synchronous (every request touches L1) |
| **L2: Verification** | Evidence, proof, settlement | PRD-09, PRD-10, PRD-11 | Event-driven (PoB is async by nature) |
| **L3: Business** | Core business workflows | PRD-04, PRD-05, PRD-06, PRD-07, PRD-12, PRD-13 | Mixed (sync CRUD + async events) |
| **L4: Intelligence** | AI, analytics, risk, search | PRD-08, PRD-14, PRD-15, PRD-17 | Async (Agent runs, batch analytics) |
| **L5: Interface** | Web UI, API Gateway, Webhooks | Next.js App, REST API, Future SDK | Sync HTTP + WebSocket for real-time |

**Dependency Rule**: Upper layers depend on lower layers. Never the reverse. L3 (Business) can call L1 (Foundation) but L1 NEVER calls L3. Cross-layer communication uses events.

---

## Module Registry (18 Modules)

| ID | Module | Layer | Domain Boundary | Key Entity |
|----|--------|-------|-----------------|------------|
| M01 | `@wcn/identity` | L1 | Auth, sessions, permissions, 2FA | User, Account, Session |
| M02 | `@wcn/nodes` | L1 | Node lifecycle, seats, staking | Node, NodeSeat, Application |
| M03 | `@wcn/governance` | L1 | Proposals, voting, compliance | Proposal, Vote, ComplianceRule |
| M04 | `@wcn/projects` | L3 | Project intake, needs, materials | Project, FundingNeed, File |
| M05 | `@wcn/capital` | L3 | Capital profiles, matching engine | CapitalProfile, MatchResult |
| M06 | `@wcn/deals` | L3 | Deal rooms, milestones, participants | Deal, DealParticipant, DealMilestone |
| M07 | `@wcn/tasks` | L3 | Task dispatch, review, outputs | Task, TaskAssignment, TaskOutput |
| M08 | `@wcn/agents` | L4 | Agent lifecycle, execution, audit | Agent, AgentRun, AgentLog |
| M09 | `@wcn/proof-desk` | L2 | Evidence collection, review | Evidence, EvidencePacket |
| M10 | `@wcn/pob` | L2 | PoB generation, attribution, anti-gaming | PoBRecord, Attribution |
| M11 | `@wcn/settlement` | L2 | Settlement cycles, distribution | SettlementCycle, SettlementLine |
| M12 | `@wcn/distribution` | L3 | Campaigns, channels, listings | DistributionCampaign, ListingRecord |
| M13 | `@wcn/reputation` | L3 | Score calculation, badges, decay | ReputationRecord, PeerRating |
| M14 | `@wcn/cockpit` | L4 | Dashboards, metrics, reports | DashboardMetric, WeeklyReport |
| M15 | `@wcn/risk` | L4 | Risk rules, alerts, scoring | RiskRule, RiskAlert, RiskScore |
| M16 | `@wcn/notifications` | L4 | Multi-channel delivery, preferences | Notification, NotificationPreference |
| M17 | `@wcn/search` | L4 | Full-text search, discovery, recommendations | SearchDocument, SavedSearch |
| M18 | `@wcn/audit` | L1 | Append-only event log, compliance exports | AuditLog |

---

## Key Architecture Patterns

### 1. Domain Module Pattern
Each module is a self-contained domain with:
- **Ports** — Domain-level interfaces decoupled from infrastructure (`lib/modules/<name>/ports.ts`)
- **Barrel Exports** — Public contract enforced via `index.ts` (only importable surface)
- **Schema** — Prisma models it owns (no cross-module table writes)
- **Service** — Business logic functions (`lib/modules/<name>/service.ts`)
- **API** — REST endpoints (`app/api/<name>/`)
- **UI** — Dashboard pages (`app/dashboard/<name>/`)
- **Events** — Events it emits and events it reacts to (via `handlers.ts`)

### 2. Hexagonal Ports & Adapters
Domain logic depends on pure TypeScript interfaces (ports), never on infrastructure directly. Each of the 21 modules defines a `ports.ts` with data-access contracts using domain types — zero Prisma imports. This enables infrastructure replacement (swap database, add caching) without touching business logic.
```
lib/modules/*/ports.ts     → 21 port interfaces (domain contracts)
lib/modules/*/index.ts     → 21 barrel exports (public API surface)
```

### 3. Event Sovereignty
Each module owns its event reactions in a dedicated `handlers.ts` file. The central `lib/core/event-handlers.ts` is a thin 47-line orchestrator that calls each module's `init*Handlers()` function — no "God Object" that knows about all business logic.
```
lib/modules/deals/handlers.ts       → deal event reactions
lib/modules/matching/handlers.ts    → matching event reactions
lib/modules/evidence/handlers.ts    → evidence event reactions
...11 modules total
lib/core/event-handlers.ts          → orchestrator (calls init functions)
```

### 4. Event-Driven Choreography
Modules communicate through domain events, not direct function calls:
```
Deal closed → emits "deal.closed"
  → @wcn/proof-desk listens → creates EvidencePacket
  → @wcn/notifications listens → notifies participants
  → @wcn/cockpit listens → updates metrics
  → @wcn/audit listens → logs event
```

### 5. Transactional Outbox
Critical state changes are paired with event writes in a single database transaction via the `Outbox` Prisma model. A cron-based poller (`processOutbox()`) delivers undelivered events, with retry tracking and error recording. This guarantees no event is lost even if the in-process bus fails.
```
lib/core/outbox.ts          → writeToOutbox(), processOutbox(), cleanupOutbox()
prisma/schema.prisma         → Outbox model (eventName, payload, delivered, retryCount)
app/api/cron/route.ts        → polls outbox on schedule
```

### 6. Contract-First Boundaries
Module isolation is enforced mechanically, not by convention:
- **ESLint** `no-restricted-imports` rules (`lib/modules/.eslintrc.json`) block direct imports of module internals across boundaries
- **dependency-cruiser** (`.dependency-cruiser.cjs`) detects cross-module internal imports and circular dependencies in CI
- Only `ports.ts`, `index.ts`, and `types.ts` are importable from outside a module

### 7. Extension Registry
New business capabilities (node types, deal types, agent types, settlement methods) are added via registration, not core code modification. A generic `ExtensionPoint<TConfig, THandler>` pattern (`lib/core/registry.ts`) powers four domain registries:
```
lib/modules/nodes/registry.ts       → 5 built-in node types
lib/modules/agents/registry.ts      → 4 built-in agent types
lib/modules/deals/registry.ts       → 3 built-in deal types
lib/modules/settlement/registry.ts  → 3 settlement methods with calculators
```

### 8. State Machine Enforcement
All lifecycle entities use explicit state machines consolidated in `lib/core/state-machine.ts`. Legacy files under `lib/state-machines/` are deprecated re-export shims.
- Account: ACTIVE ↔ SUSPENDED ↔ LOCKED → OFFBOARDED
- Node: PENDING → ACTIVE ↔ PROBATION → SUSPENDED → OFFBOARDED
- Deal: DRAFT → ACTIVE → DD → NEGOTIATION → CLOSING → CLOSED
- Task: TODO → IN_PROGRESS → IN_REVIEW → DONE
- Evidence: DRAFT → SUBMITTED → IN_REVIEW → APPROVED
- Settlement: OPEN → CALCULATING → IN_REVIEW → APPROVED → DISTRIBUTING → COMPLETED

### 9. Permission-Scoped Data Access
Every data query passes through permission middleware:
```
Request → Auth (who) → Scope (what node) → Redact (what fields) → Response
```
The `withAuth()` HOF (`lib/core/with-auth.ts`) standardizes this check for all API routes — session validation, account status, role, and permission in one wrapper.

### 10. Observability
Request-level correlation and metrics are built into the platform:
- **Request ID** — `X-Request-Id` injected by `middleware.ts` on every response (`lib/core/request-id.ts`)
- **Metrics** — In-process counters and histograms (`lib/core/metrics.ts`), exposed at `/api/metrics` in Prometheus format
- **Health** — Expanded `/api/health` with outbox queue depth, memory usage, event bus stats, Node.js version

### 11. CQRS for Complex Domains
Write path and read path are separated for:
- **PoB** (write: evidence → verification → attribution; read: aggregated scores)
- **Settlement** (write: cycle management; read: node-level summary)
- **Cockpit** (read-only materialized views from all other domains)

---

## Document Index

| # | Document | Description |
|---|----------|-------------|
| 01 | [Design Principles](./01-principles.md) | Architectural axioms and trade-off decisions |
| 02 | [Layer Architecture](./02-layer-architecture.md) | Detailed 5+1 layer design with interfaces |
| 03 | [Module Map](./03-module-map.md) | 22-module decomposition, boundaries, dependencies |
| 04 | [Data Architecture](./04-data-architecture.md) | Data ownership, flow patterns, storage strategy |
| 05 | [API Architecture](./05-api-architecture.md) | REST conventions, versioning, gateway design |
| 06 | [Event Architecture](./06-event-architecture.md) | Event bus, domain events, saga patterns |
| 07 | [Security Architecture](./07-security-architecture.md) | Zero-trust, RBAC, encryption, compliance |
| 08 | [Deployment & Scaling](./08-deployment-scaling.md) | Infrastructure, CI/CD, horizontal scaling |
| 09 | [Evolution Roadmap](./09-evolution-roadmap.md) | Phase 1→5 development plan with milestones |
| 10 | [Compliance Roadmap](./10-compliance-roadmap.md) | Sanctions screening, KYC/KYB, AML, regulatory reporting |

> **See also**: [Glossary](../glossary.md) — Authoritative definitions for all domain terms, enums, roles, and statuses.

---

## Current State → Target State

```
CURRENT (2026-04, v2.0)                   TARGET (2027-Q2)
────────────────────                      ────────────────
Modular monolith (Next.js)    →           Extractable domain microservices
45 Prisma models (+Outbox)    →           50+ models with clear ownership boundaries
77+ API routes (event-driven) →           77+ routes + real-time subscriptions
Event bus + Outbox + 178 tests→           Distributed event bus (Redis Streams)
21 hexagonal ports (all mods) →           Full adapter implementations per module
11 per-module event handlers  →           Per-module handlers + Redis consumer groups
Contract-first (ESLint+DC)    →           Zero boundary violations in CI
4 extension registries        →           Plugin marketplace for third-party extensions
Multi-factor matching engine  →           + Agent-generated match memos
PoB attribution engine        →           + on-chain anchoring
Anti-gaming v1 (self-dealing) →           + ML-based anomaly detection
Settlement pipeline (full)    →           + crypto/fiat payment execution
Email notifications (Resend)  →           Multi-channel (email + push + in-app)
Rate limiting (fail-closed)   →           + DDoS protection at edge
withAuth() + safe-error       →           Full zero-trust middleware chain
Prometheus metrics endpoint   →           Grafana dashboards + alerting
X-Request-Id correlation      →           OpenTelemetry distributed tracing
Agent SDK + 4 Agent types     →           Scheduled runs + Agent marketplace
```
