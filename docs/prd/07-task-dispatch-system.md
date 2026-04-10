# PRD-07: Task Dispatch System

> Status: Draft | Priority: P0 — Core | Owner: Product Lead
> Dependencies: PRD-06 (Deal Room), PRD-02 (Node), PRD-08 (Agent)
> Affects: PRD-09 (Proof Desk), PRD-10 (PoB)

---

## 1. Overview

The Task Dispatch System turns Deal Room intentions into trackable execution units. Every piece of work in WCN — from a legal review to an Agent research run — is captured as a Task with a clear owner, deadline, output requirement, and verification standard. Tasks are the system's primary mechanism for preventing the "discussed but not done" problem that plagues Web3 collaboration.

**Core Principle**: No task without an owner. No owner without a deadline. No deadline without an output requirement. Every completed task produces evidence for PoB.

---

## 2. Core User Stories

### Task Creation
- US-7.1: As a Deal Owner, I can create tasks within a Deal Room and assign them to specific participants or Agents.
- US-7.2: As a system, I auto-generate tasks from Agent-extracted action items (e.g., from meeting notes).
- US-7.3: As a task creator, I define: title, description, assignee, deadline, output requirement, and priority.

### Task Execution
- US-7.4: As a task assignee, I can view my task list with priorities and deadlines.
- US-7.5: As a task assignee, I can update task status: To Do → In Progress → In Review → Done.
- US-7.6: As a task assignee, I can attach outputs (files, links, notes) as task deliverables.
- US-7.7: As an Execution Agent, I can auto-complete certain tasks (send reminders, collect materials, generate reports).

### Task Tracking
- US-7.8: As a Deal Owner, I can see all tasks in a Deal Room with status, assignee, and deadline.
- US-7.9: As a system, I send notifications when tasks are overdue or approaching deadline.
- US-7.10: As a system, I escalate overdue tasks to the Deal Owner and flag them in the Deal timeline.

### Task Review
- US-7.11: As a task reviewer, I can approve or reject task outputs with feedback.
- US-7.12: As a system, I log completed tasks with outputs as potential PoB evidence.

---

## 3. Data Model

```
Task
├── id: string
├── dealId: string? (FK → Deal, null for standalone tasks)
├── title: string
├── description: string?
├── assigneeId: string? (FK → User)
├── assigneeNodeId: string? (FK → Node)
├── assigneeType: enum (HUMAN, AGENT)
├── agentId: string? (FK → Agent, if assigned to Agent)
├── createdBy: string (FK → User)
├── priority: enum (LOW, MEDIUM, HIGH, CRITICAL)
├── status: enum (TODO, IN_PROGRESS, IN_REVIEW, DONE, CANCELLED, BLOCKED)
├── dueDate: datetime?
├── startedAt: datetime?
├── completedAt: datetime?
├── outputRequirement: string? (what the deliverable should be)
├── outputs: TaskOutput[]
├── reviewStatus: enum (PENDING, APPROVED, REJECTED)?
├── reviewedBy: string? (FK → User)
├── reviewNotes: string?
├── parentTaskId: string? (FK → Task, for sub-tasks)
├── isEvidence: boolean (marked for PoB)
├── tags: string[]
├── createdAt: datetime
└── updatedAt: datetime

TaskOutput
├── id: string
├── taskId: string (FK → Task)
├── type: enum (FILE, LINK, NOTE, AGENT_OUTPUT)
├── content: string (text content or URL)
├── fileName: string?
├── fileUrl: string?
├── submittedBy: string (FK → User)
└── createdAt: datetime

TaskReminder
├── id: string
├── taskId: string (FK → Task)
├── type: enum (APPROACHING_DEADLINE, OVERDUE, BLOCKED_ESCALATION)
├── sentTo: string (FK → User)
├── sentAt: datetime
└── acknowledged: boolean
```

---

## 4. Feature Breakdown

### P0 — Must Have
- [ ] Task CRUD within Deal Room context
- [ ] Task assignment (human or Agent)
- [ ] Task status management (TODO → IN_PROGRESS → IN_REVIEW → DONE)
- [ ] Task deadline and priority
- [ ] Output attachment (files, links, notes)
- [ ] Task list view (My Tasks + Deal Tasks + All Tasks for admin)
- [ ] Overdue detection and notification
- [ ] Task detail page

### P1 — Should Have
- [ ] Task review/approval workflow
- [ ] Sub-task support
- [ ] Auto-task generation from meeting notes (Agent)
- [ ] Task templates for common workflows (DD checklist, legal review, etc.)
- [ ] Task analytics (completion rate, average time, overdue rate)
- [ ] Bulk task creation

### P2 — Nice to Have
- [ ] Kanban board view
- [ ] Task dependencies (Task B blocked until Task A completes)
- [ ] Recurring tasks
- [ ] Time tracking
- [ ] Task scoring for PoB weight calculation

---

## 5. Task Status Flow

```
TODO → IN_PROGRESS (assignee starts working)
IN_PROGRESS → IN_REVIEW (assignee submits output)
IN_REVIEW → DONE (reviewer approves)
IN_REVIEW → IN_PROGRESS (reviewer rejects, needs rework)
Any → CANCELLED (creator cancels)
Any → BLOCKED (dependency or issue)
BLOCKED → IN_PROGRESS (blocker resolved)
```

---

## 6. Success Metrics

| Metric | Target |
|--------|--------|
| Task completion rate | > 80% |
| On-time completion rate | > 70% |
| Average task cycle time | < 5 days for standard tasks |
| Overdue task rate | < 15% |
| Tasks with output attached | > 90% of completed tasks |
