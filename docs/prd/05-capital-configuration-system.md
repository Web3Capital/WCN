# PRD-05: Capital Configuration System

> Status: Draft | Priority: P0 — Core | Owner: Product Lead
> Dependencies: PRD-01, PRD-02, PRD-04 (Project)
> Affects: PRD-06 (Deal Room), PRD-08 (Agent)

---

## 1. Overview

The Capital Configuration System is Layer 2 of WCN's five-layer architecture. It manages how capital nodes register their investment preferences, how the system matches capital to projects, and how capital flows from interest to structured Deal entry. The goal is to upgrade Web3's relationship-based capital access to systematic, data-driven capital routing.

**Core Principle**: Capital is not just money — it is judgment + decision authority + allocation capacity. The system must capture all three dimensions, not just "how much they can invest."

**TradFi Reference**: Bloomberg Terminal ($24K/seat/yr) + Pitchbook ($30K+) + DealCloud — WCN combines discovery, matching, and deal management that these tools provide separately.

---

## 2. Core User Stories

### Capital Profile
- US-5.1: As a capital node, I can register my investment preferences: sectors, stages, ticket range, instruments, regions, exclusions.
- US-5.2: As a capital node, I can set "active deal" capacity (max concurrent deals I want to evaluate).
- US-5.3: As a capital node, I can update preferences anytime as my strategy evolves.

### Matching
- US-5.4: As a capital node, I receive matched project recommendations based on my preferences.
- US-5.5: As a system, I calculate a match score (0-100) between each project and capital node based on: sector fit, stage fit, ticket fit, instrument compatibility, region overlap.
- US-5.6: As a capital node, I can express interest in a matched project to initiate a Deal Room.
- US-5.7: As a Research Agent, I auto-generate a match memo explaining why a project fits a capital node's preferences.

### Pipeline Management
- US-5.8: As a capital node, I can view my deal pipeline: New Matches → Reviewing → In Deal → Passed → Funded.
- US-5.9: As a capital node, I can mark a project as "Passed" with a structured reason (sector mismatch, too early, valuation too high, etc.).
- US-5.10: As a system, I track capital deployment metrics: deals viewed, deals entered, deals closed, total deployed.

---

## 3. Data Model

```
CapitalProfile
├── id: string
├── nodeId: string (FK → Node, capital-type only)
├── investorType: enum (VC, FAMILY_OFFICE, CVC, ANGEL, HNW, LP, OTHER)
├── aum: string? (indicative, e.g., "$50M-$100M")
├── sectors: enum[] (DEFI, AI, RWA, INFRA, GAMING, etc.)
├── stages: enum[] (SEED, PRE_A, SERIES_A, STRATEGIC, OTC, SECONDARY)
├── ticketMin: decimal
├── ticketMax: decimal
├── instruments: string[] (["SAFE", "SAFT", "Token Warrant", "Equity"])
├── regions: string[] (["APAC", "ME", "EU", "NA"])
├── exclusions: string? (sectors/jurisdictions to avoid)
├── maxConcurrentDeals: int
├── activeDealCount: int
├── decisionTimeline: string? ("2-4 weeks typical")
├── totalDeployed: decimal
├── totalDeals: int
├── avgTicketSize: decimal?
└── updatedAt: datetime

MatchResult
├── id: string
├── projectId: string (FK → Project)
├── capitalNodeId: string (FK → Node)
├── matchScore: float (0-100)
├── matchReasons: json ({sectorFit, stageFit, ticketFit, instrumentFit, regionFit})
├── status: enum (NEW, VIEWED, INTERESTED, PASSED, IN_DEAL)
├── passReason: string?
├── agentMemo: string? (auto-generated match memo)
├── viewedAt: datetime?
├── respondedAt: datetime?
└── createdAt: datetime

CapitalDeployment
├── id: string
├── capitalNodeId: string (FK → Node)
├── projectId: string (FK → Project)
├── dealId: string (FK → Deal)
├── amount: decimal
├── instrument: string
├── deployedAt: datetime
├── pobEventId: string? (FK → PoBEvent, after verification)
└── createdAt: datetime
```

---

## 4. Feature Breakdown

### P0 — Must Have
- [ ] Capital profile setup (preferences, ticket range, sectors, stages)
- [ ] Project-capital matching engine (multi-factor scoring)
- [ ] Match list view with scores and reasons
- [ ] Express interest / Pass workflow
- [ ] Capital pipeline dashboard (New → Reviewing → In Deal → Funded → Passed)
- [ ] Match memo generation (Research Agent)

### P1 — Should Have
- [ ] Capital deployment tracking
- [ ] Pass reason analytics (why capital passes on projects)
- [ ] Capital performance dashboard (IRR, deployment pace, conversion rate)
- [ ] Smart alerts when high-match projects enter the system
- [ ] Capital node comparison for projects (which investors are most aligned)

### P2 — Nice to Have
- [ ] LP portal (LPs of a fund can view portfolio through WCN)
- [ ] Co-investment matching (find co-investors for a round)
- [ ] Historical deal performance tracking
- [ ] Integration with external portfolio tools (Carta, Angelist)

---

## 5. Matching Algorithm

```
MatchScore = weighted_average(
  sectorFit     × 0.30,  // % overlap of project sector with capital preferences
  stageFit      × 0.25,  // binary: does project stage match capital's target stages
  ticketFit     × 0.20,  // does project's min/max ticket overlap with capital's range
  instrumentFit × 0.15,  // does project's instruments match capital's preferred instruments
  regionFit     × 0.10   // does project's region match capital's target regions
)

Boosters:
  +5 if capital node has funded similar sector projects before
  +3 if project node has high reputation score
  -10 if capital node at max concurrent deals
  -∞ if project in capital's exclusion list
```

---

## 6. Success Metrics

| Metric | Target |
|--------|--------|
| Match score accuracy (does capital engage with high-score matches) | > 70% engagement for score > 80 |
| Capital response rate to matches | > 40% within 72 hours |
| Match-to-deal conversion | > 20% |
| Average capital deployment time | < 6 weeks from first match |
| Capital node NPS | > 50 |
