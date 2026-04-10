# PRD-18: Audit Log System

> Status: Draft | Priority: P0 — Foundation | Owner: CTO Office
> Dependencies: All systems (receives events from everything)
> Affects: PRD-03 (Governance), PRD-15 (Risk), regulatory compliance

---

## 1. Overview

The Audit Log System records every significant action across the entire WCN platform into an immutable, queryable log. It serves three purposes: security forensics (who did what), regulatory compliance (provable trail for auditors), and operational debugging (what happened and when). Every system in WCN writes to the audit log; nothing happens in silence.

**Core Principle**: If it's not logged, it didn't happen. The audit log is append-only, tamper-evident, and retained for the regulatory minimum (typically 7 years for financial platforms). No one — including admins — can delete audit records.

**TradFi Reference**: SOX compliance logging (Sarbanes-Oxley) + Basel III operational risk records + SEC Rule 17a-4 (electronic records retention) — adapted for a digital-native platform.

---

## 2. Event Categories

| Category | Events | Examples |
|----------|--------|----------|
| **Auth** | Login, logout, failed login, 2FA, password change, session revoke | User X logged in from IP Y |
| **Identity** | Role change, account status change, permission grant/revoke | Admin changed User X role to MEMBER |
| **Node** | Application, approval, status change, member add/remove, profile update | Node A status changed from ACTIVE to PROBATION |
| **Project** | Create, update, status change, material upload | Project Y funding need updated |
| **Deal** | Create, stage change, participant add/remove, material upload, close | Deal Z moved to DUE_DILIGENCE |
| **Task** | Create, assign, status change, output upload, review | Task assigned to User X, due in 5 days |
| **Agent** | Execution start/end, output generated, output reviewed | Research Agent generated summary for Project Y |
| **Evidence** | Packet created, item added, submitted, reviewed | Evidence Packet for Deal Z approved |
| **PoB** | Event created, attribution calculated, flagged | PoB Event created, Node A: 30%, Node B: 25% |
| **Settlement** | Period created, calculated, approved, distributed | Settlement for March approved, $50K distributed |
| **Risk** | Alert created, investigated, resolved | Risk alert: circular deal pattern detected |
| **Governance** | Proposal created, vote cast, proposal executed | Proposal P-12 passed with 78% approval |
| **Admin** | System config change, rule update, manual override | Admin enabled new risk rule |

---

## 3. Core User Stories

- US-18.1: As a system, I log every significant action with: who, what, when, where (IP/device), and the before/after state.
- US-18.2: As an admin, I can search and filter audit logs by user, action, entity, date range, and severity.
- US-18.3: As an admin, I can export audit logs for external audit reviews.
- US-18.4: As a system, I enforce append-only semantics — no update or delete on audit records.
- US-18.5: As a system, I retain audit logs for a configurable period (default: 7 years).
- US-18.6: As a compliance officer, I can generate regulatory reports from audit data.
- US-18.7: As a security team member, I can trace a complete session history for any user (all actions in a session).
- US-18.8: As a system, I detect and alert on suspicious audit patterns (many failed operations, rapid changes, after-hours admin actions).

---

## 4. Data Model

```
AuditEntry
├── id: string (UUID v7, time-ordered)
├── timestamp: datetime (nanosecond precision)
├── category: enum (AUTH, IDENTITY, NODE, PROJECT, DEAL, TASK, AGENT, EVIDENCE, POB, SETTLEMENT, RISK, GOVERNANCE, ADMIN)
├── action: string ("user.login", "deal.stage_change", "settlement.approved", etc.)
├── severity: enum (INFO, WARN, ERROR, CRITICAL)
├── actorId: string? (FK → User, null for system events)
├── actorType: enum (USER, ADMIN, AGENT, SYSTEM)
├── actorIp: string?
├── actorUserAgent: string?
├── sessionId: string?
├── entityType: string? ("User", "Node", "Deal", "Task", etc.)
├── entityId: string?
├── entityName: string? (human-readable, for search convenience)
├── beforeState: json? (entity state before action)
├── afterState: json? (entity state after action)
├── metadata: json? (additional context)
├── requestId: string? (trace ID for request correlation)
├── success: boolean
├── errorMessage: string?
├── @@index([timestamp])
├── @@index([actorId, timestamp])
├── @@index([entityType, entityId, timestamp])
└── @@index([category, action, timestamp])
```

---

## 5. Logging Standards

### Required Fields for Every Entry
- `timestamp`: When (server time, UTC)
- `category`: Which system
- `action`: What happened (dot-notation: `entity.verb`)
- `actorId` + `actorType`: Who did it
- `success`: Did it work

### Required for State-Changing Actions
- `entityType` + `entityId`: What was affected
- `beforeState` + `afterState`: What changed (diff-friendly)

### Required for Security-Sensitive Actions
- `actorIp` + `actorUserAgent`: From where
- `sessionId`: Which session

---

## 6. Feature Breakdown

### P0
- [ ] Audit logging SDK / middleware (all systems can emit audit events with one function call)
- [ ] Append-only storage (no UPDATE/DELETE on audit table)
- [ ] Audit log viewer UI (search, filter, pagination)
- [ ] Basic search: by user, action, entity, date range
- [ ] Export to CSV/JSON
- [ ] Retention policy enforcement (auto-archive after configurable period)

### P1
- [ ] Anomaly detection on audit patterns
- [ ] Session reconstruction (trace all actions in a user session)
- [ ] Admin action alerting (real-time alerts for admin operations)
- [ ] Entity history view (show audit trail on any entity's detail page)
- [ ] Regulatory report templates

### P2
- [ ] Tamper-evidence (hash chain or Merkle tree for integrity)
- [ ] On-chain anchoring (periodic hash of audit log on blockchain)
- [ ] Long-term archival (cold storage for >1 year old entries)
- [ ] Cross-system correlation (link audit events across systems)
- [ ] GraphQL API for audit queries

---

## 7. Integration Pattern

Every system integrates with the audit log through a unified SDK:

```typescript
// Usage in any service:
import { audit } from "@/lib/audit";

await audit({
  category: "DEAL",
  action: "deal.stage_change",
  actorId: currentUser.id,
  entityType: "Deal",
  entityId: deal.id,
  beforeState: { status: "ACTIVE" },
  afterState: { status: "DUE_DILIGENCE" },
  metadata: { reason: "DD documents received" },
});
```

The SDK handles:
- Enriching with IP, user agent, session ID from request context
- Validating required fields
- Writing to append-only store
- Emitting real-time events for anomaly detection

---

## 8. Success Metrics

| Metric | Target |
|--------|--------|
| Log completeness (% of significant actions logged) | 100% |
| Log latency (time from action to log entry) | < 100ms |
| Storage efficiency | < 1KB per entry average |
| Query performance (typical search) | < 500ms |
| Audit log uptime | 99.99% |
| Regulatory audit readiness | Pass on request |

---

## 9. Compliance Considerations

| Regulation | Requirement | How We Address |
|------------|-------------|----------------|
| SOX (if applicable) | Complete financial transaction trail | All settlement/PoB/deal events logged with before/after |
| GDPR | Right to erasure | Audit logs retained but PII can be pseudonymized after retention period |
| SOC 2 | Access logs, change management | Auth events, role changes, system config changes all logged |
| MiCA (EU crypto) | Transaction records, conflict management | Deal/settlement/PoB events with attribution data |
| SEC 17a-4 | Immutable records, 6-year retention | Append-only storage, 7-year default retention |
