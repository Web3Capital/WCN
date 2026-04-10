# PRD-14: Data Cockpit System

> Status: Draft | Priority: P1 — Important | Owner: Product Lead
> Dependencies: All business systems (PRD-04 to PRD-13)
> Affects: Decision-making across all stakeholders

---

## 1. Overview

The Data Cockpit is WCN's analytics and intelligence layer. It aggregates data from all business systems into dashboards that enable nodes, admins, and the founding team to make data-driven decisions. It provides network-level health metrics, node-level performance, deal pipeline analytics, and Agent efficiency reports.

**Core Principle**: Every metric must be actionable. No vanity metrics. Every dashboard answers a specific question that leads to a specific action.

---

## 2. Dashboard Hierarchy

### Level 1: Network Overview (Admin + Founding Team)
- Total active nodes (by type, by region)
- Total active deals (by stage, by type)
- PoB generation rate (monthly trend)
- Total value settled (cumulative + monthly)
- Network growth rate (new nodes, new deals per month)
- Agent utilization rate

### Level 2: Node Performance (Node Admin)
- My node's deals (pipeline, active, closed)
- My node's PoB history and reputation trend
- My node's settlement summary
- My team's task completion rate
- Agent outputs generated / adopted for my deals

### Level 3: Deal Analytics (Deal Owner)
- Deal pipeline by stage
- Average deal cycle time
- Stage conversion rates (active → DD → negotiation → close)
- Stale deal alerts
- Top reasons for deal loss

### Level 4: System Health (CTO / Engineering)
- API response times
- Error rates
- Agent execution performance
- Database query performance
- User activity heatmap

---

## 3. Core User Stories

- US-14.1: As a platform admin, I can view a network overview dashboard showing total nodes, deals, PoB, and settlements.
- US-14.2: As a node admin, I can view my node's performance dashboard with deals, reputation, and settlements.
- US-14.3: As a Deal Owner, I can view deal pipeline analytics with conversion rates and cycle times.
- US-14.4: As a system, I auto-generate weekly network health reports.
- US-14.5: As an admin, I can export any dashboard data as CSV.
- US-14.6: As a system, I provide real-time alerts for anomalies (sudden drop in deal creation, spike in failed tasks).

---

## 4. Data Model

```
DashboardMetric
├── id: string
├── metricKey: string ("total_active_nodes", "monthly_pob_count", etc.)
├── value: decimal
├── dimensions: json? ({nodeType: "CAPITAL", region: "APAC"})
├── periodStart: datetime
├── periodEnd: datetime
├── calculatedAt: datetime

DashboardAlert
├── id: string
├── alertType: enum (ANOMALY, THRESHOLD, TREND)
├── metricKey: string
├── description: string
├── severity: enum (INFO, WARNING, CRITICAL)
├── acknowledged: boolean
├── acknowledgedBy: string? (FK → User)
├── createdAt: datetime

WeeklyReport
├── id: string
├── periodStart: datetime
├── periodEnd: datetime
├── metrics: json (all key metrics for the period)
├── highlights: string[] (notable events)
├── generatedAt: datetime
```

---

## 5. Key Metrics Catalog

| Category | Metric | Calculation | Frequency |
|----------|--------|-------------|-----------|
| **Network** | Active nodes | Nodes with status=ACTIVE | Real-time |
| **Network** | Deal creation rate | New deals / month | Daily |
| **Network** | PoB generation rate | New PoB events / month | Daily |
| **Network** | Total settled value | Sum of all settlement distributions | Daily |
| **Deals** | Pipeline value | Sum of deal target amounts by stage | Real-time |
| **Deals** | Average cycle time | Mean days from ACTIVE to CLOSED | Weekly |
| **Deals** | Close rate | CLOSED_WON / (CLOSED_WON + CLOSED_LOST) | Weekly |
| **Nodes** | Node retention | Active nodes 12 months after join / total joined | Monthly |
| **Nodes** | Avg reputation score | Mean of all active node scores | Monthly |
| **Agents** | Adoption rate | Approved outputs / total outputs | Weekly |
| **Agents** | Execution time P95 | 95th percentile execution time | Daily |
| **Settlement** | On-time rate | Settlements distributed within SLA | Per cycle |

---

## 6. Feature Breakdown

### P0
- [ ] Network overview dashboard (key metrics cards + charts)
- [ ] Node performance dashboard (my deals, my PoB, my settlements)
- [ ] Basic deal pipeline chart
- [ ] Data export (CSV)

### P1
- [ ] Deal analytics dashboard (conversion rates, cycle times, loss reasons)
- [ ] Agent performance dashboard
- [ ] Automated weekly reports
- [ ] Anomaly detection alerts
- [ ] Metric trend charts (30/90/365 day)

### P2
- [ ] Custom dashboard builder
- [ ] API for external analytics tools
- [ ] Predictive analytics (deal close probability, settlement projections)
- [ ] Benchmarking (compare node performance to network average)

---

## 7. Success Metrics

| Metric | Target |
|--------|--------|
| Dashboard daily active users | > 60% of active node admins |
| Data freshness | < 5 minutes for real-time metrics |
| Weekly report open rate | > 70% |
| Alert response time | < 4 hours for critical alerts |
