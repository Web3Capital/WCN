# PRD-06: Deal Room System

> Status: Draft | Priority: P0 — Core | Owner: Product Lead
> Dependencies: PRD-04 (Project), PRD-05 (Capital), PRD-02 (Node)
> Affects: PRD-07 (Task), PRD-08 (Agent), PRD-09 (Proof Desk)

---

## 1. Overview

The Deal Room is WCN's central collaboration space where multi-party business transactions are managed from initiation to close. It replaces the fragmented workflow of Telegram groups, email chains, and Google Docs with a structured, auditable environment. Every Deal Room has a clear owner, defined participants, milestone tracking, and a direct path to evidence collection for PoB.

**Core Principle**: A Deal Room is not a chat room — it is a state machine with defined stages, clear ownership, auditable actions, and structured outputs. Every event in a Deal Room can become evidence for Proof of Business.

**TradFi Reference**: Virtual Data Room (Intralinks / Datasite) + Deal pipeline management (DealCloud) — but with multi-party coordination, Agent assistance, and native PoB integration.

---

## 2. Core User Stories

### Deal Creation
- US-6.1: As a Deal Owner (typically the introducing node), I can create a Deal Room linked to a project and invite relevant parties.
- US-6.2: As a system, I auto-create a Deal Room when a capital node expresses interest in a project (from PRD-05 matching).
- US-6.3: As a Deal Owner, I can define the deal structure: participants, milestones, material requirements, and timeline.

### Deal Execution
- US-6.4: As a participant, I can upload and share materials (decks, term sheets, legal opinions) within the Deal Room.
- US-6.5: As a Deal Owner, I can create and assign tasks to specific participants or Agents.
- US-6.6: As a participant, I can view the deal timeline showing all events, status changes, and upcoming milestones.
- US-6.7: As an Execution Agent, I auto-generate meeting notes, track action items, and send follow-up reminders.

### Deal Tracking
- US-6.8: As a Deal Owner, I can move the deal through stages: Draft → Active → Due Diligence → Negotiation → Closing → Closed.
- US-6.9: As a system, I detect stalled deals (no activity for X days) and alert the Deal Owner.
- US-6.10: As a Deal Owner, I can close a deal as Won (outcome achieved) or Lost (fell through) with a reason.

### Evidence Collection
- US-6.11: As a Deal Owner, I can mark specific events/documents as "evidence" for PoB submission.
- US-6.12: As a system, I maintain a complete audit trail of all Deal Room events for Proof Desk submission.

---

## 3. Data Model

```
Deal
├── id: string
├── title: string
├── projectId: string (FK → Project)
├── dealOwnerId: string (FK → User)
├── dealOwnerNodeId: string (FK → Node)
├── status: enum (DRAFT, ACTIVE, DUE_DILIGENCE, NEGOTIATION, CLOSING, CLOSED_WON, CLOSED_LOST, CANCELLED)
├── dealType: enum (FUNDRAISE, SERVICE, PARTNERSHIP, LISTING, OTHER)
├── targetAmount: decimal?
├── actualAmount: decimal?
├── currency: string? ("USD", "USDC", "ETH")
├── startedAt: datetime
├── closedAt: datetime?
├── closeReason: string?
├── estimatedCloseDate: datetime?
├── milestones: DealMilestone[]
├── participants: DealParticipant[]
├── events: DealEvent[]
├── tasks: Task[] (from PRD-07)
├── materials: DealMaterial[]
├── createdAt: datetime
└── updatedAt: datetime

DealParticipant
├── id: string
├── dealId: string (FK → Deal)
├── nodeId: string (FK → Node)
├── userId: string (FK → User)
├── role: enum (DEAL_OWNER, CAPITAL, SERVICE, ADVISOR, OBSERVER)
├── joinedAt: datetime
├── invitedBy: string (FK → User)
└── status: enum (ACTIVE, REMOVED, LEFT)

DealMilestone
├── id: string
├── dealId: string (FK → Deal)
├── title: string
├── description: string?
├── dueDate: datetime?
├── status: enum (PENDING, IN_PROGRESS, COMPLETED, SKIPPED)
├── completedAt: datetime?
├── completedBy: string? (FK → User)
└── order: int

DealEvent
├── id: string
├── dealId: string (FK → Deal)
├── type: enum (STATUS_CHANGE, MATERIAL_UPLOADED, PARTICIPANT_ADDED, MEETING, NOTE, TASK_CREATED, MILESTONE_COMPLETED, MESSAGE)
├── actorId: string (FK → User)
├── description: string
├── metadata: json
├── isEvidence: boolean (marked for PoB)
└── createdAt: datetime

DealMaterial
├── id: string
├── dealId: string (FK → Deal)
├── name: string
├── fileUrl: string
├── fileSize: int
├── type: enum (TERM_SHEET, AGREEMENT, LEGAL_OPINION, AUDIT_REPORT, DECK, FINANCIAL_MODEL, MEETING_NOTES, OTHER)
├── uploadedBy: string (FK → User)
├── isConfidential: boolean
├── accessLevel: enum (ALL_PARTICIPANTS, DEAL_OWNER_ONLY, SPECIFIC_ROLES)
└── createdAt: datetime
```

---

## 4. Feature Breakdown

### P0 — Must Have
- [ ] Deal Room creation (manual + auto from matching)
- [ ] Participant management (invite, remove, role assignment)
- [ ] Deal status state machine (Draft → Active → ... → Closed)
- [ ] Material upload with access control
- [ ] Milestone definition and tracking
- [ ] Deal event timeline (activity log)
- [ ] Deal list with filters (status, type, date, participant)
- [ ] Deal detail page with tabs (overview, timeline, materials, participants, tasks)
- [ ] Stale deal detection and alerts

### P1 — Should Have
- [ ] Task creation from within Deal Room (linked to PRD-07)
- [ ] Agent-generated meeting notes and action items
- [ ] Evidence marking for PoB submission
- [ ] Deal analytics (time-to-close, stage conversion rates)
- [ ] Deal templates for common deal types

### P2 — Nice to Have
- [ ] In-room messaging / comments
- [ ] Version control for materials (track edits to term sheets)
- [ ] Deal comparison (multiple offers for same project)
- [ ] External party access (limited, time-bound access for non-node participants)
- [ ] Deal cloning (create new deal from template of completed deal)

---

## 5. Deal Status State Machine

```
DRAFT → ACTIVE (Deal Owner activates after setup)
ACTIVE → DUE_DILIGENCE (formal DD begins)
DUE_DILIGENCE → NEGOTIATION (DD passed, terms discussion)
NEGOTIATION → CLOSING (terms agreed, executing docs)
CLOSING → CLOSED_WON (deal completed successfully)

Any stage → CLOSED_LOST (deal fell through)
Any stage → CANCELLED (deal owner cancels)
CLOSED_WON → triggers Proof Desk submission flow
```

---

## 6. Success Metrics

| Metric | Target |
|--------|--------|
| Average deal cycle time (active → closed) | < 30 days for service deals, < 60 days for funding |
| Deal close rate (active → won) | > 35% |
| Participant engagement (events per deal) | > 20 events per deal |
| Stale deal rate (no activity > 14 days) | < 15% |
| Material upload per deal | > 5 documents |
