# 03 — Module Map

> 18 modules, their boundaries, dependencies, interfaces, and filesystem layout.

---

## Module Anatomy

Every module follows the same internal structure:

```
lib/modules/<module-name>/
├── service.ts          # Business logic (pure functions, no HTTP concerns)
├── events.ts           # Event definitions (emitted + consumed)
├── types.ts            # TypeScript interfaces/types for this domain
├── validation.ts       # Zod schemas for input validation
├── state-machine.ts    # State transition definitions (if lifecycle entity exists)
└── utils.ts            # Module-specific helpers

app/api/<module-name>/
├── route.ts            # List + Create endpoints
├── [id]/
│   └── route.ts        # Get + Update + Delete endpoints
└── [id]/<sub>/
    └── route.ts        # Sub-resource endpoints

app/dashboard/<module-name>/
├── page.tsx            # Server component: fetch data, check permissions
├── ui.tsx              # Client component: interactive UI
├── [id]/
│   └── page.tsx        # Detail view
└── _components/        # Module-specific UI components
```

---

## Module Dependency Graph

```
                    ┌─────────────┐
                    │  @wcn/audit │ ← listens to ALL events
                    └──────┬──────┘
                           │
    ┌──────────────────────┼──────────────────────┐
    │                      │                      │
┌───▼────┐          ┌──────▼──────┐          ┌────▼─────┐
│identity│          │    nodes    │          │governance│
└───┬────┘          └──────┬──────┘          └────┬─────┘
    │                      │                      │
    └──────────┬───────────┘                      │
               │ (every module depends on identity + nodes)
    ┌──────────┼──────────┬───────────┬───────────┘
    │          │          │           │
┌───▼───┐ ┌───▼───┐ ┌────▼────┐ ┌───▼────┐
│project│ │capital│ │  deals  │ │ tasks  │
└───┬───┘ └───┬───┘ └────┬────┘ └───┬────┘
    │         │          │           │
    └────┬────┘          │           │
         │               │           │
    ┌────▼────┐          │           │
    │matching │◄─────────┘           │
    │(capital)│                      │
    └────┬────┘                      │
         │                           │
    ┌────▼────────────────────┬──────┘
    │                         │
┌───▼──────┐           ┌─────▼────┐
│proof-desk│           │  agents  │
└───┬──────┘           └──────────┘
    │
┌───▼───┐
│  pob  │
└───┬───┘
    │
┌───▼───────┐     ┌──────────┐
│settlement │     │reputation│◄── reads from pob
└───────────┘     └──────────┘

Cross-cutting (L4, connect to everything):
┌────────────┐  ┌──────────┐  ┌───────────────┐  ┌────────┐
│  cockpit   │  │   risk   │  │notifications  │  │ search │
└────────────┘  └──────────┘  └───────────────┘  └────────┘
```

---

## Detailed Module Specifications

### M01: `@wcn/identity` — Foundation

| Aspect | Detail |
|--------|--------|
| **Tables owned** | User, Account, Session, VerificationToken, TermsAcceptance |
| **Depends on** | L0 only (no module dependencies) |
| **Depended by** | ALL other modules |
| **API prefix** | `/api/auth`, `/api/signup`, `/api/account`, `/api/users` |
| **Dashboard** | `/login`, `/signup`, `/account`, `/dashboard/users` |
| **State machine** | Account: ACTIVE ↔ SUSPENDED ↔ LOCKED → OFFBOARDED |
| **Key interfaces** | `getCurrentUser()`, `hasPermission()`, `requireAuth()` |
| **Events OUT** | `user.created`, `user.login`, `user.role_changed`, `user.suspended` |
| **Events IN** | None |
| **Build status** | 80% — Missing: session management UI, WebAuthn |

---

### M02: `@wcn/nodes` — Foundation

| Aspect | Detail |
|--------|--------|
| **Tables owned** | Node, NodeSeat, StakeLedger, Penalty, Application, Invite, Workspace, WorkspaceMembership, RoleAssignment |
| **Depends on** | M01 (identity) |
| **Depended by** | M04-M13 (all business modules) |
| **API prefix** | `/api/nodes`, `/api/applications`, `/api/invites`, `/api/workspaces` |
| **Dashboard** | `/dashboard/nodes`, `/dashboard/applications`, `/dashboard/admin/invites` |
| **State machine** | Node: PENDING → ACTIVE ↔ PROBATION → SUSPENDED → OFFBOARDED |
| **Key interfaces** | `getNode()`, `getNodesByType()`, `getNodeCapabilities()`, `isNodeActive()` |
| **Events OUT** | `node.created`, `node.activated`, `node.suspended`, `application.submitted`, `application.approved` |
| **Events IN** | `pob.created` → update node stats |
| **Build status** | 75% — Missing: public directory, bulk import |

---

### M03: `@wcn/governance` — Foundation

| Aspect | Detail |
|--------|--------|
| **Tables owned** | ApprovalAction, EntityFreeze, AccessGrant (future: Proposal, Vote, CouncilMember, ComplianceRule) |
| **Depends on** | M01, M02 |
| **Depended by** | M06, M11 (deal close approval, settlement approval) |
| **API prefix** | `/api/approvals`, `/api/entity-freeze`, `/api/access-grants` |
| **Dashboard** | `/dashboard/approvals` |
| **Key interfaces** | `requireApproval()`, `isEntityFrozen()`, `checkCompliance()` |
| **Events OUT** | `approval.granted`, `approval.denied`, `entity.frozen` |
| **Events IN** | Various sensitive actions from other modules |
| **Build status** | 25% — Approval framework exists; no voting/proposals |

---

### M04: `@wcn/projects` — Business

| Aspect | Detail |
|--------|--------|
| **Tables owned** | Project, File, FileAccessLog (future: FundingNeed, ServiceNeed, ProjectSummary) |
| **Depends on** | M01, M02 |
| **Depended by** | M05 (matching), M06 (deals) |
| **API prefix** | `/api/projects`, `/api/files` |
| **Dashboard** | `/dashboard/projects` |
| **State machine** | Project: INTAKE → MATCHING → IN_DEAL → FUNDED → POST_DEAL → ARCHIVED |
| **Key interfaces** | `getProject()`, `getProjectsByNode()`, `searchProjects()` |
| **Events OUT** | `project.created`, `project.updated`, `project.status_changed` |
| **Events IN** | `deal.closed` → update project status to FUNDED |
| **Build status** | 65% — Missing: funding/service need structure, AI summary |

---

### M05: `@wcn/capital` — Business

| Aspect | Detail |
|--------|--------|
| **Tables owned** | CapitalProfile (future: MatchResult, CapitalDeployment) |
| **Depends on** | M01, M02, M04 |
| **Depended by** | M06 (deal creation from match) |
| **API prefix** | `/api/capital` |
| **Dashboard** | `/dashboard/capital` |
| **Key interfaces** | `getCapitalProfile()`, `runMatching()`, `getMatchResults()` |
| **Events OUT** | `match.generated`, `match.interest_expressed`, `capital.profile_updated` |
| **Events IN** | `project.created` → trigger matching; `deal.closed` → update deployment stats |
| **Core algorithm** | Multi-factor matching: sector(0.35) + stage(0.25) + ticket(0.25) + jurisdiction(0.15) |
| **Build status** | 85% — Profile CRUD + matching engine (`lib/modules/matching/engine.ts`) + Match dashboard + event triggers + anti-gaming. Missing: jurisdiction impl, per-workspace weights |

---

### M06: `@wcn/deals` — Business

| Aspect | Detail |
|--------|--------|
| **Tables owned** | Deal, DealParticipant, DealMilestone, DealNote |
| **Depends on** | M01, M02, M04, M05 |
| **Depended by** | M07 (tasks), M09 (evidence), M12 (distribution) |
| **API prefix** | `/api/deals` + sub-resources |
| **Dashboard** | `/dashboard/deals` |
| **State machine** | Deal: DRAFT → ACTIVE → DD → NEGOTIATION → CLOSING → CLOSED_WON / CLOSED_LOST |
| **Key interfaces** | `createDeal()`, `transitionDeal()`, `addParticipant()`, `getDealTimeline()` |
| **Events OUT** | `deal.created`, `deal.stage_changed`, `deal.closed`, `deal.participant_added` |
| **Events IN** | `match.interest_expressed` → auto-create deal; `task.completed` → update milestone |
| **Build status** | 75% — CRUD + participants + milestones + notes + state machine + event-driven. Missing: real-time timeline |

---

### M07: `@wcn/tasks` — Business

| Aspect | Detail |
|--------|--------|
| **Tables owned** | Task, TaskAssignment (future: TaskOutput, TaskReminder) |
| **Depends on** | M01, M02, M06 |
| **Depended by** | M09 (task outputs as evidence) |
| **API prefix** | `/api/tasks` |
| **Dashboard** | `/dashboard/tasks` |
| **State machine** | Task: TODO → IN_PROGRESS → IN_REVIEW → DONE / CANCELLED / BLOCKED |
| **Events OUT** | `task.created`, `task.assigned`, `task.completed`, `task.overdue` |
| **Events IN** | `deal.created` → auto-generate DD tasks; `agent.output_generated` → create review task |
| **Build status** | 75% — CRUD + assignment + submit output + evidence + review workflow (approve/reject). Missing: Agent auto-creation |

---

### M08: `@wcn/agents` — Intelligence

| Aspect | Detail |
|--------|--------|
| **Tables owned** | Agent, AgentPermission, AgentRun, AgentLog |
| **Depends on** | M01, M02, M04, M06, M07 |
| **Depended by** | M05 (match memos), M07 (auto-tasks), M12 (content gen) |
| **API prefix** | `/api/agents` + sub-resources |
| **Dashboard** | `/dashboard/agents` |
| **Agent types** | RESEARCH, DEAL, EXECUTION, GROWTH |
| **Permission levels** | READ → ANALYZE → SUGGEST → ACT |
| **Integration pattern** | Agent SDK → LLM Router → Provider → Output → Human Review Queue |
| **Events OUT** | `agent.run_started`, `agent.output_generated`, `agent.output_reviewed` |
| **Events IN** | `project.created` → trigger Research Agent; `deal.created` → assign Execution Agent |
| **Build status** | 85% — Full Agent SDK (Vercel AI SDK) + LLM Router (OpenAI/Anthropic) + 4 agent types with prompts + structured output schemas + execution endpoint + review queue + event-driven triggers (PROJECT_CREATED → Research, MATCH_GENERATED → Deal Memo) + review dashboard. Missing: scheduled runs, Agent marketplace |

---

### M09: `@wcn/proof-desk` — Verification

| Aspect | Detail |
|--------|--------|
| **Tables owned** | Evidence, Review (future: EvidencePacket, ReviewerAssignment) |
| **Depends on** | M01, M02, M06, M07 |
| **Depended by** | M10 (PoB) |
| **API prefix** | `/api/evidence`, `/api/reviews` |
| **Dashboard** | `/dashboard/proof-desk` |
| **Key flow** | Deal closes → Evidence Packet auto-created → Items assembled → Reviewer assigned → Reviewed |
| **Events OUT** | `evidence.submitted`, `evidence.approved`, `evidence.rejected` |
| **Events IN** | `deal.closed` → create packet; `task.completed` → add evidence item |
| **Build status** | 75% — Evidence CRUD + packet assembly (`lib/modules/evidence/assembly.ts`) + completeness checker + event-driven auto-assembly on deal.closed. Missing: reviewer assignment automation |

---

### M10: `@wcn/pob` — Verification

| Aspect | Detail |
|--------|--------|
| **Tables owned** | PoBRecord, Attribution, Confirmation, Dispute |
| **Depends on** | M09 |
| **Depended by** | M11 (settlement), M13 (reputation) |
| **API prefix** | `/api/pob` + sub-resources |
| **Dashboard** | `/dashboard/pob` |
| **Key flow** | Evidence approved → Anti-gaming checks → Attribution calculated → PoB event created (immutable) |
| **Events OUT** | `pob.created`, `pob.flagged`, `pob.dispute_raised` |
| **Events IN** | `evidence.approved` → generate PoB |
| **Build status** | 80% — Records + attribution engine (`lib/modules/pob/attribution.ts`) + anti-gaming v1 (`lib/modules/risk/anti-gaming.ts`) + [id] detail page + confirmations + disputes. Missing: on-chain anchoring |

---

### M11: `@wcn/settlement` — Verification

| Aspect | Detail |
|--------|--------|
| **Tables owned** | SettlementCycle, SettlementLine |
| **Depends on** | M10 |
| **Depended by** | None (terminal output) |
| **API prefix** | `/api/settlement` + sub-resources |
| **Dashboard** | `/dashboard/settlement` |
| **Key flow** | Period closes → Aggregate PoB → Calculate per-node → Admin review → Distribute |
| **Events OUT** | `settlement.calculated`, `settlement.approved`, `settlement.distributed` |
| **Events IN** | `pob.created` → include in next cycle |
| **Build status** | 70% — Cycle management + line generation + PoB aggregation + lock/export/reopen flow + event pipeline (CALCULATED/APPROVED/DISTRIBUTED). Missing: payment execution, multi-currency |

---

### M12: `@wcn/distribution` — Business

| Aspect | Detail |
|--------|--------|
| **Tables owned** | (Future: DistributionCampaign, DistributionChannel, ListingRecord, MarketMakingAgreement) |
| **Depends on** | M04, M06, M02 |
| **API prefix** | `/api/distribution` (future) |
| **Dashboard** | `/dashboard/assets` (placeholder) |
| **Build status** | 5% — Only placeholder page |

---

### M13: `@wcn/reputation` — Business

| Aspect | Detail |
|--------|--------|
| **Tables owned** | (Future: ReputationRecord, ReputationSnapshot, PeerRating) |
| **Depends on** | M10 (PoB data) |
| **API prefix** | `/api/reputation` (future) |
| **Formula** | pobVolume(0.25) + pobValue(0.20) + closeRate(0.20) + consistency(0.15) + peerRating(0.10) + recency(0.10) |
| **Build status** | 10% — Score field on PoBRecord; no dedicated module |

---

### M14-M18: Intelligence & Operations

| Module | Tables | API | Dashboard | Build % |
|--------|--------|-----|-----------|---------|
| M14 `@wcn/cockpit` | DashboardMetric (future) | `/api/data-cockpit` | `/dashboard/data` | 40% |
| M15 `@wcn/risk` | RiskFlag | `/api/risk` | `/dashboard/risk` | 35% |
| M16 `@wcn/notifications` | Notification | `/api/notifications` | `/dashboard/notifications` | 35% |
| M17 `@wcn/search` | SearchDocument | `/api/search` | Spotlight component | 30% |
| M18 `@wcn/audit` | AuditLog | `/api/audit` | `/dashboard/audit` | 50% |

---

## Module Communication Summary

### Synchronous (Direct Service Calls)
```
Any module → @wcn/identity.getCurrentUser()     (auth check)
Any module → @wcn/identity.hasPermission()       (permission check)
Any module → @wcn/nodes.getNode()                (node info lookup)
Any module → @wcn/audit.audit()                  (log action)
@wcn/deals → @wcn/projects.getProject()          (project info for deal)
@wcn/capital → @wcn/projects.searchProjects()    (matching input)
```

### Asynchronous (Event-Driven)
```
project.created    → @wcn/capital (trigger matching), @wcn/search (index)
match.generated    → @wcn/notifications (alert capital node)
deal.created       → @wcn/tasks (generate DD checklist), @wcn/agents (assign)
deal.closed        → @wcn/proof-desk (create packet), @wcn/notifications
evidence.approved  → @wcn/pob (generate PoB)
pob.created        → @wcn/settlement (include in cycle), @wcn/reputation (update score)
settlement.distributed → @wcn/notifications (notify nodes), @wcn/cockpit (update metrics)
```

---

## Filesystem Layout (Target)

```
wcn-nextjs-starter/
├── app/
│   ├── (marketing)/          # Public pages: /, /about, /how-it-works, /nodes, /pob
│   ├── (auth)/               # /login, /signup, /apply, /invite
│   ├── wiki/                 # /wiki, /wiki/[...slug]
│   ├── account/              # /account, /account/2fa, /account/terms
│   ├── dashboard/            # All authenticated dashboard routes
│   │   ├── _components/      # Shared dashboard UI components
│   │   ├── nodes/            # M02
│   │   ├── projects/         # M04
│   │   ├── capital/          # M05
│   │   ├── deals/            # M06
│   │   ├── tasks/            # M07
│   │   ├── agents/           # M08
│   │   ├── proof-desk/       # M09
│   │   ├── pob/              # M10
│   │   ├── settlement/       # M11
│   │   ├── distribution/     # M12 (future)
│   │   ├── reputation/       # M13 (future)
│   │   ├── data/             # M14
│   │   ├── risk/             # M15
│   │   ├── notifications/    # M16
│   │   ├── audit/            # M18
│   │   ├── users/            # M01 admin
│   │   ├── applications/     # M02 admin
│   │   ├── approvals/        # M03
│   │   └── disputes/         # M10 sub-function
│   └── api/
│       ├── auth/             # M01
│       ├── signup/           # M01
│       ├── account/          # M01
│       ├── users/            # M01
│       ├── nodes/            # M02
│       ├── applications/     # M02
│       ├── invites/          # M02
│       ├── workspaces/       # M02
│       ├── approvals/        # M03
│       ├── entity-freeze/    # M03
│       ├── access-grants/    # M03
│       ├── projects/         # M04
│       ├── files/            # M04
│       ├── capital/          # M05
│       ├── deals/            # M06
│       ├── tasks/            # M07
│       ├── agents/           # M08
│       ├── evidence/         # M09
│       ├── reviews/          # M09
│       ├── pob/              # M10
│       ├── disputes/         # M10
│       ├── settlement/       # M11
│       ├── risk/             # M15
│       ├── notifications/    # M16
│       ├── search/           # M17
│       ├── audit/            # M18
│       └── data-cockpit/     # M14
├── lib/
│   ├── modules/              # Domain logic (TARGET structure)
│   │   ├── identity/         # service.ts, events.ts, types.ts, validation.ts
│   │   ├── nodes/
│   │   ├── governance/
│   │   ├── projects/
│   │   ├── capital/
│   │   ├── deals/
│   │   ├── tasks/
│   │   ├── agents/
│   │   ├── proof-desk/
│   │   ├── pob/
│   │   ├── settlement/
│   │   ├── distribution/
│   │   ├── reputation/
│   │   ├── cockpit/
│   │   ├── risk/
│   │   ├── notifications/
│   │   ├── search/
│   │   └── audit/
│   ├── core/                 # Cross-cutting: event-bus.ts, permissions.ts, state-machine.ts
│   ├── state-machines/       # (existing, migrate to lib/modules/*/state-machine.ts)
│   ├── prisma.ts
│   └── auth.ts
├── prisma/
│   └── schema.prisma
├── content/
│   └── wiki/                 # MDX content (15 chapters)
├── components/
│   ├── nav.tsx, footer.tsx
│   └── docs/                 # Wiki UI components
├── docs/
│   ├── architecture/         # This document set
│   └── prd/                  # 18 PRDs
└── middleware.ts              # Auth gate
```
