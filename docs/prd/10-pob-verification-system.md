# PRD-10: PoB Verification System

> Status: Draft | Priority: P0 — Core | Owner: CTO Office
> Dependencies: PRD-09 (Proof Desk)
> Affects: PRD-11 (Settlement), PRD-13 (Reputation)

---

## 1. Overview

Proof of Business (PoB) is WCN's core consensus mechanism. Unlike PoW (computing power) or PoS (staked capital), PoB validates REAL BUSINESS RESULTS — completed deals, delivered services, verified outcomes. The PoB Verification System takes approved Evidence Packets from Proof Desk and converts them into immutable PoB Events that drive attribution, reputation, and settlement.

**Core Principle**: Only verified, closed-loop business outcomes generate PoB. Activity, effort, introductions, and meetings do NOT generate PoB unless they result in a verified outcome. This is what separates WCN from every "engagement reward" system in Web3.

**Key Distinction from other consensus mechanisms**:
- PoW rewards computing → gaming via ASIC
- PoS rewards capital → plutocracy
- Points/airdrops reward activity → Sybil farming
- **PoB rewards verified business results → can't be faked at scale**

---

## 2. Core User Stories

- US-10.1: As a system, I generate a PoB Event when an Evidence Packet is approved by reviewers.
- US-10.2: As a system, I calculate attribution percentages for all participants based on the evidence chain.
- US-10.3: As a participant, I can view my PoB history with attribution details for each event.
- US-10.4: As a system, I apply anti-gaming checks before PoB generation (circular deals, wash trading, self-dealing).
- US-10.5: As a system, I make PoB events immutable once generated (no retroactive editing).
- US-10.6: As an admin, I can flag a PoB event for investigation if fraud is suspected (does not delete, adds flag).
- US-10.7: As a system, I use PoB data to update node reputation scores (PRD-13).

---

## 3. Data Model

```
PoBEvent
├── id: string
├── evidencePacketId: string (FK → EvidencePacket)
├── dealId: string (FK → Deal)
├── dealType: enum (FUNDRAISE, SERVICE, PARTNERSHIP, LISTING, OTHER)
├── dealValue: decimal (total deal value in USD equivalent)
├── status: enum (ACTIVE, FLAGGED, UNDER_INVESTIGATION, REVOKED)
├── attributions: PoBAttribution[]
├── antiGamingScore: float (0-100, higher = more suspicious)
├── antiGamingFlags: string[]
├── verifiedAt: datetime
├── verifiedBy: string (FK → User, reviewer)
├── periodId: string? (FK → SettlementPeriod)
├── onChainHash: string? (future: hash on chain)
├── createdAt: datetime
└── updatedAt: datetime

PoBAttribution
├── id: string
├── pobEventId: string (FK → PoBEvent)
├── nodeId: string (FK → Node)
├── userId: string (FK → User)
├── role: enum (DEAL_OWNER, CAPITAL_PROVIDER, SERVICE_PROVIDER, INTRODUCER, AGENT, REVIEWER)
├── percentage: float (0-100, all attributions sum to 100%)
├── justification: string (evidence-based reason)
├── isAgentContribution: boolean
├── agentId: string? (FK → Agent)
├── value: decimal (percentage × dealValue)
└── createdAt: datetime
```

---

## 4. Attribution Calculation

```
Base attribution model:
  Deal Owner (introducer/coordinator):  25-35%
  Capital Provider:                     20-30%
  Service Provider:                     15-25%
  Other contributors:                   5-15% each
  Agent contributions:                  5-15% total (only if adopted)
  Reviewer:                             2-5%

Adjustment factors:
  + Higher attribution for parties with more evidence of direct contribution
  + Lower attribution for parties that joined late or contributed marginally
  + Agent attribution = 0% if Agent output was not adopted by any human
  + Attribution weights sum to exactly 100%
```

---

## 5. Anti-Gaming Mechanisms

| Check | Description | Action |
|-------|-------------|--------|
| **Circular deals** | Same nodes repeatedly transacting with each other with no external parties | Flag + manual review |
| **Wash trading** | Capital flows from Node A → Project → back to Node A | Block PoB generation |
| **Self-dealing** | Deal owner is also the sole capital provider | Require external reviewer + flag |
| **Velocity check** | Unusually high PoB frequency for a node | Flag for review |
| **Value anomaly** | Deal value significantly above/below market norms | Flag for review |
| **Reviewer collusion** | Same reviewer always approves same node's deals | Auto-rotate reviewers |

---

## 6. Feature Breakdown

### P0
- [x] PoB Event generation from approved Evidence Packets
- [x] Attribution calculation engine
- [x] PoB event list and detail views
- [x] Per-node PoB history
- [x] Basic anti-gaming checks (circular, self-dealing)
- [x] PoB flagging mechanism
- [ ] PoB immutability (no edit after creation)

### P1
- [x] Advanced anti-gaming (velocity, value anomaly, reviewer rotation)
- [ ] PoB analytics dashboard (network-level PoB metrics)
- [x] Attribution dispute mechanism
- [ ] PoB-to-reputation score pipeline

### P2
- [ ] On-chain PoB records (hash or full record)
- [ ] Cross-network PoB verification (third-party can verify)
- [ ] PoB-weighted governance voting
- [ ] PoB NFT badges for milestone achievements

---

## 7. Success Metrics

| Metric | Target |
|--------|--------|
| PoB generation rate (approved packets → PoB) | 100% (every approval creates PoB) |
| Anti-gaming flag rate | < 5% of PoB events |
| False positive rate on anti-gaming | < 10% of flagged events |
| Attribution dispute rate | < 3% |
| Average PoB value per event | Tracked, no specific target |
