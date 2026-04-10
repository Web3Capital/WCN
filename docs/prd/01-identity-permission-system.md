# PRD-01: Identity & Permission System

> Status: Draft | Priority: P0 — Foundation | Owner: CTO Office
> Dependencies: None (foundation layer)
> Affects: All 17 other systems

---

## 1. Overview

The Identity & Permission System is the foundational layer of the entire WCN platform. It manages who can access the system, what they can do, and how their identity is verified. Every subsequent system depends on this one.

**Core Principle**: WCN is a permissioned professional network, not an open platform. Identity must be verified, permissions must be granular, and every action must be traceable to a responsible entity.

---

## 2. Target Users

| User Type | Description |
|-----------|-------------|
| **Applicant** | Someone who has submitted a node application but hasn't been approved yet |
| **Member** | Approved node with basic access to the platform |
| **Admin** | Platform administrator with full system access |
| **Observer** | Limited read-only access (e.g., LP of a capital node viewing portfolio) |
| **Agent** | AI Agent with programmatic access and restricted permissions |

---

## 3. Core User Stories

### Authentication
- US-1.1: As a user, I can sign up with email + password so I can create an account.
- US-1.2: As a user, I can sign in via Google / Microsoft / Apple / GitHub so I can log in with one click.
- US-1.3: As a user, I can enable 2FA (TOTP) so my account is protected against credential theft.
- US-1.4: As a user, I can reset my password via email so I can recover access.
- US-1.5: As a system, I lock accounts after 10 failed login attempts so brute-force attacks are prevented.

### Authorization
- US-1.6: As an admin, I can assign roles (Admin / Member / Observer) to users so access is controlled.
- US-1.7: As a member, I can only see data scoped to my node so cross-node data leakage is prevented.
- US-1.8: As an admin, I can create invite links with pre-assigned roles so onboarding is streamlined.
- US-1.9: As a system, I enforce permission checks on every API endpoint so unauthorized access is impossible.

### Node NFT Identity (Phase 2)
- US-1.10: As an approved node, I receive a Node NFT that serves as my on-chain identity credential.
- US-1.11: As a node, my NFT metadata reflects my node type, tier, and permission level.
- US-1.12: As a system, I can verify Node NFT ownership to gate access to specific features.

### Session & Security
- US-1.13: As a user, I can see my active sessions and revoke any of them.
- US-1.14: As a system, I log every authentication event (login, logout, failed attempt, 2FA challenge) for audit.
- US-1.15: As an admin, I can suspend/lock/offboard any user account with a documented reason.

---

## 4. Data Model

### Core Entities

```
User
├── id: string (cuid)
├── email: string (unique)
├── name: string?
├── image: string?
├── passwordHash: string?
├── role: enum (USER, MEMBER, ADMIN, OBSERVER)
├── accountStatus: enum (ACTIVE, INVITED, SUSPENDED, LOCKED, OFFBOARDED, PENDING_2FA)
├── twoFactorEnabled: boolean
├── twoFactorSecret: string?
├── failedLoginCount: int
├── lastLoginAt: datetime?
├── lastLoginIp: string?
├── lastLoginDevice: string?
├── ndaAcceptedAt: datetime?
├── lockedAt: datetime?
├── lockReason: string?
├── createdAt: datetime
├── updatedAt: datetime
├── accounts: Account[] (OAuth links)
├── sessions: Session[]
└── nodeId: string? (FK → Node)

Account (OAuth)
├── id: string
├── userId: string (FK → User)
├── type: string ("oauth")
├── provider: string ("google" | "github" | "apple" | "azure-ad")
├── providerAccountId: string
├── access_token: string?
├── refresh_token: string?
├── expires_at: int?
└── @@unique([provider, providerAccountId])

Session
├── id: string
├── userId: string (FK → User)
├── sessionToken: string (unique)
└── expires: datetime

AuditEvent
├── id: string
├── userId: string?
├── action: string ("login" | "logout" | "failed_login" | "2fa_challenge" | "role_change" | "account_lock")
├── metadata: json
├── ipAddress: string?
├── userAgent: string?
└── createdAt: datetime
```

### Permission Matrix

| Resource | Observer | Member | Admin |
|----------|----------|--------|-------|
| Own profile | Read | Read/Write | Read/Write |
| Own node data | Read | Read/Write | Read/Write |
| Other node data | — | Read (limited) | Read/Write |
| Projects | — | Read + Create own | Full CRUD |
| Deals | — | Read + Participate | Full CRUD |
| Tasks | — | Read + Own tasks | Full CRUD |
| PoB records | — | Read | Read/Write/Approve |
| Settlement | — | Read own | Full access |
| Agent config | — | Read | Full CRUD |
| User management | — | — | Full CRUD |
| System settings | — | — | Full access |

---

## 5. Feature Breakdown

### P0 — Must Have (Phase 1)
- [ ] Email + password signup/login
- [ ] OAuth login (Google, GitHub, Microsoft, Apple)
- [ ] JWT session management
- [ ] Role-based access control (Admin / Member / Observer)
- [ ] 2FA (TOTP) enrollment and verification
- [ ] Account status management (active / suspended / locked / offboarded)
- [ ] Brute-force protection (account lock after N attempts)
- [ ] Basic audit logging (login events)
- [ ] Invite link generation with pre-assigned roles
- [ ] Password reset flow

### P1 — Should Have (Phase 2)
- [ ] Node NFT minting upon approval
- [ ] NFT-gated feature access
- [ ] Session management UI (view/revoke active sessions)
- [ ] IP-based anomaly detection
- [ ] Multi-workspace support (user belongs to multiple nodes)
- [ ] Granular permission overrides per user

### P2 — Nice to Have (Phase 3)
- [ ] Hardware key support (WebAuthn / FIDO2)
- [ ] SSO for enterprise nodes
- [ ] On-chain identity verification
- [ ] Zero-knowledge proof of node membership
- [ ] Delegated access (node admin grants temporary access to external party)

---

## 6. Key Flows

### Login Flow
```
User opens /login
  → OAuth button clicked → NextAuth redirect → Provider consent → Callback → JWT issued → /dashboard
  → Email/password submitted → Credential check → 2FA check (if enabled) → JWT issued → /dashboard
  → Failed → Increment failedLoginCount → Lock if >= 10 → Show error
```

### Signup Flow
```
User opens /signup
  → OAuth → Auto-create User + Account → JWT → /dashboard
  → Email/password → POST /api/signup → Create User → Auto-login → /dashboard
```

### Role Assignment Flow
```
Admin opens /dashboard/users → Select user → Change role
  → Confirmation dialog → PATCH /api/users/:id → Update role → Audit log → Notification to user
```

---

## 7. API Surface

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/[...nextauth] | Public | NextAuth handler (login, OAuth callbacks) |
| POST | /api/signup | Public | Create account with email/password |
| GET | /api/auth/session | Authenticated | Get current session |
| PATCH | /api/users/:id | Admin | Update user role/status |
| GET | /api/users | Admin | List all users |
| POST | /api/admin/invites | Admin | Create invite link |
| POST | /api/account/2fa/enable | Authenticated | Enable 2FA |
| POST | /api/account/2fa/verify | Authenticated | Verify 2FA code |
| DELETE | /api/account/sessions/:id | Authenticated | Revoke a session |
| GET | /api/audit/auth | Admin | Auth audit log |

---

## 8. UI Requirements

### Login Page (`/login`)
- Centered card layout (max-width 440px)
- 4 OAuth provider buttons with brand icons (Google, Microsoft, Apple, GitHub)
- "or continue with email" divider
- Email + password form
- Error states: invalid credentials, account locked, OAuth conflict
- Link to signup

### Signup Page (`/signup`)
- Same layout as login
- OAuth buttons (auto-create account)
- Name (optional) + email + password form
- Link to login

### 2FA Setup (`/account/2fa`)
- QR code display for authenticator app
- Manual key display
- 6-digit verification code input
- Backup codes display

### User Management (`/dashboard/users`) — Admin only
- User list with search/filter
- Role badge (Admin / Member / Observer)
- Status badge (Active / Suspended / Locked)
- Actions: change role, suspend, lock, offboard
- Invite button → generate link

---

## 9. Success Metrics

| Metric | Target |
|--------|--------|
| Signup-to-login conversion | > 90% |
| OAuth adoption rate | > 50% of logins via OAuth |
| 2FA adoption rate | > 30% of active users within 90 days |
| Average login time | < 3 seconds |
| Failed login rate | < 5% of total attempts |
| Security incidents | 0 unauthorized access events |

---

## 10. Technical Constraints

- NextAuth v4 with JWT strategy (no database sessions for performance)
- PrismaAdapter for OAuth account linking
- bcrypt for password hashing (cost factor 12)
- TOTP must be RFC 6238 compliant (compatible with Google Authenticator, Authy, etc.)
- All auth events must be logged to AuditEvent table
- CORS and CSRF protection via NextAuth defaults
- Rate limiting on auth endpoints: 10 requests/minute per IP

---

## 11. Open Questions

1. Should Node NFT be ERC-721 or ERC-1155 (multiple tiers under one contract)?
2. Which chain for Node NFT (Base? BNB Chain? WCN's own L2 in Phase 3)?
3. Should enterprise nodes have SSO from day one, or is OAuth sufficient?
4. Password policy: minimum 8 characters only, or enforce complexity rules?
