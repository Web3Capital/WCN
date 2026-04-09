# Page List（页面清单）

> [Implementation Spec — 概览](./overview.md) · Table 1

---

## Table 1: Page List (页面清单)

### Auth & Account

| # | Page | Route | Status | Sprint | Notes |
|---|------|-------|--------|--------|-------|
| 1 | Login | `/login` | 🔧 | S0 | Add magic link, 2FA prompt, device fingerprint |
| 2 | Signup (removed) | `/signup` | 🔧 | S0 | Replace with Invite activation flow only |
| 3 | Invite Activation | `/invite/[token]` | 🆕 | S0 | Set password → 2FA → NDA → first login |
| 4 | 2FA Setup | `/account/2fa` | 🆕 | S0 | TOTP setup (mandatory for high-priv roles) |
| 5 | Account Settings | `/account` | 🆕 | S0 | Password, 2FA, devices, sessions |
| 6 | Workspace / Role Selector | `/workspace` | 🆕 | S0 | Post-login workspace + role picker |

### Dashboard — Left Nav

| # | Page | Route | Status | Sprint | Roles |
|---|------|-------|--------|--------|-------|
| 7 | My Workspace | `/dashboard` | 🔧 | S1 | All — role-specific widgets |
| 8 | Nodes — List | `/dashboard/nodes` | 🔧 | S1 | Admin, Node Owner |
| 9 | Nodes — Detail | `/dashboard/nodes/[id]` | 🔧 | S1 | Admin, Node Owner |
| 10 | Nodes — Application Review | `/dashboard/nodes/[id]/review` | 🆕 | S1 | Admin, Reviewer |
| 11 | Nodes — Contract / Billing | `/dashboard/nodes/[id]/billing` | 🆕 | S1 | Admin, Finance |
| 12 | Nodes — Onboarding Tracker | `/dashboard/nodes/[id]/onboarding` | 🆕 | S1 | Admin |
| 13 | Projects — List | `/dashboard/projects` | 🔧 | S1 | All scoped |
| 14 | Projects — Detail | `/dashboard/projects/[id]` | 🆕 | S1 | Scoped by role |
| 15 | Capital — List | `/dashboard/capital` | 🆕 | S1 | Admin, Capital Node |
| 16 | Capital — Detail | `/dashboard/capital/[id]` | 🆕 | S1 | Admin, Capital Node |
| 17 | Deal Room — List | `/dashboard/deals` | 🆕 | S2 | Scoped participants |
| 18 | Deal Room — Detail | `/dashboard/deals/[id]` | 🆕 | S2 | Participants only |
| 19 | Tasks — List | `/dashboard/tasks` | 🔧 | S2 | All scoped |
| 20 | Tasks — Detail | `/dashboard/tasks/[id]` | 🆕 | S2 | Assignee, owner |
| 21 | Proof Desk — Queue | `/dashboard/proof` | 🆕 | S3 | Admin, Reviewer |
| 22 | Proof Desk — Review | `/dashboard/proof/[id]` | 🆕 | S3 | Reviewer |
| 23 | PoB — List | `/dashboard/pob` | 🔧 | S3 | All scoped |
| 24 | PoB — Detail | `/dashboard/pob/[id]` | 🆕 | S3 | Scoped |
| 25 | Settlement — Cockpit | `/dashboard/settlement` | 🔧 | S4 | Finance Admin, scoped preview |
| 26 | Settlement — Cycle Detail | `/dashboard/settlement/[id]` | 🆕 | S4 | Finance Admin |
| 27 | Data Cockpit | `/dashboard/data` | 🆕 | S4 | Admin, Node Owner (scoped) |
| 28 | Risk Console | `/dashboard/risk` | 🆕 | S4 | Admin, Reviewer, Risk Desk |
| 29 | Agent Registry — List | `/dashboard/agents` | 🔧 | S2 | Admin, Agent Owner |
| 30 | Agent Registry — Detail | `/dashboard/agents/[id]` | 🆕 | S2 | Admin, Agent Owner |
| 31 | Agent — Logs | `/dashboard/agents/[id]/logs` | 🆕 | S2 | Admin, Agent Owner |
| 32 | Applications | `/dashboard/applications` | ✅ | S1 | Admin, applicant |
| 33 | Users / Invites | `/dashboard/admin/users` | 🔧 | S0 | Admin |
| 34 | Invite Management | `/dashboard/admin/invites` | 🆕 | S0 | Admin |
| 35 | Audit Log | `/dashboard/audit` | ✅ | S0 | Admin |
| 36 | Notifications Center | `/dashboard/notifications` | 🆕 | S3 | All |
| 37 | Phase 3 Roadmap | `/dashboard/assets` | ✅ | — | All |

### Top Bar (global, not separate pages)

| Component | Status | Sprint | Notes |
|-----------|--------|--------|-------|
| Global Search (Cmd+K) | ✅ | S2 | Extend to search all entity IDs |
| Notification Bell | 🆕 | S3 | Badge count + dropdown |
| Settlement Countdown | 🆕 | S4 | Current cycle + days remaining |
| Workspace Switcher | 🆕 | S0 | Multi-workspace support |
| Role Indicator | ✅ | S0 | Already shows Admin/Member pill |
| Account Menu | 🔧 | S0 | Add settings, devices, sign out all |
