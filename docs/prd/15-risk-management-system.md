# PRD-15: Risk Management System

> Status: Draft | Priority: P1 — Important | Owner: CTO Office
> Dependencies: PRD-02 (Node), PRD-04 (Project), PRD-10 (PoB)
> Affects: PRD-03 (Governance), PRD-06 (Deal Room)

---

## 1. Overview

The Risk Management System provides proactive risk identification, monitoring, and mitigation across the WCN network. It operates at three levels: node-level risk (counterparty), deal-level risk (transaction), and network-level risk (systemic). The system combines rule-based checks with pattern-based anomaly detection.

**Core Principle**: Prevention > Detection > Response. The cheapest risk is the one that never materializes because the system blocked it upstream.

**TradFi Reference**: Compliance monitoring (Chainalysis + Elliptic) + credit risk assessment (Moody's / S&P rating models) + operational risk management (Basel III framework) — adapted for a professional business network.

---

## 2. Risk Categories

### Node Risk (Counterparty)
- Unverified identity
- Poor track record (low reputation, high dispute rate)
- Sanctioned entity association
- Unusual behavior patterns
- Dormant node re-activation

### Deal Risk (Transaction)
- Abnormal deal size or terms
- Circular deal patterns
- Unusual participant composition
- Delayed milestones
- Evidence quality concerns

### Network Risk (Systemic)
- Concentration risk (too much value flowing through one node)
- Geographic concentration
- Sector concentration
- Platform dependence (one failure cascading)
- Regulatory changes affecting multiple nodes

---

## 3. Core User Stories

- US-15.1: As a system, I run automated risk checks on every new node application.
- US-15.2: As a system, I run automated risk checks on every new deal creation.
- US-15.3: As an admin, I can view a risk dashboard showing current risk alerts and trends.
- US-15.4: As a system, I flag deals that trigger risk rules and require additional review.
- US-15.5: As an admin, I can configure risk rules (thresholds, enabled/disabled, severity).
- US-15.6: As a system, I prevent certain actions when risk thresholds are exceeded (e.g., block deal creation for suspended nodes).
- US-15.7: As a system, I generate monthly risk reports for the founding team.
- US-15.8: As an admin, I can investigate flagged items and resolve them (confirm safe, escalate, block).

---

## 4. Data Model

```
RiskRule
├── id: string
├── name: string
├── category: enum (NODE, DEAL, NETWORK)
├── description: string
├── condition: json (rule definition)
├── severity: enum (LOW, MEDIUM, HIGH, CRITICAL)
├── action: enum (LOG, WARN, FLAG, BLOCK)
├── isActive: boolean
├── createdAt: datetime
└── updatedAt: datetime

RiskAlert
├── id: string
├── ruleId: string (FK → RiskRule)
├── entityType: enum (NODE, DEAL, POB_EVENT, USER)
├── entityId: string
├── severity: enum (LOW, MEDIUM, HIGH, CRITICAL)
├── description: string
├── metadata: json (details about what triggered)
├── status: enum (OPEN, INVESTIGATING, RESOLVED, DISMISSED)
├── resolvedBy: string? (FK → User)
├── resolution: string?
├── createdAt: datetime
└── resolvedAt: datetime?

RiskScore
├── id: string
├── entityType: enum (NODE, DEAL)
├── entityId: string
├── score: float (0-100, higher = riskier)
├── factors: json ({identity: 10, behavior: 25, sanctions: 0, ...})
├── tier: enum (LOW, MEDIUM, HIGH, CRITICAL)
├── calculatedAt: datetime
```

---

## 5. Risk Rules (Initial Set)

| Rule | Category | Trigger | Severity | Action |
|------|----------|---------|----------|--------|
| Sanctioned entity | NODE | Node name/entity matches OFAC/EU list | CRITICAL | BLOCK |
| Multiple failed logins | NODE | 10+ failed attempts | HIGH | FLAG |
| Dormant re-activation | NODE | No activity 180+ days then sudden activity | MEDIUM | FLAG |
| Circular deal | DEAL | Same 2 nodes in 3+ deals with no external party | HIGH | FLAG |
| Abnormal deal value | DEAL | Deal value > 3σ from node's average | MEDIUM | FLAG |
| Self-dealing | DEAL | Deal owner is sole capital provider | HIGH | BLOCK |
| Concentration | NETWORK | Single node > 20% of total PoB value | HIGH | WARN |
| Sector concentration | NETWORK | Single sector > 40% of deals | MEDIUM | LOG |

---

## 6. Feature Breakdown

### P0
- [ ] Risk rule engine (configurable rules with trigger → action)
- [ ] Automated risk checks on node applications
- [ ] Automated risk checks on deal creation
- [ ] Risk alert list with status management
- [ ] Basic risk dashboard (open alerts, severity distribution)
- [ ] Action enforcement (block, flag, warn)

### P1
- [ ] Node risk scoring
- [ ] Deal risk scoring
- [ ] Sanctions screening integration
- [ ] Network concentration monitoring
- [ ] Monthly risk report generation
- [ ] Risk alert escalation workflow

### P2
- [ ] ML-based anomaly detection
- [ ] Predictive risk modeling
- [ ] External data integration (on-chain analytics, media monitoring)
- [ ] Automated regulatory reporting

---

## 7. Success Metrics

| Metric | Target |
|--------|--------|
| Risk alert response time | < 24 hours for HIGH/CRITICAL |
| False positive rate | < 20% |
| Fraud prevented (blocked suspicious deals) | Track, no specific target |
| Risk rule coverage | > 90% of known risk patterns |
| Sanctions screening accuracy | 100% (zero missed sanctions) |
