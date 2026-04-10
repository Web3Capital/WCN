# PRD-03: Governance System

> Status: Draft | Priority: P1 — Important | Owner: CTO Office
> Dependencies: PRD-01 (Identity), PRD-02 (Node Management)
> Affects: PRD-11 (Settlement), PRD-15 (Risk)

---

## 1. Overview

WCN's governance is deliberately NOT a "everyone votes on everything" DAO model. It follows progressive decentralization: centralized founding team decisions → transitional council governance → community-driven governance. The Governance System manages proposals, voting, council management, and compliance rule enforcement.

**Core Principle**: Some decisions must never be subject to open voting (security patches, legal compliance, emergency response). Governance is about structured delegation of authority, not democratic absolutism.

---

## 2. Target Users

| User Type | Description |
|-----------|-------------|
| **Founding Team** | Current phase — full decision authority |
| **Council Member** | Transitional phase — elected/appointed governance participants |
| **Node Voter** | Future phase — nodes with voting weight based on PoB |
| **Platform Admin** | Manages governance infrastructure |
| **Observer** | Can view proposals and voting records |

---

## 3. Core User Stories

### Proposals
- US-3.1: As a council member, I can create a governance proposal with title, description, options, and voting period.
- US-3.2: As a node, I can view all active and historical proposals.
- US-3.3: As a voter, I can cast my vote on active proposals within the voting window.
- US-3.4: As a system, I automatically close voting and execute the result when the period ends.

### Council Management
- US-3.5: As a founding team member, I can appoint initial council members.
- US-3.6: As a system, I enforce council term limits and rotation schedules.
- US-3.7: As a council member, I can recuse myself from proposals where I have a conflict of interest.

### Protected Decisions
- US-3.8: As a system, I prevent certain categories from being put to open vote: security patches, legal compliance, emergency fund access, user data handling.
- US-3.9: As a founding team member, I can invoke emergency override for critical security/legal situations with mandatory post-facto disclosure.

### Compliance
- US-3.10: As a platform admin, I can configure compliance rules by jurisdiction.
- US-3.11: As a system, I block actions that violate configured compliance rules (e.g., sanctioned entity participation).
- US-3.12: As an auditor, I can export complete governance records for regulatory review.

---

## 4. Data Model

```
Proposal
├── id: string
├── title: string
├── description: string (markdown)
├── category: enum (POLICY, PARAMETER, COUNCIL, BUDGET, TECHNICAL, OTHER)
├── status: enum (DRAFT, ACTIVE, PASSED, REJECTED, EXECUTED, CANCELLED)
├── proposedBy: string (FK → User)
├── votingStartsAt: datetime
├── votingEndsAt: datetime
├── quorum: float (minimum participation %)
├── threshold: float (minimum approval %)
├── options: json[] ({label, description})
├── result: json? ({option, voteCount, percentage})
├── executionNotes: string?
├── isProtected: boolean (if true, restricted voting pool)
├── createdAt: datetime
└── updatedAt: datetime

Vote
├── id: string
├── proposalId: string (FK → Proposal)
├── voterId: string (FK → User)
├── nodeId: string (FK → Node)
├── option: string
├── weight: float (based on PoB reputation)
├── createdAt: datetime
└── @@unique([proposalId, voterId])

CouncilMember
├── id: string
├── userId: string (FK → User)
├── nodeId: string (FK → Node)
├── role: enum (CHAIR, MEMBER, OBSERVER)
├── termStart: datetime
├── termEnd: datetime
├── status: enum (ACTIVE, RECUSED, TERMED_OUT, REMOVED)
├── appointedBy: string? (FK → User)
└── createdAt: datetime

ComplianceRule
├── id: string
├── jurisdiction: string ("US", "EU", "SG", "AE", "GLOBAL")
├── ruleType: enum (SANCTION, KYC, AML, DATA, TAX, OTHER)
├── description: string
├── enforcement: enum (BLOCK, WARN, LOG)
├── isActive: boolean
├── createdAt: datetime
└── updatedAt: datetime

GovernanceEvent
├── id: string
├── eventType: string ("proposal_created", "vote_cast", "proposal_executed", "emergency_override")
├── entityId: string
├── actorId: string (FK → User)
├── metadata: json
└── createdAt: datetime
```

---

## 5. Feature Breakdown

### P0 — Must Have
- [ ] Approval workflow for admin actions (node status changes, settlement approvals)
- [ ] Protected decision categories (cannot be put to open vote)
- [ ] Emergency override mechanism with mandatory disclosure
- [ ] Basic compliance rule engine (jurisdiction-based blocks)
- [ ] Governance audit log (all decisions with full trail)

### P1 — Should Have
- [ ] Proposal creation and voting interface
- [ ] Council member management (appointment, term tracking, recusal)
- [ ] Weighted voting (based on PoB reputation score)
- [ ] Quorum and threshold enforcement
- [ ] Proposal execution tracking

### P2 — Nice to Have
- [ ] On-chain proposal records
- [ ] Delegation (node delegates vote to another node)
- [ ] Quadratic voting option
- [ ] Multi-jurisdiction compliance dashboard
- [ ] Automated regulatory report generation

---

## 6. Governance Phases

### Phase 1: Centralized (Current)
- Founding team makes all decisions
- Admin approval workflows serve as governance mechanism
- All decisions logged for transparency

### Phase 2: Transitional Council
- 5-9 council members (mix of founding team + elected nodes)
- Major decisions require council majority
- Protected categories remain with founding team
- Quarterly governance reports published

### Phase 3: Progressive Decentralization
- Council expanded, more seats elected by nodes
- Voting weighted by PoB reputation
- Smart contract-enforced proposal execution
- Founding team retains veto only on protected categories

---

## 7. Protected Decision Categories

These items NEVER go to open vote:

| Category | Reason |
|----------|--------|
| Security patches & incident response | Speed and confidentiality required |
| Legal compliance changes | Regulatory obligations are non-negotiable |
| User data handling | Privacy laws override community preference |
| Emergency fund access | Must be available without voting delay |
| Sanctioned entity blocking | Legal requirement, not a choice |
| Core team compensation | Conflict of interest in public vote |

---

## 8. API Surface

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/proposals | Member+ | List proposals |
| POST | /api/proposals | Council+ | Create proposal |
| POST | /api/proposals/:id/vote | Voter | Cast vote |
| GET | /api/proposals/:id/results | Member+ | View results |
| POST | /api/proposals/:id/execute | Admin | Execute passed proposal |
| GET | /api/governance/council | Member+ | List council members |
| POST | /api/governance/council | Admin | Appoint council member |
| GET | /api/compliance/rules | Admin | List compliance rules |
| POST | /api/compliance/rules | Admin | Create/update rule |

---

## 9. Success Metrics

| Metric | Target |
|--------|--------|
| Governance participation rate | > 60% of eligible voters |
| Average proposal cycle time | < 14 days |
| Protected decision response time | < 4 hours |
| Compliance violation rate | 0 |
| Governance transparency score | 100% decisions documented |

---

## 10. Open Questions

1. Council compensation: token-based, reputation-based, or honorary?
2. Should there be a minimum PoB threshold to gain voting rights?
3. How to handle governance disputes between council members?
4. Multi-sig for treasury: how many signers, what threshold?
