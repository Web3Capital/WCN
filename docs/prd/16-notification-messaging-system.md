# PRD-16: Notification & Messaging System

> Status: Draft | Priority: P1 — Important | Owner: Product Lead
> Dependencies: PRD-01 (Identity), all business systems
> Affects: User engagement across all systems

---

## 1. Overview

The Notification & Messaging System ensures every node receives the right information at the right time through the right channel. It manages in-app notifications, email digests, and future integrations with Telegram/Slack. It also supports structured messages between nodes within Deal Rooms and task threads.

**Core Principle**: Notifications must be actionable — every notification links to a specific action the user should take. No "FYI" noise. Frequency and channel are user-configurable to prevent fatigue.

---

## 2. Notification Categories

| Category | Trigger | Priority | Default Channel |
|----------|---------|----------|-----------------|
| **Security** | Login from new device, 2FA challenge, account locked | CRITICAL | In-app + Email (immediate) |
| **Deal** | New match, deal stage change, new participant, deal stalled | HIGH | In-app + Email |
| **Task** | Task assigned, approaching deadline, overdue, review needed | HIGH | In-app + Email |
| **Settlement** | New settlement calculated, settlement distributed, dispute | HIGH | In-app + Email |
| **Application** | Application received, status change, approval | MEDIUM | Email |
| **PoB** | New PoB event, attribution confirmed, flagged | MEDIUM | In-app |
| **Reputation** | Score change, new badge, tier change | LOW | In-app |
| **System** | Maintenance, feature update, policy change | LOW | In-app |

---

## 3. Core User Stories

### Notifications
- US-16.1: As a user, I receive in-app notifications for all relevant events in a notification center.
- US-16.2: As a user, I receive email notifications for high-priority events.
- US-16.3: As a user, I can configure notification preferences (enable/disable per category, choose channel).
- US-16.4: As a user, I can mark notifications as read/unread and clear them.
- US-16.5: As a system, I send daily/weekly digest emails instead of individual emails (user-configurable).

### In-App Messaging
- US-16.6: As a Deal participant, I can send messages within a Deal Room thread.
- US-16.7: As a task assignee, I can add comments on a task.
- US-16.8: As a node member, I can send direct messages to other node members in shared Deal Rooms.

---

## 4. Data Model

```
Notification
├── id: string
├── userId: string (FK → User)
├── category: enum (SECURITY, DEAL, TASK, SETTLEMENT, APPLICATION, POB, REPUTATION, SYSTEM)
├── priority: enum (LOW, MEDIUM, HIGH, CRITICAL)
├── title: string
├── body: string
├── actionUrl: string? (deep link to relevant page)
├── actionLabel: string? ("View Deal", "Review Task")
├── isRead: boolean
├── readAt: datetime?
├── channels: string[] (["in_app", "email"])
├── emailSentAt: datetime?
├── metadata: json
├── createdAt: datetime

NotificationPreference
├── id: string
├── userId: string (FK → User)
├── category: enum
├── inAppEnabled: boolean
├── emailEnabled: boolean
├── emailFrequency: enum (IMMEDIATE, DAILY_DIGEST, WEEKLY_DIGEST, DISABLED)
└── updatedAt: datetime

Message
├── id: string
├── threadType: enum (DEAL_ROOM, TASK, DIRECT)
├── threadId: string (deal ID, task ID, or DM thread ID)
├── senderId: string (FK → User)
├── senderNodeId: string (FK → Node)
├── content: string
├── attachmentUrl: string?
├── isEdited: boolean
├── editedAt: datetime?
├── createdAt: datetime
└── deletedAt: datetime?
```

---

## 5. Feature Breakdown

### P0
- [ ] Notification creation and delivery pipeline
- [ ] In-app notification center (bell icon, badge count)
- [ ] Notification list with read/unread, filters by category
- [ ] Email notification delivery (transactional emails)
- [ ] Notification preference management

### P1
- [ ] Daily/weekly email digest
- [ ] Deal Room messaging (threaded messages within deals)
- [ ] Task commenting
- [ ] Notification grouping (batch similar notifications)
- [ ] Push notifications (mobile, if mobile app exists)

### P2
- [ ] Telegram bot integration
- [ ] Slack integration
- [ ] Direct messaging between nodes
- [ ] Rich notifications (with action buttons in email)
- [ ] Notification analytics (open rate, click-through rate)

---

## 6. Email Templates

| Template | Trigger | Content |
|----------|---------|---------|
| Welcome | Account created | Welcome message, profile setup link |
| Application Status | Application approved/rejected | Status + next steps |
| New Match | Capital-project match | Match summary + "View Match" CTA |
| Deal Stage Change | Deal status updated | New stage + what's needed next |
| Task Assigned | Task created for user | Task details + deadline + "View Task" CTA |
| Overdue Alert | Task past deadline | Task details + escalation warning |
| Settlement Ready | Settlement calculated | Amount + "View Settlement" CTA |
| Security Alert | New login, locked account | Details + security action CTA |
| Weekly Digest | Weekly schedule | Summary of week's activity + upcoming deadlines |

---

## 7. Success Metrics

| Metric | Target |
|--------|--------|
| Notification delivery latency (in-app) | < 1 second |
| Email delivery success rate | > 99% |
| Notification read rate | > 60% |
| Email open rate | > 30% |
| Unsubscribe rate | < 2% |
| User satisfaction with notification volume | > 70% "just right" |
