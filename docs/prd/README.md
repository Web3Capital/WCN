# WCN Product Requirements Documents

> 18 Systems | 5 Layers | 1 Ecosystem

---

## System Architecture Overview

```
┌────────────────────────────────────────────────────────────────────┐
│                    智能与运营层 Intelligence & Ops                    │
│  PRD-14 Data Cockpit │ PRD-15 Risk │ PRD-16 Notification           │
│  PRD-17 Search       │ PRD-18 Audit Log                            │
├────────────────────────────────────────────────────────────────────┤
│                  分发与市场层 Distribution & Market                   │
│  PRD-12 Distribution & Liquidity │ PRD-13 Reputation                │
├────────────────────────────────────────────────────────────────────┤
│                  验证与结算层 Verification & Settlement               │
│  PRD-09 Proof Desk │ PRD-10 PoB Verification │ PRD-11 Settlement   │
├────────────────────────────────────────────────────────────────────┤
│                     业务核心层 Business Core                         │
│  PRD-04 Project & Asset │ PRD-05 Capital Config │ PRD-06 Deal Room │
│  PRD-07 Task Dispatch   │ PRD-08 AI Agent                          │
├────────────────────────────────────────────────────────────────────┤
│                     基础设施层 Infrastructure                        │
│  PRD-01 Identity & Permission │ PRD-02 Node Management             │
│  PRD-03 Governance                                                  │
└────────────────────────────────────────────────────────────────────┘
```

---

## Document Index

### Infrastructure Layer (基础设施层)

| # | System | Priority | Status | File |
|---|--------|----------|--------|------|
| 01 | [Identity & Permission](./01-identity-permission-system.md) | P0 | Draft | `01-identity-permission-system.md` |
| 02 | [Node Management](./02-node-management-system.md) | P0 | Draft | `02-node-management-system.md` |
| 03 | [Governance](./03-governance-system.md) | P1 | Draft | `03-governance-system.md` |

### Business Core Layer (业务核心层)

| # | System | Priority | Status | File |
|---|--------|----------|--------|------|
| 04 | [Project & Asset](./04-project-asset-system.md) | P0 | Draft | `04-project-asset-system.md` |
| 05 | [Capital Configuration](./05-capital-configuration-system.md) | P0 | Draft | `05-capital-configuration-system.md` |
| 06 | [Deal Room](./06-deal-room-system.md) | P0 | Draft | `06-deal-room-system.md` |
| 07 | [Task Dispatch](./07-task-dispatch-system.md) | P0 | Draft | `07-task-dispatch-system.md` |
| 08 | [AI Agent](./08-ai-agent-system.md) | P0 | Draft | `08-ai-agent-system.md` |

### Verification & Settlement Layer (验证与结算层)

| # | System | Priority | Status | File |
|---|--------|----------|--------|------|
| 09 | [Proof Desk](./09-proof-desk-system.md) | P0 | Draft | `09-proof-desk-system.md` |
| 10 | [PoB Verification](./10-pob-verification-system.md) | P0 | Draft | `10-pob-verification-system.md` |
| 11 | [Settlement](./11-settlement-system.md) | P0 | Draft | `11-settlement-system.md` |

### Distribution & Market Layer (分发与市场层)

| # | System | Priority | Status | File |
|---|--------|----------|--------|------|
| 12 | [Distribution & Liquidity](./12-distribution-liquidity-system.md) | P1 | Draft | `12-distribution-liquidity-system.md` |
| 13 | [Reputation](./13-reputation-system.md) | P1 | Draft | `13-reputation-system.md` |

### Intelligence & Operations Layer (智能与运营层)

| # | System | Priority | Status | File |
|---|--------|----------|--------|------|
| 14 | [Data Cockpit](./14-data-cockpit-system.md) | P1 | Draft | `14-data-cockpit-system.md` |
| 15 | [Risk Management](./15-risk-management-system.md) | P1 | Draft | `15-risk-management-system.md` |
| 16 | [Notification & Messaging](./16-notification-messaging-system.md) | P1 | Draft | `16-notification-messaging-system.md` |
| 17 | [Search & Discovery](./17-search-discovery-system.md) | P1 | Draft | `17-search-discovery-system.md` |
| 18 | [Audit Log](./18-audit-log-system.md) | P0 | Draft | `18-audit-log-system.md` |

---

## Priority Summary

### P0 — Must Build First (12 systems)
1. Identity & Permission
2. Node Management
4. Project & Asset
5. Capital Configuration
6. Deal Room
7. Task Dispatch
8. AI Agent
9. Proof Desk
10. PoB Verification
11. Settlement
18. Audit Log

### P1 — Build After Core (6 systems)
3. Governance
12. Distribution & Liquidity
13. Reputation
14. Data Cockpit
15. Risk Management
16. Notification & Messaging
17. Search & Discovery

---

## Recommended Build Sequence

```
Phase 1 (Foundation):     PRD-01 → PRD-02 → PRD-18
Phase 2 (Business Core):  PRD-04 → PRD-05 → PRD-06 → PRD-07 → PRD-08
Phase 3 (Value Loop):     PRD-09 → PRD-10 → PRD-11
Phase 4 (Intelligence):   PRD-14 → PRD-15 → PRD-16 → PRD-17
Phase 5 (Growth):         PRD-12 → PRD-13 → PRD-03
```

---

## Each PRD Contains

- Overview & core principle
- Target users
- User stories (numbered US-X.Y)
- Data model (entity definitions + relationships)
- Feature breakdown (P0 / P1 / P2)
- Key flows (state machines, sequence descriptions)
- API surface (endpoints, auth, methods)
- UI requirements (pages, layouts, components)
- Success metrics (measurable targets)
- Open questions (decisions to be made)
