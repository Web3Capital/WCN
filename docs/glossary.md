# WCN Platform Glossary

> **Authoritative Source** -- This file is the single source of truth for all domain
> terminology used across the WCN codebase. When the code, PRDs, or architecture docs
> disagree with this glossary, update them to match. Last reconciled against
> `prisma/schema.prisma` and `lib/modules/nodes/registry.ts`.

---

## Table of Contents

1. [Key Business Concepts](#1-key-business-concepts)
2. [Node Types -- Two Layers](#2-node-types----two-layers)
3. [Platform Roles](#3-platform-roles-prisma-role-enum----13-values)
4. [Account Statuses](#4-account-statuses-prisma-accountstatus----6-values)
5. [Node Statuses](#5-node-statuses-prisma-nodestatus----12--1-legacy-values)
6. [Application Statuses](#6-application-statuses-prisma-applicationstatus----4-values)
7. [Deal Stages](#7-deal-stages-prisma-dealstage----10-values)
8. [Settlement Cycle Statuses](#8-settlement-cycle-statuses-prisma-settlementcyclestatus----8-values)
9. [PoB Event Statuses](#9-pob-event-statuses-prisma-pobeventstatus----5-values)
10. [PoB Record Statuses](#10-pob-record-statuses-prisma-pobrecordstatus----4-values)
11. [Evidence Review Statuses](#11-evidence-review-statuses-prisma-evidencereviewstatus----6-values)
12. [Task Statuses](#12-task-statuses-prisma-taskstatus----9--1-legacy-values)
13. [Review Enums](#13-review-enums)
14. [Staking and Penalties](#14-staking-and-penalties)
15. [Deprecated Terms](#15-deprecated-terms)

---

## 1. Key Business Concepts

| Term | Definition |
|------|-----------|
| **Node** | The accountable unit of the WCN network. A node is an *organizational entity* -- not a user account. A single company, fund, or service provider operates as one node. Nodes have both a platform type (topology) and a business role (capabilities). |
| **Deal Room** | A multi-party collaboration space for a business transaction. Connects project nodes with capital and service nodes through a structured workflow tracked by the Deal Stage enum. |
| **PoB (Proof of Business)** | The consensus mechanism that verifies real business outcomes occurred. PoB events are the atomic unit of value attribution in the network. |
| **Evidence Packet** | A collection of proof artifacts (documents, on-chain records, signed attestations) supporting a PoB claim. Reviewed through the Evidence Review Status lifecycle. |
| **Attribution** | Percentage-based credit assignment across deal participants. Determines how PoB-generated value is distributed in settlement. The sum of attributions for a deal must equal 100%. |
| **Settlement Cycle** | A periodic (weekly or monthly) aggregation and distribution of PoB-based value. Cycles progress through an eight-status lifecycle from DRAFT to FINALIZED. |
| **Scorecard** | A node's performance rating derived from PoB records, review outcomes, and network activity. Used for matching, ranking, and governance eligibility. |
| **Territory** | A geographic or sector-based jurisdiction assigned to a node. Defines the node's operational scope for deal matching and regional coordination. |
| **Workspace** | A scoped context within the platform. Users can hold different roles in different workspaces via RoleAssignment records. |

---

## 2. Node Types -- Two Layers

A single node has **both** a platform type and a business role. The platform type defines
where the node sits in the network topology. The business role defines what the node
*does* -- its capabilities and matching criteria.

### Platform Layer (Prisma `NodeType` enum -- topology)

Source: `prisma/schema.prisma` enum `NodeType`

| Value | Description |
|-------|-------------|
| `GLOBAL` | Top-level governance node (Genesis/Core nodes). Oversees network-wide policy and dispute resolution. |
| `REGION` | Geographic coordinator at the country or multi-country level. Manages regional nodes and local compliance. |
| `CITY` | City-level operational node. Handles on-the-ground deal facilitation and local events. |
| `INDUSTRY` | Vertical or sector-specific node (e.g., DeFi, GameFi, Infrastructure). Provides domain expertise. |
| `FUNCTIONAL` | Cross-cutting capability node (e.g., Legal, Compliance, Treasury). Serves multiple verticals. |
| `AGENT` | AI agent operator node. Executes automated tasks on behalf of other nodes. |

### Business Role Layer (Node Type Registry -- Phase 2, capabilities/matching)

Source: `lib/modules/nodes/registry.ts` -- not yet wired into Prisma

| Registry Key | Label | Description | Capabilities |
|-------------|-------|-------------|-------------|
| `CAPITAL` | Capital Node | Investment firms, funds, and angel investors | `invest`, `due_diligence` |
| `PROJECT` | Project Node | Web3 projects seeking funding or services | `fundraise`, `list_project` |
| `SERVICE` | Service Node | Legal, accounting, marketing, and technical service providers | `provide_service`, `task_execution` |
| `REGIONAL` | Regional Node | Geographic coordinators with local market knowledge | `regional_coordination`, `local_distribution` |
| `MEDIA_KOL` | Media / KOL Node | Media outlets and key opinion leaders for distribution | `content_creation`, `distribution` |

> **How the two layers relate:** A node with platform type `CITY` might have business
> role `CAPITAL` (a city-level investment fund) or `SERVICE` (a local legal firm). The
> `REGIONAL` business role overlaps conceptually with the `REGION`/`CITY` platform types
> but adds capability metadata for matching and deal flow.

---

## 3. Platform Roles (Prisma `Role` enum -- 13 values)

Source: `prisma/schema.prisma` enum `Role`

### Role Assignment Model

WCN uses a two-layer role model:

1. **`User.role`** -- The user's primary (global) role. Stored directly on the User record.
2. **`RoleAssignment`** -- Per-workspace role grants. A user can hold different roles in different workspaces (e.g., NODE_OWNER in workspace A, REVIEWER in workspace B).
3. **`User.activeRole`** -- The currently active role for context switching in the UI. Determines which dashboard views and permissions apply in the current session.

### Roles by Category

#### Governance

| Value | Description |
|-------|-------------|
| `FOUNDER` | Platform founders with full administrative access. Highest privilege level. |
| `ADMIN` | Platform administrators. Can manage users, nodes, and system configuration. |
| `FINANCE_ADMIN` | Financial operations administrator. Can manage settlement cycles, view financial reports, and approve payouts. |

#### Business

| Value | Description |
|-------|-------------|
| `NODE_OWNER` | Operator of a node entity. Manages the node's profile, team, and deal participation. |
| `PROJECT_OWNER` | Owner of a project listing. Can manage project details, fundraising, and service requests. |
| `CAPITAL_NODE` | Representative of a capital/investment node. Can review deals, perform due diligence, and commit funding. |
| `SERVICE_NODE` | Representative of a service provider node. Can accept tasks, deliver services, and submit PoB claims. |

#### Operations

| Value | Description |
|-------|-------------|
| `REVIEWER` | Assigned to review node applications, PoB claims, and evidence packets. |
| `RISK_DESK` | Risk and compliance officer. Monitors node health, investigates disputes, and can escalate to governance. |
| `AGENT_OWNER` | Operator of an AI agent node. Manages agent configuration and monitors automated task execution. |

#### Access

| Value | Description |
|-------|-------------|
| `USER` | Default role for authenticated users who have not yet been assigned a specific business role. |
| `OBSERVER` | Read-only access. Can view dashboards and reports but cannot take actions. |

#### Internal

| Value | Description |
|-------|-------------|
| `SYSTEM` | Internal system actor. Used for automated operations, audit trails, and system-initiated events. Not assignable to human users. |

---

## 4. Account Statuses (Prisma `AccountStatus` -- 6 values)

Source: `prisma/schema.prisma` enum `AccountStatus`

| Value | Description | Typical Transition |
|-------|-------------|--------------------|
| `INVITED` | User has been invited but has not completed registration. | Invite sent |
| `ACTIVE` | User has completed onboarding and can use the platform. | Registration complete |
| `PENDING_2FA` | User must set up two-factor authentication before proceeding. | First login or policy change |
| `SUSPENDED` | Account temporarily disabled by admin action or policy violation. | Admin action or automated rule |
| `LOCKED` | Account locked due to failed authentication attempts or security concern. | Auth failure threshold |
| `OFFBOARDED` | Account permanently deactivated. User data retained per policy. | Admin offboarding |

### Transition Diagram

```
INVITED --> ACTIVE --> PENDING_2FA --> ACTIVE
                  |                        |
                  +--> SUSPENDED ----------+
                  |                        |
                  +--> LOCKED -------------+
                  |
                  +--> OFFBOARDED (terminal)
```

---

## 5. Node Statuses (Prisma `NodeStatus` -- 12 + 1 legacy values)

Source: `prisma/schema.prisma` enum `NodeStatus`

| Value | Description | Phase |
|-------|-------------|-------|
| `DRAFT` | Node application started but not yet submitted. | Onboarding |
| `SUBMITTED` | Application submitted for review. | Onboarding |
| `UNDER_REVIEW` | Application is being reviewed by a reviewer. | Onboarding |
| `NEED_MORE_INFO` | Reviewer has requested additional information from the applicant. | Onboarding |
| `APPROVED` | Application approved. Node is cleared for contracting. | Onboarding |
| `REJECTED` | Application denied. Applicant may re-apply. | Onboarding |
| `CONTRACTING` | Legal and operational agreements being finalized. | Activation |
| `LIVE` | Node is fully operational and participating in the network. **Canonical active status.** | Active |
| `WATCHLIST` | Node flagged for monitoring due to performance or compliance concerns. | Oversight |
| `PROBATION` | Node under formal probation. Reduced privileges, increased oversight. | Oversight |
| `SUSPENDED` | Node operations temporarily halted by governance action. | Oversight |
| `OFFBOARDED` | Node permanently removed from the network. Terminal state. | Terminal |
| `ACTIVE` | **Legacy alias for `LIVE`.** Do not use in new code -- see [Deprecated Terms](#15-deprecated-terms). | Legacy |

### Transition Diagram

```
DRAFT --> SUBMITTED --> UNDER_REVIEW --> APPROVED --> CONTRACTING --> LIVE
                              |                                       |
                              +--> NEED_MORE_INFO --> UNDER_REVIEW    |
                              |                                       |
                              +--> REJECTED                           |
                                                                      |
          LIVE --> WATCHLIST --> PROBATION --> SUSPENDED --> OFFBOARDED
                      |             |             |
                      +---> LIVE <--+      +-> LIVE
```

---

## 6. Application Statuses (Prisma `ApplicationStatus` -- 4 values)

Source: `prisma/schema.prisma` enum `ApplicationStatus`

| Value | Description |
|-------|-------------|
| `PENDING` | Application submitted and awaiting assignment to a reviewer. |
| `REVIEWING` | Application assigned to a reviewer and under active evaluation. |
| `APPROVED` | Application approved. Triggers downstream node status change. |
| `REJECTED` | Application denied. |

---

## 7. Deal Stages (Prisma `DealStage` -- 10 values)

Source: `prisma/schema.prisma` enum `DealStage`

| Value | Description | Phase |
|-------|-------------|-------|
| `SOURCED` | Deal opportunity identified and entered into the system. | Discovery |
| `MATCHED` | Matching algorithm or manual curation has paired parties. | Discovery |
| `INTRO_SENT` | Introduction between matched parties has been sent. | Engagement |
| `MEETING_DONE` | Initial meeting between parties completed. | Engagement |
| `DD` | Due diligence in progress. Capital node evaluating project. | Evaluation |
| `TERM_SHEET` | Term sheet drafted or under negotiation. | Negotiation |
| `SIGNED` | Agreements signed by all parties. | Closing |
| `FUNDED` | Capital disbursed. Deal is complete. Terminal success state. | Closing |
| `PASSED` | Deal declined by one or more parties. Terminal exit state. | Terminal |
| `PAUSED` | Deal temporarily on hold. Can resume from current stage. | Hold |

### Transition Diagram

```
SOURCED --> MATCHED --> INTRO_SENT --> MEETING_DONE --> DD --> TERM_SHEET --> SIGNED --> FUNDED
   |           |            |              |           |          |            |
   +---> PASSED (any stage can exit to PASSED)
   |
   +---> PAUSED (any stage can pause; resumes to previous stage)
```

---

## 8. Settlement Cycle Statuses (Prisma `SettlementCycleStatus` -- 8 values)

Source: `prisma/schema.prisma` enum `SettlementCycleStatus`

| Value | Description |
|-------|-------------|
| `DRAFT` | Cycle created. PoB records are being accumulated. |
| `RECONCILED` | All PoB records for the period have been reconciled and attributed. |
| `LOCK_PENDING_APPROVAL` | Lock requested. Awaiting FINANCE_ADMIN approval to freeze the cycle. |
| `LOCKED` | Cycle frozen. No further modifications. Ready for payout calculation. |
| `EXPORTED` | Payout data exported to external payment systems. |
| `REOPEN_PENDING_APPROVAL` | Reopen requested due to dispute or error. Awaiting approval. |
| `REOPENED` | Previously locked cycle has been reopened for corrections. |
| `FINALIZED` | Cycle complete. All payouts confirmed. Terminal state. |

### Transition Diagram

```
DRAFT --> RECONCILED --> LOCK_PENDING_APPROVAL --> LOCKED --> EXPORTED --> FINALIZED
                                                     |
                                                     +--> REOPEN_PENDING_APPROVAL --> REOPENED
                                                                                        |
                                                                    RECONCILED <--------+
```

---

## 9. PoB Event Statuses (Prisma `PoBEventStatus` -- 5 values)

Source: `prisma/schema.prisma` enum `PoBEventStatus`

| Value | Description |
|-------|-------------|
| `CREATED` | PoB event recorded in the system. |
| `PENDING_REVIEW` | Event submitted for review with supporting evidence. |
| `EFFECTIVE` | Event verified and accepted. Will be included in settlement calculations. |
| `REJECTED` | Event failed review. Does not count toward settlement. |
| `FROZEN` | Event suspended pending dispute resolution or investigation. |

### Transition Diagram

```
CREATED --> PENDING_REVIEW --> EFFECTIVE
                |                  |
                +--> REJECTED      +--> FROZEN --> EFFECTIVE (after resolution)
                                                |
                                                +--> REJECTED
```

---

## 10. PoB Record Statuses (Prisma `PoBRecordStatus` -- 4 values)

Source: `prisma/schema.prisma` enum `PoBRecordStatus`

| Value | Description |
|-------|-------------|
| `PENDING` | Record created and awaiting review assignment. |
| `REVIEWING` | Record under active review by an assigned reviewer. |
| `APPROVED` | Record verified. Contributing to the node's scorecard. |
| `REJECTED` | Record failed verification. |

---

## 11. Evidence Review Statuses (Prisma `EvidenceReviewStatus` -- 6 values)

Source: `prisma/schema.prisma` enum `EvidenceReviewStatus`

| Value | Description |
|-------|-------------|
| `DRAFT` | Evidence packet being assembled. Not yet submitted. |
| `SUBMITTED` | Packet submitted for review. |
| `UNDER_REVIEW` | Reviewer is actively evaluating the evidence. |
| `APPROVED` | Evidence accepted as valid proof of the claimed business outcome. |
| `REJECTED` | Evidence insufficient or invalid. Claim denied. |
| `DISPUTED` | Counterparty or reviewer has raised a dispute. Escalated to governance. |

---

## 12. Task Statuses (Prisma `TaskStatus` -- 9 + 1 legacy values)

Source: `prisma/schema.prisma` enum `TaskStatus`

| Value | Description |
|-------|-------------|
| `DRAFT` | Task created but not yet assigned or actionable. |
| `ASSIGNED` | Task assigned to a node or user. Ready to begin. |
| `IN_PROGRESS` | Work is actively underway. |
| `SUBMITTED` | Work completed and submitted for review/acceptance. |
| `ACCEPTED` | Deliverable accepted by the requesting party. |
| `REWORK` | Deliverable returned for revision. |
| `BLOCKED` | Task cannot proceed due to an external dependency or issue. |
| `CANCELLED` | Task cancelled. No further work expected. Terminal state. |
| `CLOSED` | Task completed and closed. All follow-ups resolved. Terminal state. |
| `OPEN` | **Legacy alias.** Do not use in new code. Map to `ASSIGNED` or `DRAFT` as appropriate. |

---

## 13. Review Enums

### Review Decision (Prisma `ReviewDecision`)

| Value | Description |
|-------|-------------|
| `APPROVE` | Reviewer approves the item (node application, PoB claim, evidence packet). |
| `REJECT` | Reviewer denies the item. |
| `NEEDS_CHANGES` | Reviewer requests modifications before a final decision. |

### Review Status (Prisma `ReviewStatus`)

| Value | Description |
|-------|-------------|
| `OPEN` | Review is pending or in progress. |
| `RESOLVED` | Review is complete. A decision has been recorded. |

### Review Target Type (Prisma `ReviewTargetType`)

| Value | Description |
|-------|-------------|
| `NODE` | Review targets a node application. |
| `PROJECT` | Review targets a project listing. |

### Actor Type (Prisma `ActorType`)

| Value | Description |
|-------|-------------|
| `USER` | Action performed by a human user. |
| `NODE` | Action performed on behalf of a node entity. |
| `AGENT` | Action performed by an AI agent. |
| `SYSTEM` | Action performed by the platform automatically. |

---

## 14. Staking and Penalties

### Stake Action (Prisma `StakeAction`)

| Value | Description |
|-------|-------------|
| `DEPOSIT` | Node deposits stake into the network. |
| `WITHDRAW` | Node withdraws available (unfrozen) stake. |
| `FREEZE` | Stake frozen as part of a penalty or dispute. |
| `UNFREEZE` | Previously frozen stake released. |
| `SLASH` | Stake permanently removed as a penalty. Irreversible. |

### Penalty Type (Prisma `PenaltyType`)

| Value | Description |
|-------|-------------|
| `FREEZE` | Temporary penalty. Stake frozen for a defined period. |
| `SLASH` | Permanent penalty. Portion of stake destroyed. |

### Settlement Cycle Kind (Prisma `SettlementCycleKind`)

| Value | Description |
|-------|-------------|
| `WEEK` | Weekly settlement cycle. |
| `MONTH` | Monthly settlement cycle. |

---

## 15. Deprecated Terms

The following terms appear in older PRDs or code paths and should be migrated.

| Deprecated Term | Replacement | Context |
|----------------|-------------|---------|
| `ACTIVE` (NodeStatus) | `LIVE` | The `ACTIVE` value remains in the Prisma enum with a `// legacy` comment. All new code must use `LIVE`. Existing data should be migrated. |
| `OPEN` (TaskStatus) | `ASSIGNED` or `DRAFT` | The `OPEN` value remains in the Prisma enum with a `// legacy` comment. Map to `ASSIGNED` for tasks with an assignee, `DRAFT` otherwise. |
| `MEMBER` (Role) | `NODE_OWNER` / `PROJECT_OWNER` / specific business role | Early PRDs used a generic "MEMBER" role. The current schema uses specific business roles. |
| PRD-02 node types as Prisma enum | Two-layer model (platform type + business role) | Early designs placed `CAPITAL`, `PROJECT`, `SERVICE`, `REGIONAL`, `MEDIA_KOL` directly in the Prisma `NodeType` enum. The current architecture uses the Prisma `NodeType` for topology and the Node Type Registry (`lib/modules/nodes/registry.ts`) for business roles. |
| `IN_REVIEW` (PoB events) | `PENDING_REVIEW` | Some PRD documents reference `IN_REVIEW`. The Prisma enum uses `PENDING_REVIEW`. |
| `NEEDS_MORE_EVIDENCE` (Evidence) | `REJECTED` + resubmission | Some design docs reference a separate `NEEDS_MORE_EVIDENCE` status. The current schema uses `REJECTED` with the expectation that the submitter creates a new evidence packet. Alternatively, a reviewer can use `ReviewDecision.NEEDS_CHANGES`. |
| `DISPUTED` (PoB events) | `FROZEN` | Some specs use `DISPUTED` for PoB events. The Prisma enum uses `FROZEN` to indicate a suspended event pending dispute resolution. |

---

## Cross-Reference: Prisma Enums at a Glance

| Enum Name | Schema Location | Value Count | Section |
|-----------|----------------|-------------|---------|
| `Role` | `prisma/schema.prisma:11` | 13 | [Platform Roles](#3-platform-roles-prisma-role-enum----13-values) |
| `AccountStatus` | `prisma/schema.prisma:27` | 6 | [Account Statuses](#4-account-statuses-prisma-accountstatus----6-values) |
| `ApplicationStatus` | `prisma/schema.prisma:36` | 4 | [Application Statuses](#6-application-statuses-prisma-applicationstatus----4-values) |
| `NodeType` | `prisma/schema.prisma:43` | 6 | [Node Types](#2-node-types----two-layers) |
| `NodeStatus` | `prisma/schema.prisma:52` | 13 | [Node Statuses](#5-node-statuses-prisma-nodestatus----12--1-legacy-values) |
| `DealStage` | `prisma/schema.prisma:103` | 10 | [Deal Stages](#7-deal-stages-prisma-dealstage----10-values) |
| `TaskStatus` | `prisma/schema.prisma:126` | 10 | [Task Statuses](#12-task-statuses-prisma-taskstatus----9--1-legacy-values) |
| `EvidenceReviewStatus` | `prisma/schema.prisma:156` | 6 | [Evidence Review Statuses](#11-evidence-review-statuses-prisma-evidencereviewstatus----6-values) |
| `PoBRecordStatus` | `prisma/schema.prisma:165` | 4 | [PoB Record Statuses](#10-pob-record-statuses-prisma-pobrecordstatus----4-values) |
| `PoBEventStatus` | `prisma/schema.prisma:172` | 5 | [PoB Event Statuses](#9-pob-event-statuses-prisma-pobeventstatus----5-values) |
| `ReviewDecision` | `prisma/schema.prisma:191` | 3 | [Review Enums](#13-review-enums) |
| `ReviewStatus` | `prisma/schema.prisma:197` | 2 | [Review Enums](#13-review-enums) |
| `SettlementCycleStatus` | `prisma/schema.prisma:289` | 8 | [Settlement Cycle Statuses](#8-settlement-cycle-statuses-prisma-settlementcyclestatus----8-values) |
| `StakeAction` | `prisma/schema.prisma:300` | 5 | [Staking and Penalties](#14-staking-and-penalties) |
| `PenaltyType` | `prisma/schema.prisma:308` | 2 | [Staking and Penalties](#14-staking-and-penalties) |
| `SettlementCycleKind` | `prisma/schema.prisma:284` | 2 | [Staking and Penalties](#14-staking-and-penalties) |
