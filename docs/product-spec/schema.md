# Database Schema（数据库）

> [Implementation Spec — 概览](./overview.md) · Table 3

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
