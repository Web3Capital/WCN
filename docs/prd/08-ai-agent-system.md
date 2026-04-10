# PRD-08: AI Agent System

> Status: Draft | Priority: P0 — Core | Owner: CTO Office
> Dependencies: PRD-01, PRD-06 (Deal Room), PRD-07 (Task)
> Affects: PRD-09-11 (Proof/PoB/Settlement), PRD-14 (Data Cockpit)

---

## 1. Overview

The AI Agent System manages the deployment, lifecycle, permissions, and auditability of all AI Agents operating within WCN. Agents are NOT autonomous — they are controlled, auditable execution tools that work within human-directed workflows. They handle research, deal matching, meeting notes, follow-ups, and growth distribution under human supervision.

**Core Principle**: Agents amplify human capability, they don't replace human judgment. Every Agent output is a "suggestion" until a human approves it. Every Agent action is logged, auditable, and rollbackable. No Agent can initiate financial transactions or external communications without human approval.

**Industry Reference**: JPMorgan COIN (contract analysis), Goldman Sachs internal AI tools (DD assistance), Blackrock Aladdin (portfolio analysis) — all operate under human supervision. WCN follows the same paradigm.

---

## 2. Agent Types

| Agent | Purpose | Input | Output |
|-------|---------|-------|--------|
| **Research Agent** | Project analysis, market data, competitor analysis | Project materials, market data | Structured reports, risk flags, summaries |
| **Deal Agent** | Matching, screening, deal memo generation | Capital profiles, project data | Match scores, match memos, shortlists |
| **Execution Agent** | Meeting notes, action items, follow-ups, reminders | Meeting transcripts, deal events | Structured notes, task suggestions, reminders |
| **Growth Agent** | Content generation, distribution, attribution tracking | Project narrative, channel data | Content drafts, distribution plans, attribution data |

---

## 3. Core User Stories

### Agent Deployment
- US-8.1: As a platform admin, I can deploy and configure Agent instances with specific capabilities and permission levels.
- US-8.2: As a Deal Owner, I can assign Agents to a Deal Room for specific functions (research, execution, etc.).
- US-8.3: As a node admin, I can configure Agent preferences for my node (which Agent functions to enable/disable).

### Agent Execution
- US-8.4: As a Research Agent, I can analyze project materials and generate structured summaries, risk assessments, and competitor comparisons.
- US-8.5: As a Deal Agent, I can scan capital profiles and generate ranked match lists with match memos for new projects.
- US-8.6: As an Execution Agent, I can process meeting transcripts and extract action items, deadlines, and decisions.
- US-8.7: As a Growth Agent, I can draft content (project summaries, social posts) for human review before distribution.

### Agent Governance
- US-8.8: As a system, I enforce permission levels: READ (data access) → ANALYZE (generate insights) → SUGGEST (recommend actions) → ACT (execute with approval).
- US-8.9: As a system, I log every Agent action with: input, reasoning, output, timestamp, and approval status.
- US-8.10: As a human reviewer, I can approve, modify, or reject any Agent output before it takes effect.
- US-8.11: As an admin, I can pause or disable any Agent instantly if issues are detected.

### Agent Performance
- US-8.12: As a system, I track Agent performance: adoption rate (outputs accepted vs rejected), accuracy, speed, and cost.
- US-8.13: As a system, I only count Agent contributions toward PoB when the Agent output was adopted by a human and contributed to a closed deal.

---

## 4. Data Model

```
Agent
├── id: string
├── name: string ("Research Agent v2", "Deal Agent v1")
├── type: enum (RESEARCH, DEAL, EXECUTION, GROWTH)
├── version: string ("v1.0", "v2.1")
├── status: enum (ACTIVE, PAUSED, DEPRECATED)
├── model: string ("gpt-4o", "claude-sonnet", etc.)
├── capabilities: string[]
├── maxPermissionLevel: enum (READ, ANALYZE, SUGGEST, ACT)
├── config: json (model parameters, prompt templates, etc.)
├── createdAt: datetime
└── updatedAt: datetime

AgentAssignment
├── id: string
├── agentId: string (FK → Agent)
├── dealId: string? (FK → Deal)
├── nodeId: string? (FK → Node)
├── assignedBy: string (FK → User)
├── permissionLevel: enum (READ, ANALYZE, SUGGEST, ACT)
├── status: enum (ACTIVE, PAUSED, COMPLETED)
├── startedAt: datetime
└── endedAt: datetime?

AgentExecution
├── id: string
├── agentId: string (FK → Agent)
├── assignmentId: string (FK → AgentAssignment)
├── taskId: string? (FK → Task)
├── triggerType: enum (MANUAL, SCHEDULED, EVENT_DRIVEN)
├── input: json (what data was provided)
├── output: json (what the agent produced)
├── outputType: enum (REPORT, MATCH_LIST, MEETING_NOTES, CONTENT_DRAFT, TASK_SUGGESTIONS, ALERT)
├── status: enum (RUNNING, COMPLETED, FAILED, CANCELLED)
├── reviewStatus: enum (PENDING, APPROVED, MODIFIED, REJECTED)
├── reviewedBy: string? (FK → User)
├── reviewNotes: string?
├── adoptedInDeal: boolean (output was used in a deal)
├── executionTimeMs: int
├── tokenCount: int?
├── cost: decimal?
├── createdAt: datetime
└── completedAt: datetime?

AgentLog
├── id: string
├── agentId: string (FK → Agent)
├── executionId: string (FK → AgentExecution)
├── action: string ("read_project", "analyze_materials", "generate_summary", "send_reminder")
├── detail: json
├── createdAt: datetime
```

---

## 5. Feature Breakdown

### P0 — Must Have
- [ ] Agent registry (deploy, configure, manage instances)
- [ ] Agent assignment to Deal Rooms
- [ ] Research Agent: project summary generation
- [ ] Execution Agent: meeting notes extraction, action item tracking
- [ ] Agent output review workflow (approve/modify/reject)
- [ ] Complete audit logging of all Agent actions
- [ ] Permission level enforcement (READ/ANALYZE/SUGGEST/ACT)
- [ ] Agent pause/disable mechanism

### P1 — Should Have
- [ ] Deal Agent: project-capital matching with match memos
- [ ] Growth Agent: content draft generation
- [ ] Agent performance dashboard (adoption rate, accuracy, speed)
- [ ] Agent cost tracking per execution
- [ ] Scheduled Agent runs (daily research updates, weekly pipeline reports)
- [ ] Agent output feeds into PoB attribution

### P2 — Nice to Have
- [ ] Custom Agent creation (node builds own Agent with WCN SDK)
- [ ] Agent marketplace (nodes share/sell Agent configurations)
- [ ] Multi-model support (GPT-4, Claude, Gemini interchangeable)
- [ ] Agent A/B testing framework
- [ ] Agent chain-of-thought transparency (show reasoning to reviewers)

---

## 6. Permission Levels

| Level | Can Do | Cannot Do | Example |
|-------|--------|-----------|---------|
| READ | Access project data, read deal materials | Generate outputs | Background data access |
| ANALYZE | Generate reports, calculate match scores | Share results externally | Internal analysis |
| SUGGEST | Propose actions, draft content, recommend matches | Execute actions | Match recommendations |
| ACT | Send reminders, update task status, collect materials | Financial transactions, external comms, sign documents | Execution Agent follow-ups |

**ACT level requires**: explicit human pre-approval for each action category; all actions logged; instant revocation available.

---

## 7. Success Metrics

| Metric | Target |
|--------|--------|
| Agent output adoption rate | > 70% |
| Research Agent summary accuracy | > 85% (human evaluation) |
| Execution Agent action item extraction | > 90% recall |
| Average Agent execution time | < 60 seconds for standard tasks |
| Agent-related incidents | 0 unauthorized actions |
| Agent contribution to closed deals | > 30% of deals use Agent outputs |
