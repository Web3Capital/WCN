# 09 — Evolution Roadmap

> From current state to full ecosystem in 5 phases, with clear milestones, deliverables, and dependencies.

---

## Current State Assessment (2026-04-10)

```
Built:    ██████████████████████████░░░░░░  80%
  ├── Database schema: 44 models, production-shaped
  ├── API layer: 73+ endpoints, all standardized (apiOk/apiError + Zod)
  ├── Dashboard: 35+ pages with CRUD consoles (inc. Matches, PoB detail, Disputes detail)
  ├── Auth: Email + OAuth (Google/MS/Apple/GitHub) + 2FA
  ├── Wiki: 15 chapters, 91 pages, professionally written
  ├── State machines: Account, Deal, Node, Task, Evidence, Settlement, Match
  ├── Marketing site: Home, About, How it Works, Nodes, PoB, Apply
  ├── ✅ Event bus + event-driven architecture (50+ event types)
  ├── ✅ Matching engine (multi-factor weighted scoring + event triggers)
  ├── ✅ PoB attribution engine (deterministic, multi-role, anti-gaming)
  ├── ✅ Evidence packet assembly (auto on deal.closed, completeness checker)
  ├── ✅ Settlement calculator (aggregate PoB, 5% fee, per-node lines)
  ├── ✅ Email notifications (Resend + 8 templates, event-driven)
  ├── ✅ Anti-gaming engine v1 (self-dealing, circular deal, velocity)
  ├── ✅ Task review workflow (submit output + evidence + approve/reject)
  ├── ✅ Test framework: Vitest, 70 tests, 7 test suites
  └── ✅ Rate limiting: Upstash Redis sliding window (API/auth/admin tiers)

Missing:  ░░░░░░░░░░████████████████████░░  20%
  ├── Agent LLM integration (all 4 agent types) — Phase 3
  ├── Payment execution (crypto settlement) — Phase 4
  ├── Distribution system (whole module) — Phase 4
  ├── Reputation system (whole module) — Phase 4
  ├── Real-time updates (WebSocket) — Phase 4
  └── On-chain anchoring (NFT, PoB hash) — Phase 5
```

---

## Phase 1: Foundation Hardening (Month 1-2)

> **Goal**: Make the existing 50% rock-solid. No new features until the foundation is bulletproof.

### Deliverables

| # | Task | Module | Priority | Est. Effort |
|---|------|--------|----------|-------------|
| 1.1 | **Event Bus implementation** — In-process event emitter + handler registration | Core | P0 | 1 week |
| 1.2 | **Module restructure** — Move business logic from API routes to `lib/modules/*/service.ts` | All | P0 | 2 weeks |
| 1.3 | **Audit SDK** — One-line `audit()` function, integrate into all mutation endpoints | M18 | P0 | 1 week |
| 1.4 | **Validation layer** — Zod schemas for all API inputs, consistent error responses | All | P0 | 1 week |
| 1.5 | **State machine enforcement** — Ensure all status transitions go through state machines | M02, M06, M07, M09 | P0 | 1 week |
| 1.6 | **Permission hardening** — Complete RBAC matrix, data scoping in all queries | Core | P0 | 1 week |
| 1.7 | **Test foundation** — Unit tests for state machines, services, permission checks | All | P0 | 2 weeks |
| 1.8 | **Redis setup** — Deploy Redis for caching and rate limiting | Core | P1 | 3 days |

### Architecture Milestone
```
✅ Every module has: service.ts, events.ts, types.ts, validation.ts
✅ Every API mutation: validates input, checks permissions, calls service, emits event, logs audit
✅ Every state change: goes through state machine
✅ Test coverage: >80% for lib/modules/**
```

### Exit Criteria
- All existing features still work
- Zero type errors, zero lint errors
- Audit trail covers all mutations
- Event bus handles deal.closed → proof-desk + notifications + cockpit

---

## Phase 2: Business Value Loop (Month 3-5)

> **Goal**: Complete the core business loop — project enters → capital matches → deal closes → PoB → settlement. This is the WCN value proposition.

### Deliverables

| # | Task | Module | Priority | Est. Effort |
|---|------|--------|----------|-------------|
| 2.1 | **Matching Engine** — Multi-factor scoring (sector + stage + ticket + instrument + region) | M05 | P0 | 2 weeks |
| 2.2 | **Match UI** — Capital nodes see recommended projects with scores and reasons | M05 | P0 | 1 week |
| 2.3 | **Deal Workflow** — Full state machine UI with milestone tracking | M06 | P0 | 2 weeks |
| 2.4 | **Evidence Packet Assembly** — Auto-create from deal events, completeness checking | M09 | P0 | 2 weeks |
| 2.5 | **PoB Attribution Engine** — Deterministic calculation, multi-role attribution | M10 | P0 | 2 weeks |
| 2.6 | **Anti-Gaming v1** — Circular deal detection, self-dealing prevention, velocity checks | M10 | P0 | 1 week |
| 2.7 | **Settlement Calculation** — Aggregate PoB → per-node entries → fee deduction | M11 | P0 | 1 week |
| 2.8 | **Email Notifications** — Transactional emails for critical events (deal updates, settlement) | M16 | P0 | 1 week |
| 2.9 | **Task Review Workflow** — Submit output → reviewer approves/rejects → evidence | M07 | P1 | 1 week |
| 2.10 | **Detail Pages** — Build missing [id] pages for PoB, Proof Desk | M09, M10 | P1 | 1 week |

### Key Integration Points
```
project.created → M05 matching engine → match.generated → M16 notification
match.interest_expressed → M06 deal creation → deal.created → M07 auto-DD-tasks
deal.closed → M09 evidence packet → evidence.approved → M10 PoB generation
pob.created → M11 settlement inclusion → settlement.distributed → M16 notification
```

### Exit Criteria
- A capital node can: see matched projects → express interest → deal opens → milestones tracked → deal closes → evidence submitted → PoB verified → settlement calculated
- End-to-end flow works with zero manual workarounds
- Email notifications delivered for all critical events

---

## Phase 3: AI Intelligence (Month 6-8)

> **Goal**: Integrate LLM capabilities into all 4 Agent types, making WCN an AI-augmented network.

### Deliverables

| # | Task | Module | Priority | Est. Effort |
|---|------|--------|----------|-------------|
| 3.1 | **Agent SDK** — LLM Router abstraction (OpenAI/Anthropic), prompt management, output parsing | M08 | P0 | 2 weeks |
| 3.2 | **Research Agent** — Project analysis, summary generation, risk flags | M08 | P0 | 2 weeks |
| 3.3 | **Deal Agent** — Match memo generation, DD assist, term comparison | M08 | P0 | 2 weeks |
| 3.4 | **Execution Agent** — Meeting notes extraction, action item creation, follow-up tracking | M08 | P1 | 2 weeks |
| 3.5 | **Growth Agent** — Content drafting, distribution planning | M08 | P2 | 2 weeks |
| 3.6 | **Agent Review Queue** — Human approval workflow for all Agent outputs | M08 | P0 | 1 week |
| 3.7 | **Agent Analytics** — Adoption rate, accuracy tracking, cost monitoring | M14 | P1 | 1 week |
| 3.8 | **Agent Permissions UI** — Configure what each Agent can access and do | M08 | P1 | 1 week |

### Agent Architecture
```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│  Trigger     │→  │  Agent SDK   │→  │  LLM Router │
│  (event or   │    │  - Context   │    │  - OpenAI   │
│   manual)    │    │  - Prompt    │    │  - Anthropic│
│              │    │  - Parse     │    │  - Gemini   │
└──────────────┘    └──────┬───────┘    └─────────────┘
                           │
                    ┌──────▼───────┐
                    │  Output      │
                    │  - Store     │
                    │  - Review Q  │
                    │  - Audit     │
                    └──────────────┘
```

### Exit Criteria
- Research Agent auto-generates project summaries within 60 seconds
- Deal Agent generates match memos with >70% adoption rate
- All Agent outputs go through human review before taking effect
- Agent cost per operation tracked and within budget ($0.10 avg)

---

## Phase 4: Ecosystem Expansion (Month 9-12)

> **Goal**: Build the remaining modules that make WCN a complete ecosystem.

### Deliverables

| # | Task | Module | Priority | Est. Effort |
|---|------|--------|----------|-------------|
| 4.1 | **Reputation System** — Score calculation, decay, badges, tier-based benefits | M13 | P0 | 2 weeks |
| 4.2 | **Distribution Module** — Campaign management, channel coordination | M12 | P1 | 3 weeks |
| 4.3 | **Governance v2** — Proposal/vote system, council management | M03 | P1 | 3 weeks |
| 4.4 | **Risk Engine v2** — Rule engine, automated risk scoring, sanctions screening | M15 | P1 | 2 weeks |
| 4.5 | **Search v2** — MeiliSearch integration, recommendation engine, saved searches | M17 | P1 | 2 weeks |
| 4.6 | **Cockpit v2** — Full analytics dashboard, weekly auto-reports, anomaly detection | M14 | P1 | 2 weeks |
| 4.7 | **Notification v2** — Email digests, Telegram/Slack integration, preference management | M16 | P1 | 2 weeks |
| 4.8 | **Payment Execution** — Crypto settlement (USDC on-chain transfer) | M11 | P0 | 3 weeks |
| 4.9 | **Real-time Updates** — WebSocket for deal rooms, task updates, notifications | Core | P1 | 2 weeks |
| 4.10 | **Mobile Responsive** — Full dashboard responsive design audit | UI | P1 | 2 weeks |

### Exit Criteria
- Reputation scores visible on all node profiles
- At least one distribution campaign completed end-to-end
- Governance proposals can be created, voted on, and executed
- USDC settlement can be triggered from the dashboard
- All 18 modules functional at P0 level

---

## Phase 5: Decentralization & Scale (Month 13-18)

> **Goal**: Progressive decentralization, on-chain anchoring, and preparation for 10K+ nodes.

### Deliverables

| # | Task | Module | Priority | Est. Effort |
|---|------|--------|----------|-------------|
| 5.1 | **Node NFT** — Mint on approval, metadata reflects type/tier | M02 | P1 | 3 weeks |
| 5.2 | **On-chain PoB Anchoring** — Hash of PoB records on-chain for verifiability | M10 | P1 | 2 weeks |
| 5.3 | **Smart Contract Settlement** — Token-based settlement via smart contracts | M11 | P1 | 4 weeks |
| 5.4 | **Governance Smart Contracts** — On-chain proposal execution | M03 | P2 | 4 weeks |
| 5.5 | **WCN Token Integration** — Token utility for staking, settlement, governance | Core | P1 | 4 weeks |
| 5.6 | **SDK Publication** — `@wcn/sdk` npm package for programmatic access | Core | P1 | 3 weeks |
| 5.7 | **Service Extraction** — Extract audit, notifications, agents into separate services | Core | P2 | 6 weeks |
| 5.8 | **Multi-region Deployment** — APAC + EU + NA deployment for latency | Infra | P2 | 3 weeks |
| 5.9 | **Advanced Anti-Gaming** — ML-based anomaly detection for PoB | M10, M15 | P2 | 4 weeks |
| 5.10 | **Public API & Webhooks** — External developer access with API keys | Core | P1 | 3 weeks |

### Exit Criteria
- Node NFTs minting on production chain
- PoB records verifiable by external parties via on-chain hash
- WCN token live with defined utility
- SDK published, first third-party integration live
- Platform handles 10K concurrent users

---

## Timeline Summary

```
2026                                                                    2027
Apr    May    Jun    Jul    Aug    Sep    Oct    Nov    Dec    Jan    Feb    Mar
──┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──
  │◄──Phase 1──►│                                                              │
  │ Foundation  │◄─────Phase 2──────►│                                         │
  │ Hardening   │ Business Value     │◄────Phase 3────►│                       │
  │             │ Loop               │ AI Intelligence  │◄────Phase 4─────────►│
  │             │                    │                  │ Ecosystem Expansion   │
  │             │                    │                  │                       │
  └─────────────┴────────────────────┴──────────────────┴───────────────────────┘

  Phase 5 (Decentralization): 2027 Q2-Q3 (overlaps with Phase 4 tail)
```

---

## Team Scaling Plan

| Phase | Team Size | Key Hires |
|-------|-----------|-----------|
| **Phase 1** | 2-3 engineers | Full-stack lead, backend engineer |
| **Phase 2** | 4-5 engineers | +1 backend (matching/PoB), +1 frontend |
| **Phase 3** | 5-7 engineers | +1 AI/ML engineer, +1 backend |
| **Phase 4** | 7-10 engineers | +1 DevOps, +1 frontend, +1 smart contract |
| **Phase 5** | 10-15 engineers | +2 smart contract, +1 security, +2 backend |

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| LLM API costs exceed budget | Medium | Medium | Set per-agent cost caps, cache frequent queries, use smaller models for simple tasks |
| PoB gaming by colluding nodes | Medium | High | Anti-gaming engine, reviewer rotation, velocity limits, manual review for high-value |
| Regulatory uncertainty (MiCA, SEC) | High | High | Jurisdiction-aware compliance rules, legal counsel on retainer, pauseable token features |
| Key engineer departure | Medium | High | Comprehensive documentation (this document set), modular codebase, pair programming |
| Database performance at scale | Low | Medium | Query optimization before scaling infra, read replicas ready at 1K nodes |
| Vercel pricing / limits | Medium | Low | Architecture supports migration to self-hosted Docker; vendor-neutral patterns |

---

## Success Metrics by Phase

| Phase | Metric | Target |
|-------|--------|--------|
| **Phase 1** | Test coverage | >80% for service layer |
| **Phase 1** | Audit log completeness | 100% of mutations logged |
| **Phase 2** | First end-to-end deal | 1 deal from match → PoB → settlement |
| **Phase 2** | Match-to-deal conversion | >15% |
| **Phase 3** | Agent adoption rate | >50% of deals use Agent outputs |
| **Phase 3** | Agent output accuracy | >80% human approval rate |
| **Phase 4** | Active nodes | >100 |
| **Phase 4** | Monthly deal volume | >20 deals/month |
| **Phase 5** | Active nodes | >1,000 |
| **Phase 5** | Total PoB value | >$10M verified |
| **Phase 5** | Token utility | >50% of settlements in WCN token |
