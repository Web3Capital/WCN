# PRD-09: Proof Desk System

> Status: Draft | Priority: P0 — Core | Owner: Product Lead
> Dependencies: PRD-06 (Deal Room), PRD-07 (Task)
> Affects: PRD-10 (PoB), PRD-11 (Settlement)

---

## 1. Overview

The Proof Desk is where business results become verifiable evidence. When a Deal closes, the Deal Owner submits an Evidence Packet — a structured collection of documents, records, and data that prove the business outcome happened. The Proof Desk manages submission, completeness checking, and routing to the review queue.

**Core Principle**: Evidence before credit. No PoB without verified evidence. No settlement without PoB. The Proof Desk is the gateway that separates "claimed results" from "proven results."

**TradFi Reference**: Audit firm evidence collection (PCAOB standards) + trade settlement matching (DTCC) — but embedded in real-time workflow rather than quarterly/annual cycles.

---

## 2. Core User Stories

- US-9.1: As a Deal Owner, I can create an Evidence Packet for a completed deal, selecting relevant documents, events, and records.
- US-9.2: As a system, I auto-populate the Evidence Packet with marked evidence from Deal Room events (US-6.11).
- US-9.3: As a Deal Owner, I can add additional evidence: signed agreements, bank confirmations, chain tx hashes, delivery receipts.
- US-9.4: As a system, I validate packet completeness based on deal type (fundraise requires agreement + payment proof; service requires SOW + delivery confirmation).
- US-9.5: As a Deal Owner, I can submit the packet for review once completeness checks pass.
- US-9.6: As a reviewer, I can see the review queue and pick packets to review.
- US-9.7: As a reviewer, I can approve, request more evidence, or reject a packet with reasons.
- US-9.8: As a system, I enforce reviewer-participant separation (reviewer cannot be a Deal participant).

---

## 3. Data Model

```
EvidencePacket
├── id: string
├── dealId: string (FK → Deal)
├── submittedBy: string (FK → User)
├── submittedNodeId: string (FK → Node)
├── status: enum (DRAFT, SUBMITTED, IN_REVIEW, APPROVED, NEEDS_MORE_EVIDENCE, REJECTED)
├── dealType: enum (FUNDRAISE, SERVICE, PARTNERSHIP, LISTING, OTHER)
├── totalAmount: decimal? (deal value for fundraise)
├── evidence: EvidenceItem[]
├── completenessScore: float (0-100, auto-calculated)
├── reviewerId: string? (FK → User)
├── reviewerNodeId: string? (FK → Node)
├── reviewStartedAt: datetime?
├── reviewCompletedAt: datetime?
├── reviewNotes: string?
├── rejectionCount: int
├── pobEventId: string? (FK → PoBEvent, created after approval)
├── createdAt: datetime
└── updatedAt: datetime

EvidenceItem
├── id: string
├── packetId: string (FK → EvidencePacket)
├── type: enum (AGREEMENT, PAYMENT_PROOF, CHAIN_TX, DELIVERY_RECEIPT, MEETING_NOTES, LEGAL_OPINION, AUDIT_REPORT, COMMUNICATION_LOG, AGENT_OUTPUT, OTHER)
├── title: string
├── description: string?
├── fileUrl: string?
├── chainTxHash: string?
├── chainNetwork: string?
├── sourceType: enum (UPLOADED, DEAL_ROOM_EVENT, TASK_OUTPUT, AGENT_GENERATED)
├── sourceId: string? (FK to original event/task/execution)
├── verificationStatus: enum (PENDING, VERIFIED, DISPUTED)
├── uploadedBy: string (FK → User)
└── createdAt: datetime

ReviewerAssignment
├── id: string
├── packetId: string (FK → EvidencePacket)
├── reviewerId: string (FK → User)
├── reviewerNodeId: string (FK → Node)
├── assignedAt: datetime
├── conflictCheck: boolean (passed)
└── status: enum (ASSIGNED, REVIEWING, COMPLETED, RECUSED)
```

---

## 4. Completeness Rules by Deal Type

| Deal Type | Required Evidence |
|-----------|-------------------|
| **Fundraise** | Signed agreement (SAFE/SAFT/etc.) + Payment proof (bank wire or chain tx) + Term sheet |
| **Service** | SOW or engagement letter + Delivery confirmation + Invoice/receipt |
| **Partnership** | MOU or partnership agreement + Joint deliverable |
| **Listing** | Exchange confirmation + Trading data |

---

## 5. Feature Breakdown

### P0
- [ ] Evidence Packet creation (manual + auto-populated from Deal Room)
- [ ] Evidence item upload with type classification
- [ ] Completeness validation by deal type
- [ ] Submission workflow (draft → submit)
- [ ] Review queue (list of packets pending review)
- [ ] Reviewer assignment with conflict-of-interest check
- [ ] Review actions: approve / request more / reject
- [ ] Packet detail page with evidence list and review history

### P1
- [ ] Chain transaction auto-verification (verify tx hash on-chain)
- [ ] Multi-reviewer support (require 2+ approvals for high-value deals)
- [ ] Evidence expiration (certain evidence types have validity windows)
- [ ] Review time SLA tracking

### P2
- [ ] AI-assisted evidence validation (detect anomalies in documents)
- [ ] Cross-deal evidence linking (same evidence supports multiple PoB)
- [ ] Evidence integrity verification (hash-based tamper detection)

---

## 6. Success Metrics

| Metric | Target |
|--------|--------|
| Packet completeness on first submission | > 75% |
| Average review time | < 72 hours |
| Approval rate on first submission | > 60% |
| Reviewer conflict rate (recusals) | < 5% |
| Evidence items per packet | > 4 for fundraise, > 3 for service |
