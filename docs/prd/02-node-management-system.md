# PRD-02: Node Management System

> **Note:** 战略与 v1.0 口径以 **[Node Network System PRD v1.0](./node-network-system-prd-v1.md)** 为准；本文档为早期草案，保留作历史用户故事与字段参考，后续与 v1.0 对齐时以合并/废弃标记更新。

> Status: Draft | Priority: P0 — Core | Owner: CTO Office
> Dependencies: PRD-01 (Identity & Permission)
> Affects: PRD-04 to PRD-18 (all business systems)

---

## 1. Overview

Nodes are the atomic unit of the WCN network. Every participant — VC, project, service provider, regional partner, media outlet — is a "node." The Node Management System handles the full lifecycle from application to retirement, including classification, capability registration, seat management, and performance tracking.

**Core Principle**: A node is not a user account — it is an organizational entity with verified resources, responsibilities, and track record. One node may have multiple users; one user may represent one node.

---

## 2. Target Users

| User Type | Description |
|-----------|-------------|
| **Applicant** | Organization/individual applying to become a node |
| **Node Admin** | Primary operator of an approved node |
| **Node Member** | Team member within a node |
| **Platform Admin** | WCN team reviewing and managing nodes |

---

## 3. Core User Stories

### Application & Onboarding
- US-2.1: As an applicant, I can submit a node application with my organization details, node type, resources, and needs.
- US-2.2: As a platform admin, I can review applications, request additional information, and approve/reject.
- US-2.3: As an approved node, I receive a welcome flow with seat assignment, permissions, and platform orientation.
- US-2.4: As a node admin, I can invite team members to my node with appropriate sub-roles.

### Node Profile & Classification
- US-2.5: As a node, I have a structured profile showing: type, capabilities, region, track record, and reputation score.
- US-2.6: As a system, I classify nodes into types: Capital, Project, Service, Regional, Media/KOL, Industry.
- US-2.7: As a node, I can update my capability profile (investment preferences, service offerings, regional coverage).
- US-2.8: As a platform admin, I can override node classification and tier.

### Lifecycle Management
- US-2.9: As a platform admin, I can transition nodes through lifecycle stages: Pending → Active → Probation → Suspended → Offboarded.
- US-2.10: As a node, I receive notifications when my status changes with clear explanation and appeal process.
- US-2.11: As a system, I automatically flag nodes with no activity for 90 days for review.
- US-2.12: As a node admin, I can voluntarily offboard with a proper exit process (data retention, pending settlements).

### Seat Management
- US-2.13: As a platform admin, I can assign seat tiers (Foundation / Standard / Premium) with different privilege levels.
- US-2.14: As a node, my seat tier determines: Deal Room access, Agent quota, matching priority, and settlement weight.
- US-2.15: As a system, I enforce seat limits per tier (e.g., max 500 Foundation nodes, 100 Premium nodes).

---

## 4. Data Model

```
Node
├── id: string (cuid)
├── name: string
├── type: enum (CAPITAL, PROJECT, SERVICE, REGIONAL, MEDIA_KOL, INDUSTRY)
├── subType: string? ("VC", "Family Office", "Legal", "Audit", etc.)
├── status: enum (PENDING, ACTIVE, PROBATION, SUSPENDED, OFFBOARDED)
├── tier: enum (FOUNDATION, STANDARD, PREMIUM)
├── organizationName: string
├── description: string?
├── website: string?
├── logo: string?
├── region: string[] (e.g., ["APAC", "Middle East"])
├── capabilities: json (structured by node type)
│   ├── capital: { stages[], sectors[], ticketRange, instruments[] }
│   ├── service: { serviceTypes[], deliverables[], pricing }
│   ├── regional: { countries[], cities[], localNetworks }
│   └── media: { platforms[], audienceSize, contentTypes[] }
├── reputationScore: float (0-100, calculated from PoB history)
├── totalDeals: int
├── totalPoB: int
├── totalSettled: decimal
├── activeSince: datetime?
├── lastActivityAt: datetime?
├── onboardedBy: string? (FK → User, admin who approved)
├── members: NodeMember[]
├── createdAt: datetime
└── updatedAt: datetime

NodeMember
├── id: string
├── nodeId: string (FK → Node)
├── userId: string (FK → User)
├── role: enum (NODE_ADMIN, NODE_MEMBER, NODE_OBSERVER)
├── joinedAt: datetime
└── invitedBy: string? (FK → User)

NodeApplication
├── id: string
├── applicantName: string
├── contact: string
├── organization: string?
├── role: string?
├── nodeType: string?
├── resources: string?
├── lookingFor: string?
├── linkedin: string?
├── whyWcn: string?
├── status: enum (PENDING, REVIEWING, APPROVED, REJECTED, WAITLISTED)
├── reviewNotes: string?
├── reviewedBy: string? (FK → User)
├── reviewedAt: datetime?
├── userId: string? (FK → User)
├── convertedNodeId: string? (FK → Node)
├── createdAt: datetime
└── updatedAt: datetime

NodeStatusChange
├── id: string
├── nodeId: string (FK → Node)
├── fromStatus: enum
├── toStatus: enum
├── reason: string
├── changedBy: string (FK → User)
└── createdAt: datetime
```

---

## 5. Feature Breakdown

### P0 — Must Have
- [ ] Node application form (public-facing, already built)
- [ ] Application review dashboard (admin)
- [ ] Application approve/reject workflow with email notification
- [ ] Node profile CRUD (basic info, type, region, capabilities)
- [ ] Node member management (invite, remove, change role)
- [ ] Node status lifecycle (pending → active → suspended → offboarded)
- [ ] Node list with search/filter/sort (admin + member views)
- [ ] Node detail page with profile, members, and activity summary
- [ ] Seat tier assignment (Foundation / Standard / Premium)

### P1 — Should Have
- [ ] Auto-classification based on application data
- [ ] Inactivity detection and alerting (90-day threshold)
- [ ] Node capability matching index (used by Deal matching)
- [ ] Bulk import for seed nodes (CSV/JSON)
- [ ] Node comparison view (side-by-side capability comparison)
- [ ] Public node directory (limited profile info)

### P2 — Nice to Have
- [ ] Node NFT minting on approval (linked to PRD-01)
- [ ] On-chain node registry
- [ ] Node merger/split handling
- [ ] Alumni network (offboarded nodes with historical data access)
- [ ] Node referral tracking and rewards

---

## 6. Key Flows

### Application → Approval Flow
```
Applicant fills /apply form → NodeApplication created (PENDING)
  → Admin reviews in /dashboard/applications → Sets to REVIEWING
  → Admin approves → Status: APPROVED
  → System creates Node entity (PENDING status)
  → System creates User (if not exist) + NodeMember (NODE_ADMIN role)
  → Welcome email sent with login link
  → Node admin completes profile → Node status: ACTIVE
```

### Status Transition Rules
```
PENDING → ACTIVE (admin approval + profile completed)
ACTIVE → PROBATION (policy violation or performance issue)
PROBATION → ACTIVE (issue resolved within 30 days)
PROBATION → SUSPENDED (issue not resolved)
SUSPENDED → ACTIVE (appeal approved)
ANY → OFFBOARDED (voluntary exit or forced removal)
OFFBOARDED → (terminal, no return)
```

---

## 7. API Surface

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/applications | Public | Submit node application |
| GET | /api/applications | Admin | List all applications |
| PATCH | /api/applications/:id | Admin | Review/approve/reject |
| GET | /api/nodes | Member+ | List nodes (scoped by role) |
| GET | /api/nodes/:id | Member+ | Node detail |
| PATCH | /api/nodes/:id | Node Admin / Admin | Update node profile |
| POST | /api/nodes/:id/members | Node Admin | Invite member |
| DELETE | /api/nodes/:id/members/:uid | Node Admin | Remove member |
| PATCH | /api/nodes/:id/status | Admin | Change node status |
| GET | /api/nodes/:id/activity | Member+ | Node activity log |

---

## 8. UI Requirements

### Application Review (`/dashboard/applications`)
- Application list with status filters (Pending / Reviewing / Approved / Rejected)
- Application detail view with all submitted fields
- Review actions: Approve, Reject, Request Info, Waitlist
- Review notes field (internal, not shown to applicant)

### Node Registry (`/dashboard/nodes`)
- Node list with columns: name, type, status, tier, region, reputation score, last activity
- Search by name, filter by type/status/tier/region
- Node detail page: profile tab, members tab, activity tab, deals tab

### Node Profile Edit (`/dashboard/nodes/:id`)
- Basic info: name, description, website, logo
- Capabilities section (dynamic form based on node type)
- Region selection (multi-select)
- Member management (invite link, role assignment)

---

## 9. Success Metrics

| Metric | Target |
|--------|--------|
| Application-to-approval rate | > 30% |
| Average review time | < 48 hours |
| Node activation rate (approved → active) | > 85% |
| Active node retention (12-month) | > 70% |
| Nodes with complete profile | > 90% |

---

## 10. Open Questions

1. Should node tiers be paid (seat fees per Ch09) or earned by contribution?
2. How many users per node? Fixed limit or tier-based?
3. Should we support "anonymous nodes" for sensitive participants (e.g., government-backed funds)?
4. Node transfer: can a node be sold or transferred to new ownership?
