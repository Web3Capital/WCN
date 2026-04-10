# WCN System Architecture — Master Blueprint

> Version: 1.0 | Classification: Internal — Founding Team
> Author Role: Chief Architect / CTO / Chief Scientist / Product Director
> Date: 2026-04-09

---

## Executive Summary

WCN (World Collaboration Network) is a **permissioned, AI-augmented business coordination network** for the Web3 industry. It connects capital, projects, services, and distribution resources through a structured pipeline backed by a novel consensus mechanism — Proof of Business (PoB).

This document defines the **master architecture** for the WCN platform: how the 18 systems decompose into layers, how they communicate, how data flows, how the system scales, and how it evolves from its current state (50% built) to a fully operational ecosystem.

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
| **L0: Data** | Persistence, caching, messaging | PostgreSQL, Redis, S3, Event Bus | Direct access by domain modules only |
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
- **Schema** — Prisma models it owns (no cross-module table writes)
- **Service** — Business logic functions (`lib/modules/<name>/service.ts`)
- **API** — REST endpoints (`app/api/<name>/`)
- **UI** — Dashboard pages (`app/dashboard/<name>/`)
- **Events** — Events it emits and events it listens to

### 2. Event-Driven Choreography
Modules communicate through domain events, not direct function calls:
```
Deal closed → emits "deal.closed"
  → @wcn/proof-desk listens → creates EvidencePacket
  → @wcn/notifications listens → notifies participants
  → @wcn/cockpit listens → updates metrics
  → @wcn/audit listens → logs event
```

### 3. State Machine Enforcement
All lifecycle entities use explicit state machines (already in `lib/state-machines/`):
- Account: ACTIVE ↔ SUSPENDED ↔ LOCKED → OFFBOARDED
- Node: PENDING → ACTIVE ↔ PROBATION → SUSPENDED → OFFBOARDED
- Deal: DRAFT → ACTIVE → DD → NEGOTIATION → CLOSING → CLOSED
- Task: TODO → IN_PROGRESS → IN_REVIEW → DONE
- Evidence: DRAFT → SUBMITTED → IN_REVIEW → APPROVED
- Settlement: OPEN → CALCULATING → IN_REVIEW → APPROVED → DISTRIBUTING → COMPLETED

### 4. Permission-Scoped Data Access
Every data query passes through permission middleware:
```
Request → Auth (who) → Scope (what node) → Redact (what fields) → Response
```

### 5. CQRS for Complex Domains
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
| 03 | [Module Map](./03-module-map.md) | 18-module decomposition, boundaries, dependencies |
| 04 | [Data Architecture](./04-data-architecture.md) | Data ownership, flow patterns, storage strategy |
| 05 | [API Architecture](./05-api-architecture.md) | REST conventions, versioning, gateway design |
| 06 | [Event Architecture](./06-event-architecture.md) | Event bus, domain events, saga patterns |
| 07 | [Security Architecture](./07-security-architecture.md) | Zero-trust, RBAC, encryption, compliance |
| 08 | [Deployment & Scaling](./08-deployment-scaling.md) | Infrastructure, CI/CD, horizontal scaling |
| 09 | [Evolution Roadmap](./09-evolution-roadmap.md) | Phase 1→5 development plan with milestones |

---

## Current State → Target State

```
CURRENT (2026-04)                         TARGET (2027-Q2)
─────────────────                         ────────────────
Monolith Next.js app          →           Modular monolith with extractable domains
44 Prisma models              →           44+ models with clear ownership boundaries
73 API routes (CRUD-level)    →           73+ routes + event-driven side effects
UI framework (CRUD consoles)  →           Full workflow UIs with real-time updates
No Agent AI integration       →           4 Agent types with LLM backends
No matching engine            →           Multi-factor matching with Agent memos
No payment execution          →           Crypto + fiat settlement execution
No email delivery             →           Multi-channel notification delivery
Manual PoB                    →           Semi-automated PoB with anti-gaming
```
