# PRD-12: Distribution & Liquidity System

> Status: Draft | Priority: P1 — Important | Owner: Product Lead
> Dependencies: PRD-04 (Project), PRD-06 (Deal Room)
> Affects: PRD-09 (Proof Desk), PRD-10 (PoB)

---

## 1. Overview

The Distribution & Liquidity System is Layer 4 of WCN's five-layer architecture. It manages how completed projects and funded tokens reach the market — exchange listings, market making coordination, media distribution, and KOL campaigns. This system turns internal business results into external market presence.

**Core Principle**: Distribution is not marketing — it is structured market entry with coordinated resources, clear timelines, and measurable outcomes that feed back into PoB.

**TradFi Reference**: IPO bookrunning + roadshow + designated market maker programs — WCN provides the Web3 equivalent in a coordinated, evidence-producing framework.

---

## 2. Core User Stories

- US-12.1: As a project node, I can create a Distribution Request specifying my market entry needs (listing, market making, media, community).
- US-12.2: As a system, I match distribution needs with network resources (exchange nodes, media nodes, KOL nodes, regional nodes).
- US-12.3: As a media/KOL node, I can view distribution opportunities and express interest.
- US-12.4: As a Deal Owner, I can coordinate a Distribution Campaign with multiple nodes working in parallel (listing + market making + PR + community).
- US-12.5: As a Growth Agent, I can track attribution for distribution activities (which channel drove what traffic/volume).
- US-12.6: As a system, I collect distribution evidence for PoB (listing confirmations, trading data, media reach metrics).

---

## 3. Data Model

```
DistributionCampaign
├── id: string
├── projectId: string (FK → Project)
├── dealId: string? (FK → Deal)
├── status: enum (PLANNING, ACTIVE, COMPLETED, CANCELLED)
├── campaignType: enum (TOKEN_LAUNCH, LISTING, GROWTH, AWARENESS, PARTNERSHIP)
├── budget: decimal?
├── startDate: datetime
├── endDate: datetime?
├── coordinatorNodeId: string (FK → Node)
├── channels: DistributionChannel[]
├── createdAt: datetime
└── updatedAt: datetime

DistributionChannel
├── id: string
├── campaignId: string (FK → DistributionCampaign)
├── channelType: enum (EXCHANGE, MARKET_MAKER, MEDIA, KOL, COMMUNITY, EVENT, OTHER)
├── nodeId: string (FK → Node, the provider)
├── description: string
├── status: enum (PLANNED, ACTIVE, COMPLETED)
├── deliverables: string[]
├── metrics: json? (impressions, clicks, volume, etc.)
├── cost: decimal?
├── evidenceItems: string[] (FK → EvidenceItem)
└── createdAt: datetime

ListingRecord
├── id: string
├── projectId: string (FK → Project)
├── exchange: string
├── pair: string (e.g., "WCN/USDT")
├── listedAt: datetime
├── facilitatedByNodeId: string? (FK → Node)
├── status: enum (PENDING, LIVE, DELISTED)
└── createdAt: datetime

MarketMakingAgreement
├── id: string
├── projectId: string (FK → Project)
├── makerNodeId: string (FK → Node)
├── exchange: string
├── terms: json (spread target, depth, duration)
├── status: enum (NEGOTIATING, ACTIVE, COMPLETED, TERMINATED)
├── startDate: datetime
├── endDate: datetime?
└── createdAt: datetime
```

---

## 4. Feature Breakdown

### P0
- [ ] Distribution campaign creation and management
- [ ] Channel coordination (exchange, MM, media, KOL)
- [ ] Campaign timeline and milestone tracking
- [ ] Basic distribution metrics tracking

### P1
- [ ] Growth Agent attribution tracking (channel → outcome)
- [ ] Listing management (track exchange listings per project)
- [ ] Market making agreement management
- [ ] Distribution evidence collection for PoB
- [ ] Media/KOL node discovery and matching

### P2
- [ ] Automated distribution analytics dashboard
- [ ] Integration with exchange APIs for real-time listing/trading data
- [ ] Distribution ROI calculation
- [ ] Distribution templates for common launch scenarios

---

## 5. Success Metrics

| Metric | Target |
|--------|--------|
| Distribution campaign completion rate | > 80% |
| Average channels per campaign | > 3 |
| Channel attribution coverage | > 70% of outcomes attributed |
| Time from campaign start to first listing | < 30 days |
