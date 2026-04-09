# API List（API 清单）

> [Implementation Spec — 概览](./overview.md) · Table 2

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
