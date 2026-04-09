# WCN Operating Console — Implementation Spec

> Derived from PRD v1. Three tables: Page List, API List, Database Schema.
> Legend: ✅ = exists · 🔧 = exists but needs upgrade · 🆕 = new

---

## Table 1: Page List (页面清单)

### Auth & Account

| # | Page | Route | Status | Sprint | Notes |
|---|------|-------|--------|--------|-------|
| 1 | Login | `/login` | 🔧 | S0 | Add magic link, 2FA prompt, device fingerprint |
| 2 | Signup (removed) | `/signup` | 🔧 | S0 | Replace with Invite activation flow only |
| 3 | Invite Activation | `/invite/[token]` | 🆕 | S0 | Set password → 2FA → NDA → first login |
| 4 | 2FA Setup | `/account/2fa` | 🆕 | S0 | TOTP setup (mandatory for high-priv roles) |
| 5 | Account Settings | `/account` | 🆕 | S0 | Password, 2FA, devices, sessions |
| 6 | Workspace / Role Selector | `/workspace` | 🆕 | S0 | Post-login workspace + role picker |

### Dashboard — Left Nav

| # | Page | Route | Status | Sprint | Roles |
|---|------|-------|--------|--------|-------|
| 7 | My Workspace | `/dashboard` | 🔧 | S1 | All — role-specific widgets |
| 8 | Nodes — List | `/dashboard/nodes` | 🔧 | S1 | Admin, Node Owner |
| 9 | Nodes — Detail | `/dashboard/nodes/[id]` | 🔧 | S1 | Admin, Node Owner |
| 10 | Nodes — Application Review | `/dashboard/nodes/[id]/review` | 🆕 | S1 | Admin, Reviewer |
| 11 | Nodes — Contract / Billing | `/dashboard/nodes/[id]/billing` | 🆕 | S1 | Admin, Finance |
| 12 | Nodes — Onboarding Tracker | `/dashboard/nodes/[id]/onboarding` | 🆕 | S1 | Admin |
| 13 | Projects — List | `/dashboard/projects` | 🔧 | S1 | All scoped |
| 14 | Projects — Detail | `/dashboard/projects/[id]` | 🆕 | S1 | Scoped by role |
| 15 | Capital — List | `/dashboard/capital` | 🆕 | S1 | Admin, Capital Node |
| 16 | Capital — Detail | `/dashboard/capital/[id]` | 🆕 | S1 | Admin, Capital Node |
| 17 | Deal Room — List | `/dashboard/deals` | 🆕 | S2 | Scoped participants |
| 18 | Deal Room — Detail | `/dashboard/deals/[id]` | 🆕 | S2 | Participants only |
| 19 | Tasks — List | `/dashboard/tasks` | 🔧 | S2 | All scoped |
| 20 | Tasks — Detail | `/dashboard/tasks/[id]` | 🆕 | S2 | Assignee, owner |
| 21 | Proof Desk — Queue | `/dashboard/proof` | 🆕 | S3 | Admin, Reviewer |
| 22 | Proof Desk — Review | `/dashboard/proof/[id]` | 🆕 | S3 | Reviewer |
| 23 | PoB — List | `/dashboard/pob` | 🔧 | S3 | All scoped |
| 24 | PoB — Detail | `/dashboard/pob/[id]` | 🆕 | S3 | Scoped |
| 25 | Settlement — Cockpit | `/dashboard/settlement` | 🔧 | S4 | Finance Admin, scoped preview |
| 26 | Settlement — Cycle Detail | `/dashboard/settlement/[id]` | 🆕 | S4 | Finance Admin |
| 27 | Data Cockpit | `/dashboard/data` | 🆕 | S4 | Admin, Node Owner (scoped) |
| 28 | Risk Console | `/dashboard/risk` | 🆕 | S4 | Admin, Reviewer, Risk Desk |
| 29 | Agent Registry — List | `/dashboard/agents` | 🔧 | S2 | Admin, Agent Owner |
| 30 | Agent Registry — Detail | `/dashboard/agents/[id]` | 🆕 | S2 | Admin, Agent Owner |
| 31 | Agent — Logs | `/dashboard/agents/[id]/logs` | 🆕 | S2 | Admin, Agent Owner |
| 32 | Applications | `/dashboard/applications` | ✅ | S1 | Admin, applicant |
| 33 | Users / Invites | `/dashboard/admin/users` | 🔧 | S0 | Admin |
| 34 | Invite Management | `/dashboard/admin/invites` | 🆕 | S0 | Admin |
| 35 | Audit Log | `/dashboard/audit` | ✅ | S0 | Admin |
| 36 | Notifications Center | `/dashboard/notifications` | 🆕 | S3 | All |
| 37 | Phase 3 Roadmap | `/dashboard/assets` | ✅ | — | All |

### Top Bar (global, not separate pages)

| Component | Status | Sprint | Notes |
|-----------|--------|--------|-------|
| Global Search (Cmd+K) | ✅ | S2 | Extend to search all entity IDs |
| Notification Bell | 🆕 | S3 | Badge count + dropdown |
| Settlement Countdown | 🆕 | S4 | Current cycle + days remaining |
| Workspace Switcher | 🆕 | S0 | Multi-workspace support |
| Role Indicator | ✅ | S0 | Already shows Admin/Member pill |
| Account Menu | 🔧 | S0 | Add settings, devices, sign out all |

---

## Table 2: API List (API 清单)

### Auth & Account (Sprint 0)

| # | Method | Route | Status | Auth | Notes |
|---|--------|-------|--------|------|-------|
| 1 | POST | `/api/auth/[...nextauth]` | ✅ | — | NextAuth credentials |
| 2 | POST | `/api/auth/magic-link` | 🆕 | — | Email magic link |
| 3 | POST | `/api/invites` | 🆕 | Admin | Create invite (role, workspace, expiry) |
| 4 | GET | `/api/invites` | 🆕 | Admin | List invites |
| 5 | POST | `/api/invites/[token]/activate` | 🆕 | — | Activate: set password, accept terms |
| 6 | POST | `/api/account/2fa/setup` | 🆕 | Signed in | Generate TOTP secret + QR |
| 7 | POST | `/api/account/2fa/verify` | 🆕 | Signed in | Verify TOTP code, enable 2FA |
| 8 | GET | `/api/account/sessions` | 🆕 | Signed in | List active sessions/devices |
| 9 | DELETE | `/api/account/sessions` | 🆕 | Signed in | Revoke all other sessions |
| 10 | POST | `/api/account/password` | 🆕 | Signed in | Change password |
| 11 | POST | `/api/signup` | ✅→🔧 | — | Keep for legacy; gate behind invite |

### Users & RBAC (Sprint 0)

| # | Method | Route | Status | Auth | Notes |
|---|--------|-------|--------|------|-------|
| 12 | GET | `/api/users` | ✅ | Admin | Add filter by role, workspace |
| 13 | PATCH | `/api/users/[id]` | ✅ | Admin | Expand: status, workspace assignment |
| 14 | GET | `/api/users/[id]/permissions` | 🆕 | Admin | Computed permissions matrix |
| 15 | POST | `/api/workspaces` | 🆕 | Admin | Create workspace |
| 16 | GET | `/api/workspaces` | 🆕 | Signed in | List user's workspaces |

### Nodes (Sprint 1)

| # | Method | Route | Status | Auth | Notes |
|---|--------|-------|--------|------|-------|
| 17 | GET | `/api/nodes` | ✅ | Scoped | Add territory/status filter |
| 18 | POST | `/api/nodes` | ✅ | Admin | Expand: billing, territory claim |
| 19 | PATCH | `/api/nodes/[id]` | ✅ | Admin | Add: status transitions (full state machine) |
| 20 | GET | `/api/nodes/[id]` | 🆕 | Scoped | Full detail with relations |
| 21 | POST | `/api/nodes/[id]/review` | 🆕 | Admin | Approve/reject/need-more-info |
| 22 | POST | `/api/nodes/[id]/contract` | 🆕 | Admin | Send contract, update billing |
| 23 | POST | `/api/nodes/[id]/probation` | 🆕 | Admin | Initiate probation |
| 24 | POST | `/api/nodes/[id]/offboard` | 🆕 | Admin | Offboard node |
| 25 | GET | `/api/nodes/[id]/seats` | ✅ | Scoped | — |
| 26 | POST | `/api/nodes/[id]/seats` | ✅ | Admin | — |
| 27 | GET | `/api/nodes/[id]/stake` | ✅ | Scoped | — |
| 28 | POST | `/api/nodes/[id]/stake` | ✅ | Admin | — |
| 29 | GET | `/api/nodes/[id]/penalties` | ✅ | Scoped | — |
| 30 | POST | `/api/nodes/[id]/penalties` | ✅ | Admin | — |

### Projects (Sprint 1)

| # | Method | Route | Status | Auth | Notes |
|---|--------|-------|--------|------|-------|
| 31 | GET | `/api/projects` | ✅ | Scoped | Add stage/sector filter |
| 32 | POST | `/api/projects` | ✅ | Admin/NodeOwner | — |
| 33 | PATCH | `/api/projects/[id]` | ✅ | Scoped | Full state machine |
| 34 | GET | `/api/projects/[id]` | 🆕 | Scoped | Detail with materials tier |
| 35 | POST | `/api/projects/[id]/materials` | 🆕 | Scoped | Upload with confidentiality level |

### Capital Pool (Sprint 1)

| # | Method | Route | Status | Auth | Notes |
|---|--------|-------|--------|------|-------|
| 36 | GET | `/api/capital` | 🆕 | Admin/Capital | List profiles |
| 37 | POST | `/api/capital` | 🆕 | Admin | Create capital profile |
| 38 | PATCH | `/api/capital/[id]` | 🆕 | Admin/Capital | Update preferences |
| 39 | GET | `/api/capital/[id]` | 🆕 | Scoped | Detail with restrictions |

### Deal Room (Sprint 2)

| # | Method | Route | Status | Auth | Notes |
|---|--------|-------|--------|------|-------|
| 40 | GET | `/api/deals` | 🆕 | Scoped | List deals for participant |
| 41 | POST | `/api/deals` | 🆕 | Admin/NodeOwner | Create deal/loop |
| 42 | GET | `/api/deals/[id]` | 🆕 | Participant | Full room: materials, timeline, tasks |
| 43 | PATCH | `/api/deals/[id]` | 🆕 | Scoped | Stage transition |
| 44 | POST | `/api/deals/[id]/participants` | 🆕 | Admin | Add/remove participants |
| 45 | POST | `/api/deals/[id]/materials` | 🆕 | Participant | Upload to deal room |
| 46 | GET | `/api/deals/[id]/materials` | 🆕 | Participant | With access logging |
| 47 | POST | `/api/deals/[id]/notes` | 🆕 | Participant | Communication notes |
| 48 | POST | `/api/deals/[id]/milestones` | 🆕 | Admin | Add milestone |

### Tasks (Sprint 2)

| # | Method | Route | Status | Auth | Notes |
|---|--------|-------|--------|------|-------|
| 49 | GET | `/api/tasks` | ✅ | Scoped | Add deal/loop filter |
| 50 | POST | `/api/tasks` | ✅ | Admin/NodeOwner | Link to deal/loop |
| 51 | PATCH | `/api/tasks/[id]` | ✅ | Scoped | Full 9-state machine |
| 52 | GET | `/api/tasks/[id]` | 🆕 | Scoped | Detail with evidence, runs |

### Evidence & Proof Desk (Sprint 3)

| # | Method | Route | Status | Auth | Notes |
|---|--------|-------|--------|------|-------|
| 53 | GET | `/api/evidence` | ✅ | Scoped | Add type/entity filter |
| 54 | POST | `/api/evidence` | ✅ | Scoped | Add file hash, version |
| 55 | GET | `/api/evidence/[id]` | 🆕 | Scoped | With access log |
| 56 | GET | `/api/proof/queue` | 🆕 | Reviewer | SLA-sorted review queue |
| 57 | POST | `/api/proof/[id]/review` | 🆕 | Reviewer | Approve/reject/need-more |
| 58 | POST | `/api/proof/[id]/dispute` | 🆕 | Scoped | Initiate dispute |

### PoB (Sprint 3)

| # | Method | Route | Status | Auth | Notes |
|---|--------|-------|--------|------|-------|
| 59 | GET | `/api/pob` | ✅ | Scoped | — |
| 60 | POST | `/api/pob` | ✅ | Admin | Add deal/loop linkage |
| 61 | PATCH | `/api/pob/[id]` | ✅ | Admin | Full state machine |
| 62 | GET | `/api/pob/[id]` | 🆕 | Scoped | Detail with evidence, attrs |
| 63 | POST | `/api/pob/attribution` | ✅ | Admin | — |
| 64 | POST | `/api/pob/confirmations` | ✅ | Scoped | — |

### Disputes (Sprint 3)

| # | Method | Route | Status | Auth | Notes |
|---|--------|-------|--------|------|-------|
| 65 | GET | `/api/disputes` | ✅ | Scoped | — |
| 66 | POST | `/api/disputes` | ✅ | Admin | — |
| 67 | PATCH | `/api/disputes/[id]` | ✅ | Admin | — |

### Settlement (Sprint 4)

| # | Method | Route | Status | Auth | Notes |
|---|--------|-------|--------|------|-------|
| 68 | GET | `/api/settlement/cycles` | ✅ | Scoped | — |
| 69 | POST | `/api/settlement/cycles` | ✅ | Finance | — |
| 70 | POST | `/api/settlement/cycles/[id]/generate` | ✅ | Finance | — |
| 71 | POST | `/api/settlement/cycles/[id]/lock` | ✅ | Finance | Add dual control |
| 72 | POST | `/api/settlement/cycles/[id]/reopen` | 🆕 | Finance+Admin | Dual control reopen |
| 73 | POST | `/api/settlement/cycles/[id]/export` | 🆕 | Finance | CSV/JSON export |
| 74 | POST | `/api/settlement/preview` | ✅ | Admin | — |

### Agent Registry (Sprint 2)

| # | Method | Route | Status | Auth | Notes |
|---|--------|-------|--------|------|-------|
| 75 | GET | `/api/agents` | ✅ | Scoped | — |
| 76 | POST | `/api/agents` | ✅ | Admin/AgentOwner | — |
| 77 | PATCH | `/api/agents/[id]` | ✅ | Admin/AgentOwner | Add freeze levels |
| 78 | GET | `/api/agents/runs` | ✅ | Scoped | — |
| 79 | POST | `/api/agents/runs` | ✅ | System | — |
| 80 | GET | `/api/agents/[id]/logs` | 🆕 | AgentOwner | Structured agent logs |

### Data & Risk (Sprint 4)

| # | Method | Route | Status | Auth | Notes |
|---|--------|-------|--------|------|-------|
| 81 | GET | `/api/data/overview` | 🆕 | Admin | Network health metrics |
| 82 | GET | `/api/data/nodes` | 🆕 | Admin | Node activity breakdown |
| 83 | GET | `/api/data/pob` | 🆕 | Admin | PoB distribution |
| 84 | GET | `/api/risk/flags` | 🆕 | Admin/Risk | Active risk flags |
| 85 | POST | `/api/risk/freeze` | 🆕 | Admin | Freeze entity |
| 86 | POST | `/api/risk/override` | 🆕 | Admin | Emergency override |
| 87 | GET | `/api/risk/matrix` | 🆕 | Admin | Permissions matrix view |

### Notifications (Sprint 3)

| # | Method | Route | Status | Auth | Notes |
|---|--------|-------|--------|------|-------|
| 88 | GET | `/api/notifications` | 🆕 | Signed in | List for current user |
| 89 | PATCH | `/api/notifications/[id]` | 🆕 | Signed in | Mark read |
| 90 | POST | `/api/notifications/mark-all-read` | 🆕 | Signed in | — |

### Files (Sprint 0)

| # | Method | Route | Status | Auth | Notes |
|---|--------|-------|--------|------|-------|
| 91 | POST | `/api/files` | 🆕 | Signed in | Upload with hash, version, entity binding |
| 92 | GET | `/api/files/[id]` | 🆕 | Scoped | Download with access log |
| 93 | GET | `/api/files/[id]/versions` | 🆕 | Scoped | Version history |
| 94 | DELETE | `/api/files/[id]/share` | 🆕 | Owner | Revoke share |

### Audit (Sprint 0)

| # | Method | Route | Status | Auth | Notes |
|---|--------|-------|--------|------|-------|
| 95 | GET | `/api/audit` | ✅ | Admin | Add object/action/user/date filter |

### Reviews (Sprint 3)

| # | Method | Route | Status | Auth | Notes |
|---|--------|-------|--------|------|-------|
| 96 | GET | `/api/reviews` | ✅ | Admin | — |

**Totals: 96 endpoints — 34 exist (✅), 25 need upgrade (🔧), 37 new (🆕)**

---

## Table 3: Database Schema (数据库 schema)

### Legend
- ✅ Model exists
- 🔧 Model needs field additions
- 🆕 New model

### Enums to Add/Expand

| Enum | Status | Changes |
|------|--------|---------|
| `Role` | 🔧 | Add: `FOUNDER`, `FINANCE_ADMIN`, `NODE_OWNER`, `PROJECT_OWNER`, `CAPITAL_NODE`, `SERVICE_NODE`, `REVIEWER`, `RISK_DESK`, `AGENT_OWNER`, `OBSERVER` |
| `AccountStatus` | 🆕 | `INVITED`, `ACTIVE`, `PENDING_2FA`, `SUSPENDED`, `LOCKED`, `OFFBOARDED` |
| `NodeStatus` | 🔧 | Add: `UNDER_REVIEW`, `NEED_MORE_INFO`, `CONTRACTING`, `LIVE`, `PROBATION`, `OFFBOARDED` |
| `ProjectStatus` | 🔧 | Add: `SCREENED`, `CURATED`, `IN_DEAL_ROOM`, `ACTIVE`, `ON_HOLD` |
| `CapitalStatus` | 🆕 | `PROSPECT`, `QUALIFIED`, `ACTIVE`, `WARM`, `IN_DD`, `CLOSED`, `PASSED`, `DORMANT` |
| `DealStage` | 🆕 | `SOURCED`, `MATCHED`, `INTRO_SENT`, `MEETING_DONE`, `DD`, `TERM_SHEET`, `SIGNED`, `FUNDED`, `PASSED`, `PAUSED` |
| `TaskStatus` | 🔧 | Replace with: `DRAFT`, `ASSIGNED`, `IN_PROGRESS`, `SUBMITTED`, `ACCEPTED`, `REWORK`, `BLOCKED`, `CANCELLED`, `CLOSED` |
| `EvidenceReviewStatus` | 🆕 | `DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `DISPUTED` |
| `PoBEventStatus` | 🆕 | `CREATED`, `PENDING_REVIEW`, `EFFECTIVE`, `REJECTED`, `FROZEN` |
| `SettlementCycleStatus` | 🔧 | Add: `RECONCILED`, `EXPORTED`, `REOPENED` |
| `ConfidentialityLevel` | 🆕 | `PUBLIC`, `CERTIFIED_NODE`, `DEAL_ROOM`, `RESTRICTED` |
| `NotificationType` | 🆕 | `TASK_ASSIGNED`, `EVIDENCE_NEEDED`, `REVIEW_REJECTED`, `DISPUTE_OPENED`, `SETTLEMENT_CLOSING`, `SLA_WARNING` |
| `AgentOverrideLevel` | 🆕 | `L1_PAUSE_TASK`, `L2_PAUSE_INSTANCE`, `L3_PAUSE_CLASS` |

### Models

#### ✅ User — needs expansion

```
+ accountStatus    AccountStatus  @default(INVITED)
+ twoFactorSecret  String?
+ twoFactorEnabled Boolean        @default(false)
+ ndaAcceptedAt    DateTime?
+ lockedAt         DateTime?
+ lockReason       String?
+ failedLoginCount Int            @default(0)
+ lastLoginAt      DateTime?
+ lastLoginIp      String?
+ lastLoginDevice  String?
```

#### 🆕 Workspace

```
id              String   @id @default(cuid())
name            String
slug            String   @unique
description     String?
createdAt       DateTime @default(now())
updatedAt       DateTime @updatedAt
```

#### 🆕 WorkspaceMembership

```
id          String   @id @default(cuid())
userId      String
workspaceId String
role        Role
territory   String?
region      String?
createdAt   DateTime @default(now())
@@unique([userId, workspaceId])
```

#### 🆕 Invite

```
id          String        @id @default(cuid())
email       String
token       String        @unique @default(cuid())
role        Role
workspaceId String?
expiresAt   DateTime
activatedAt DateTime?
createdById String
createdAt   DateTime      @default(now())
@@index([email])
@@index([token])
```

#### ✅ Node — needs expansion

```
+ entityName       String?
+ entityType       String?
+ resourcesOffered String?
+ pastCases        String?
+ recommendation   String?
+ allowedServices  String[]  @default([])
+ riskLevel        String?
+ billingStatus    String?
+ depositStatus    String?
+ seatFeeStatus    String?
+ probationStartAt DateTime?
+ probationEndAt   DateTime?
+ onboardingScore  Int?
+ contractSentAt   DateTime?
+ goLiveAt         DateTime?
+ offboardedAt     DateTime?
```

#### ✅ Project — needs expansion

```
+ confidentialityLevel  ConfidentialityLevel @default(PUBLIC)
+ riskTags              String[]             @default([])
+ internalScore         Float?
+ internalNotes         String?
```

#### 🆕 CapitalProfile

```
id                String        @id @default(cuid())
status            CapitalStatus @default(PROSPECT)
name              String
entity            String?
investmentFocus   String[]      @default([])
ticketMin         Float?
ticketMax         Float?
jurisdictionLimit String[]      @default([])
structurePref     String[]      @default([])
blacklist         String[]      @default([])
restrictions      String?
responseSpeed     Int?
activityScore     Float?
nodeId            String?
contactName       String?
contactEmail      String?
notes             String?
createdAt         DateTime      @default(now())
updatedAt         DateTime      @updatedAt
@@index([status])
@@index([nodeId])
```

#### 🆕 Deal (Business Loop)

```
id              String    @id @default(cuid())
stage           DealStage @default(SOURCED)
title           String
description     String?
projectId       String?
capitalId       String?
leadNodeId      String
riskTags        String[]  @default([])
nextAction      String?
nextActionDueAt DateTime?
closedAt        DateTime?
createdAt       DateTime  @default(now())
updatedAt       DateTime  @updatedAt
@@index([stage])
@@index([projectId])
@@index([leadNodeId])
```

#### 🆕 DealParticipant

```
id       String   @id @default(cuid())
dealId   String
nodeId   String?
userId   String?
role     String
joinedAt DateTime @default(now())
@@unique([dealId, nodeId])
@@unique([dealId, userId])
```

#### 🆕 DealMilestone

```
id        String    @id @default(cuid())
dealId    String
title     String
dueAt     DateTime?
doneAt    DateTime?
createdAt DateTime  @default(now())
@@index([dealId])
```

#### 🆕 DealNote (communication memo)

```
id        String   @id @default(cuid())
dealId    String
authorId  String
content   String
createdAt DateTime @default(now())
@@index([dealId, createdAt])
```

#### ✅ Task — needs expansion

```
+ dealId          String?
+ assigneeUserId  String?
+ evidenceRequired String[]  @default([])
+ acceptanceOwner String?
```

#### 🆕 File (attachment layer)

```
id                  String              @id @default(cuid())
filename            String
mimeType            String?
sizeBytes           Int?
hash                String?
version             Int                 @default(1)
confidentiality     ConfidentialityLevel @default(PUBLIC)
uploaderUserId      String
entityType          String
entityId            String
parentFileId        String?
createdAt           DateTime            @default(now())
@@index([entityType, entityId])
@@index([uploaderUserId])
```

#### 🆕 FileAccessLog

```
id        String   @id @default(cuid())
fileId    String
userId    String
action    String
createdAt DateTime @default(now())
@@index([fileId, createdAt])
@@index([userId, createdAt])
```

#### ✅ Evidence — needs expansion

```
+ fileId            String?
+ hash              String?
+ version           Int      @default(1)
+ reviewStatus      EvidenceReviewStatus @default(DRAFT)
+ reviewedAt        DateTime?
+ reviewerId        String?
+ dealId            String?
+ slaDeadlineAt     DateTime?
```

#### ✅ PoBRecord — needs expansion

```
+ dealId            String?
+ leadNodeId        String?
+ supportingNodeIds String[]  @default([])
+ beneficiaryEntity String?
+ resultDate        DateTime?
+ loopType          String?
+ pobStatus         PoBEventStatus @default(CREATED)
+ slaDeadlineAt     DateTime?
+ frozenAt          DateTime?
+ frozenReason      String?
```

#### 🆕 Notification

```
id          String           @id @default(cuid())
type        NotificationType
userId      String
title       String
body        String?
entityType  String?
entityId    String?
readAt      DateTime?
createdAt   DateTime         @default(now())
@@index([userId, readAt, createdAt])
```

#### 🆕 RiskFlag

```
id          String   @id @default(cuid())
entityType  String
entityId    String
severity    String
reason      String
raisedById  String?
resolvedAt  DateTime?
resolution  String?
createdAt   DateTime @default(now())
@@index([entityType, entityId])
@@index([severity, createdAt])
```

#### 🆕 AgentLog (structured)

```
id                String   @id @default(cuid())
agentId           String
ownerNodeId       String
taskId            String?
caseId            String?
modelVersion      String?
actionType        String
inputReference    String?
outputReference   String?
humanApprovalId   String?
exceptionFlag     Boolean  @default(false)
createdAt         DateTime @default(now())
@@index([agentId, createdAt])
@@index([taskId])
```

#### ✅ AuditLog — add fields

```
+ deviceInfo   String?
+ ipAddress    String?
+ workspaceId  String?
```

#### ✅ SettlementCycle — add fields

```
+ reconciledAt  DateTime?
+ exportedAt    DateTime?
+ reopenedAt    DateTime?
+ reopenReason  String?
+ lockedById    String?
+ exportedById  String?
```

#### Existing models that are complete (no schema changes needed)

- Account ✅
- Session ✅
- VerificationToken ✅
- Application ✅
- Review ✅
- Confirmation ✅
- Attribution ✅
- Dispute ✅
- Agent ✅ (add `freezeLevel` String?)
- AgentPermission ✅
- AgentRun ✅
- SettlementLine ✅
- NodeSeat ✅
- StakeLedger ✅
- Penalty ✅
- TaskAssignment ✅

---

## Summary Counts

| Category | Exists | Upgrade | New | Total |
|----------|--------|---------|-----|-------|
| Pages | 12 | 10 | 15 | 37 |
| API Endpoints | 34 | 25 | 37 | 96 |
| DB Models | 22 | 8 | 12 | 42 |
| Enums | 26 | 5 | 8 | 39 |

## Sprint Map

| Sprint | Theme | Pages | APIs | Models |
|--------|-------|-------|------|--------|
| S0 | Auth, RBAC, File, Audit | 6 | 16 | Workspace, Invite, File, FileAccessLog, User expansion |
| S1 | Node, Project, Capital, Workspace | 9 | 12 | CapitalProfile, Node expansion, Project expansion |
| S2 | Deal Room, Tasks, Agents, Search | 8 | 18 | Deal, DealParticipant, DealMilestone, DealNote, Task expansion |
| S3 | Proof Desk, PoB, Disputes, Notifications | 7 | 12 | Notification, Evidence expansion, PoBRecord expansion |
| S4 | Settlement, Data, Risk | 5 | 12 | RiskFlag, AgentLog, SettlementCycle expansion |
