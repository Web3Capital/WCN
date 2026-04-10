# PRD-11: Settlement System

> Status: Draft | Priority: P0 — Core | Owner: CTO Office
> Dependencies: PRD-10 (PoB)
> Affects: PRD-13 (Reputation), PRD-14 (Data Cockpit)

---

## 1. Overview

The Settlement System takes verified PoB events and converts attribution percentages into actual value distribution. Settlement runs periodically (weekly/monthly), aggregating all PoB from the period, calculating what each node is owed, and initiating distribution. This is the system that makes WCN's value proposition tangible — nodes get paid for real contributions.

**Core Principle**: Settlement follows PoB, PoB follows evidence, evidence follows execution. The chain is unbreakable: no payment without proof.

**TradFi Reference**: DTCC clearing and settlement + Bloomberg PORT (portfolio attribution) + prime brokerage settlement — WCN creates a programmatic equivalent for Web3 business networks.

---

## 2. Core User Stories

- US-11.1: As a system, I create periodic Settlement Runs (weekly/monthly) that aggregate all PoB events from the period.
- US-11.2: As a system, I calculate each node's settlement amount based on PoB attribution percentages and deal values.
- US-11.3: As a node, I can view my settlement history: amounts owed, paid, pending.
- US-11.4: As an admin, I can review and approve Settlement Runs before distribution.
- US-11.5: As a system, I support multiple settlement methods: fiat wire, stablecoin (USDC/USDT), WCN token (future).
- US-11.6: As a node, I can set my preferred settlement method and wallet/bank details.
- US-11.7: As an admin, I can handle settlement exceptions (disputes, holds, adjustments).

---

## 3. Data Model

```
SettlementPeriod
├── id: string
├── periodStart: datetime
├── periodEnd: datetime
├── status: enum (OPEN, CALCULATING, IN_REVIEW, APPROVED, DISTRIBUTING, COMPLETED, FAILED)
├── totalPoBEvents: int
├── totalValue: decimal
├── totalDistributed: decimal
├── approvedBy: string? (FK → User)
├── approvedAt: datetime?
├── distributedAt: datetime?
├── createdAt: datetime
└── updatedAt: datetime

SettlementEntry
├── id: string
├── periodId: string (FK → SettlementPeriod)
├── nodeId: string (FK → Node)
├── pobEventId: string (FK → PoBEvent)
├── attributionId: string (FK → PoBAttribution)
├── grossAmount: decimal
├── fees: decimal (platform fee %)
├── netAmount: decimal
├── currency: string ("USD", "USDC")
├── status: enum (CALCULATED, APPROVED, DISTRIBUTED, ON_HOLD, DISPUTED)
├── holdReason: string?
├── distributionMethod: enum (FIAT_WIRE, USDC, USDT, WCN_TOKEN)
├── distributionRef: string? (tx hash or wire ref)
├── distributedAt: datetime?
└── createdAt: datetime

SettlementPreference
├── id: string
├── nodeId: string (FK → Node)
├── preferredMethod: enum (FIAT_WIRE, USDC, USDT, WCN_TOKEN)
├── walletAddress: string? (for crypto settlement)
├── bankDetails: json? (encrypted, for fiat)
├── minimumPayout: decimal? (don't distribute below this amount)
└── updatedAt: datetime

SettlementDispute
├── id: string
├── entryId: string (FK → SettlementEntry)
├── raisedBy: string (FK → User)
├── reason: string
├── status: enum (OPEN, INVESTIGATING, RESOLVED, REJECTED)
├── resolution: string?
├── resolvedBy: string? (FK → User)
├── createdAt: datetime
└── resolvedAt: datetime?
```

---

## 4. Settlement Flow

```
Period ends (e.g., monthly cutoff)
  → System aggregates all ACTIVE PoB events from the period
  → For each PoB event, calculate settlement entries per attribution
  → Apply platform fee (e.g., 10%)
  → Generate Settlement Run (CALCULATING)
  → Admin reviews aggregate numbers (IN_REVIEW)
  → Admin approves (APPROVED)
  → System initiates distribution based on node preferences
    → Crypto: on-chain transfer to wallet
    → Fiat: bank wire request
  → Status: DISTRIBUTING → COMPLETED
  → Notifications sent to all nodes with settlement summary
```

---

## 5. Feature Breakdown

### P0
- [ ] Settlement period management (create, close periods)
- [ ] Settlement calculation engine (PoB → entries per node)
- [ ] Platform fee calculation and deduction
- [ ] Settlement review and approval workflow (admin)
- [ ] Settlement dashboard (per-node: history, pending, total earned)
- [ ] Settlement preference management (method, wallet/bank)
- [ ] Settlement entry detail view

### P1
- [ ] Multi-currency settlement (USDC, USDT, fiat)
- [ ] Settlement dispute handling workflow
- [ ] Settlement analytics (platform-level: total distributed, average per node, growth)
- [ ] Automated distribution for crypto settlements
- [ ] Settlement export (CSV/PDF for accounting)

### P2
- [ ] On-chain settlement (smart contract-based distribution)
- [ ] Real-time settlement (per-deal instead of periodic)
- [ ] Tax reporting integration
- [ ] Multi-jurisdiction settlement compliance

---

## 6. Success Metrics

| Metric | Target |
|--------|--------|
| Settlement accuracy | 100% (no calculation errors) |
| Settlement cycle time (period close → distribution) | < 7 days |
| Settlement dispute rate | < 2% |
| Node settlement satisfaction | > 90% |
| On-time distribution rate | > 95% |
