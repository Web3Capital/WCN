# PRD-13: Reputation System

> Status: Draft | Priority: P1 — Important | Owner: CTO Office
> Dependencies: PRD-10 (PoB), PRD-02 (Node)
> Affects: PRD-05 (Capital Matching), PRD-03 (Governance Voting Weight)

---

## 1. Overview

The Reputation System converts PoB history into a quantified credibility score for each node. Reputation drives matching priority, governance voting weight, seat tier eligibility, and trust signals in Deal Rooms. It is the system that makes long-term participation more valuable than short-term opportunism.

**Core Principle**: Reputation is earned through verified outcomes, not self-reported credentials. It decays over time without continued contribution, preventing "resting on laurels." It cannot be bought or transferred.

---

## 2. Core User Stories

- US-13.1: As a node, I have a reputation score (0-100) visible on my profile, calculated from my PoB history.
- US-13.2: As a system, I calculate reputation from: total PoB count, total deal value, close rate, review ratings, consistency, and recency.
- US-13.3: As a capital node, I can see reputation scores of other nodes when evaluating deal participation.
- US-13.4: As a system, I use reputation to boost matching priority (higher reputation = shown to capital first).
- US-13.5: As a system, I apply reputation decay for inactive nodes (no PoB in 90 days → score gradually decreases).
- US-13.6: As a node, I can view my reputation breakdown: which factors contribute to my score.
- US-13.7: As a system, I award reputation badges for milestones (First Deal, 10 PoB, $1M Settled, etc.).

---

## 3. Reputation Model

```
ReputationScore = weighted_sum(
  pobVolume       × 0.25,  // total number of verified PoB events
  pobValue        × 0.20,  // total USD value of attributed PoB
  closeRate       × 0.20,  // % of deals entered that resulted in PoB
  consistency     × 0.15,  // regularity of PoB (monthly cadence)
  peerRating      × 0.10,  // average rating from deal counterparties
  recency         × 0.10   // weighted toward recent activity
)

Decay: -2 points per month with no PoB, minimum 0
Cap: 100 points
Floor: 0 points (new nodes start at 0)
```

---

## 4. Data Model

```
ReputationRecord
├── id: string
├── nodeId: string (FK → Node)
├── score: float (0-100)
├── components: json ({pobVolume, pobValue, closeRate, consistency, peerRating, recency})
├── tier: enum (NEW, EMERGING, ESTABLISHED, TRUSTED, ELITE)
├── badges: string[] (["first_deal", "10_pob", "1m_settled"])
├── lastPoBAt: datetime?
├── decayAppliedAt: datetime?
├── calculatedAt: datetime
└── history: ReputationSnapshot[]

ReputationSnapshot
├── id: string
├── nodeId: string (FK → Node)
├── score: float
├── components: json
├── snapshotDate: datetime

PeerRating
├── id: string
├── raterNodeId: string (FK → Node)
├── rateeNodeId: string (FK → Node)
├── dealId: string (FK → Deal)
├── rating: int (1-5)
├── comment: string?
├── createdAt: datetime
└── @@unique([raterNodeId, rateeNodeId, dealId])
```

---

## 5. Reputation Tiers

| Tier | Score Range | Benefits |
|------|-------------|----------|
| NEW | 0-19 | Basic access, standard matching |
| EMERGING | 20-39 | Priority matching boost +10% |
| ESTABLISHED | 40-59 | Priority matching boost +25%, governance voting eligible |
| TRUSTED | 60-79 | Priority matching boost +40%, reviewer eligible, premium Deal Room features |
| ELITE | 80-100 | Maximum priority, council nomination eligible, showcase profile |

---

## 6. Feature Breakdown

### P0
- [ ] Reputation score calculation engine
- [ ] Score display on node profiles
- [ ] Reputation breakdown view (per-factor)
- [ ] Monthly reputation recalculation job
- [ ] Decay mechanism for inactive nodes

### P1
- [ ] Reputation-based matching priority boost
- [ ] Peer rating after deal completion
- [ ] Badge system (milestone achievements)
- [ ] Reputation history chart
- [ ] Reputation leaderboard (opt-in)

### P2
- [ ] On-chain reputation attestation (SBT or Verifiable Credential)
- [ ] Cross-platform reputation portability
- [ ] Reputation staking (future token utility)

---

## 7. Success Metrics

| Metric | Target |
|--------|--------|
| Nodes with reputation > 20 (after 6 months) | > 60% of active nodes |
| Correlation between reputation and deal close rate | > 0.6 |
| Peer rating participation rate | > 50% of completed deals |
| Reputation decay re-engagement (inactive → active again) | > 30% |
