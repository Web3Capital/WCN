# 07 — Security Architecture

> Zero-trust model, RBAC + ABAC, encryption, compliance, and threat model.

---

## Security Principles

1. **Zero Trust**: Every request is untrusted until authenticated and authorized. No implicit trust between layers.
2. **Least Privilege**: Every user, node, and agent gets the minimum permissions needed. Access is additive, not subtractive.
3. **Defense in Depth**: Multiple security layers — no single point of failure.
4. **Audit Everything**: Security-relevant events are immutably logged.
5. **Fail Closed**: On ambiguity, deny access. Better to block a legitimate request than allow an illegitimate one.

---

## Authentication Architecture

### Authentication Stack

```
┌──────────────────────────────────────────────────┐
│                    Request                        │
├──────────────────────────────────────────────────┤
│  Layer 1: middleware.ts                           │
│  ─ JWT validation (fast path)                     │
│  ─ Public path whitelist check                    │
│  ─ Rate limiting (fail-closed in production)      │
│  ─ CORS enforcement                              │
│  ─ X-Request-Id injection (correlation)           │
├──────────────────────────────────────────────────┤
│  Layer 2: API Route / Server Component            │
│  ─ getServerSession() (full session validation)   │
│  ─ Account status check (active? suspended?)      │
│  ─ 2FA requirement check                         │
│                                                  │
│  OR (preferred for new routes):                   │
│                                                  │
│  Layer 2: withAuth() HOF (lib/core/with-auth.ts) │
│  ─ Session validation (automatic)                 │
│  ─ Account status: LOCKED/SUSPENDED/OFFBOARDED    │
│    returns 401/403 immediately                    │
│  ─ Role enforcement (optional)                    │
│  ─ Permission check via can() (optional)          │
│  ─ User object injected into handler context      │
├──────────────────────────────────────────────────┤
│  Layer 3: Permission Middleware                   │
│  ─ Role check (13 roles — see glossary)           │
│  ─ Node scope check (does user belong to node?)   │
│  ─ Entity access check (AccessGrant records)      │
│  ─ Entity freeze check (is entity frozen?)        │
├──────────────────────────────────────────────────┤
│  Layer 4: Data Scoping                           │
│  ─ Query filtered by user's accessible nodes      │
│  ─ Sensitive fields redacted for non-owners       │
│  ─ Confidential entities hidden from non-grantees │
├──────────────────────────────────────────────────┤
│  Layer 5: Error Sanitization                      │
│  ─ lib/core/safe-error.ts                         │
│  ─ Production: generic messages, no stack traces   │
│  ─ Development: full error details preserved       │
└──────────────────────────────────────────────────┘
```

### Authentication Methods

| Method | Flow | Strength |
|--------|------|----------|
| **Email + Password** | Bcrypt hash (cost 12), account lock after 10 failures | Medium |
| **OAuth** (Google, Microsoft, Apple, GitHub) | Provider handles credential, we get token | High |
| **2FA (TOTP)** | RFC 6238, 30-second codes, backup codes | Very High |
| **Invite Token** | SHA-256 hashed token, single-use, expirable | Medium (one-time) |
| **Future: WebAuthn** | Hardware key / biometric | Maximum |

### Session Management

```
Strategy: JWT (stateless)
  Token contents: {
    id,              // User ID
    provider,        // Auth provider (credentials, google, github, etc.)
    role,            // Primary platform role (13 roles — see glossary)
    accountStatus,   // Account lifecycle status
    nodeIds,         // IDs of all nodes owned by this user
    activeWorkspaceId, // Currently active workspace context
    activeRole,      // Currently active role for permission checks
    refreshedAt      // Last DB refresh timestamp (5-minute sliding window)
  }
  Expiry: 24 hours (configurable)
  Refresh: DB lookup every 5 minutes to sync role/status/nodeIds changes
  Storage: httpOnly cookie (not localStorage — XSS protection)
  Revocation: tokenInvalidatedAt field checked on each DB refresh cycle
```

---

## Authorization Architecture

### Two-Layer Role Model + ABAC + Grants

```
Layer 1: Platform Role (User.role — 13 roles)
  Governance roles: FOUNDER, ADMIN, FINANCE_ADMIN
  Business roles:   NODE_OWNER, PROJECT_OWNER, CAPITAL_NODE, SERVICE_NODE
  Operations roles: REVIEWER, RISK_DESK, AGENT_OWNER
  Access roles:     USER, OBSERVER
  Internal:         SYSTEM

  See lib/permissions.ts for the complete 13-role × 22-resource permission matrix.

Layer 2: Workspace Role (RoleAssignment table)
  Users can hold different roles in different workspaces.
  The active role is tracked via User.activeRole and User.activeWorkspaceId.

Layer 3: ABAC (Attribute-Based)
  ─ Node ownership: Can only modify own node's resources
  ─ Deal participation: Can only access deals they're a participant in
  ─ Entity confidentiality: Confidential entities require explicit grant

Layer 4: Grant-Based (Explicit)
  ─ AccessGrant records: Temporary or permanent access to specific entities
  ─ Use case: External advisor needs access to one specific deal
```

### Permission Resolution

```typescript
function hasPermission(user: User, resource: string, action: string, entityId?: string): boolean {
  // 1. Check if entity is frozen
  if (entityId && isEntityFrozen(entityId)) return false;

  // 2. Admin has full access (except frozen entities)
  if (user.role === "ADMIN") return true;

  // 3. Check role-based permission matrix
  if (!ROLE_PERMISSIONS[user.role]?.[resource]?.includes(action)) return false;

  // 4. Check scope (node ownership / deal participation)
  if (entityId && !isEntityInUserScope(user, resource, entityId)) return false;

  // 5. Check explicit grants (overrides scope for specific entities)
  if (entityId && hasExplicitGrant(user, resource, entityId, action)) return true;

  return true; // Passed all checks
}
```

### Permission Matrix

The complete permission matrix is defined in code at `lib/permissions.ts`.
The `POLICIES` constant maps each of the **13 roles** to their allowed
(Resource, Action) pairs across **22 resources**. See `docs/glossary.md`
for role definitions.

**Key governance boundaries:**

| Role Category | Roles | Access Summary |
|---|---|---|
| **Governance** | FOUNDER, ADMIN, FINANCE_ADMIN | Full access. FINANCE_ADMIN scoped to settlement & financial ops. |
| **Business** | NODE_OWNER, PROJECT_OWNER, CAPITAL_NODE, SERVICE_NODE | CRUD on own node's projects, deals, tasks, evidence, agents. |
| **Operations** | REVIEWER, RISK_DESK, AGENT_OWNER | Read + review on evidence, PoB, disputes. AGENT_OWNER manages AI agents. |
| **Access** | USER, OBSERVER | USER: limited read + self-profile. OBSERVER: read-only on assigned entities. |
| **Internal** | SYSTEM | Machine-to-machine operations, background jobs, cron tasks. |

---

## Data Security

### Encryption

| Data Category | At Rest | In Transit | Key Management |
|---|---|---|---|
| Passwords | Bcrypt (cost 12) | HTTPS/TLS 1.3 | N/A (one-way hash) |
| 2FA secrets | AES-256 encrypted column | HTTPS/TLS 1.3 | Application-level key |
| OAuth tokens | AES-256 encrypted column | HTTPS/TLS 1.3 | Application-level key |
| Session tokens | Signed JWT (HS256/RS256) | HTTPS/TLS 1.3 | NEXTAUTH_SECRET |
| Database | Provider-managed encryption | TLS connection | Provider-managed |
| File uploads | S3 server-side encryption | HTTPS | Provider-managed (SSE-S3) |
| Audit logs | Database encryption | TLS | Provider-managed |

### Data Redaction

Non-admin users get redacted responses for sensitive data:

```typescript
function redactForMember(entity: any, userNodeIds: string[]): any {
  // Hide financial details of other nodes
  if (!userNodeIds.includes(entity.nodeId)) {
    delete entity.financialTerms;
    delete entity.valuationRange;
    delete entity.settlementAmount;
  }
  // Always hide internal admin fields
  delete entity.reviewNotes;
  delete entity.riskScore;
  return entity;
}
```

### Error Sanitization (Implemented in `lib/core/safe-error.ts`)

Production errors never expose internal details to clients:

```typescript
// safeErrorMessage(error) → string
// In production: returns generic message ("An internal error occurred")
// In development: returns the full error message for debugging

// sanitizeError(error) → { message, code }
// In production: strips stack traces, internal paths, SQL fragments
// In development: preserves all detail
```

All API routes should use `safeErrorMessage()` when constructing error responses. The `withAuth()` HOF uses this internally.

### API Key Security (Implemented in `app/api/apikeys/route.ts`)

API key creation enforces scope limits to prevent privilege escalation:

- **Wildcard block**: Non-admin users cannot create keys with `*` (wildcard) scope
- **Node ownership verification**: If a key specifies a `nodeId`, the system verifies the requesting user owns that node (via `ownerUserId`) or has ADMIN role
- **Validation**: Empty scopes, missing nodeId, and other edge cases return 400

### Rate Limiting — Fail-Closed (Implemented in `lib/rate-limit.ts`)

Rate limiting uses Upstash Redis with a sliding window counter. In production, if Redis is unavailable (connection error, timeout), the system **denies the request** (returns a rate-limited result) rather than allowing it through. This prevents a Redis outage from becoming a DDoS vulnerability.

In development, rate limiting is fail-open to avoid blocking local work.

---

## Threat Model

### Top Threats and Mitigations

| Threat | Risk Level | Mitigation |
|--------|-----------|------------|
| **Credential stuffing** | HIGH | Rate limiting (10/min), account lockout (10 failures), 2FA |
| **Session hijacking** | HIGH | httpOnly cookies, secure flag, SameSite=Lax, short expiry |
| **CSRF** | MEDIUM | SameSite cookies, NextAuth CSRF token |
| **XSS** | MEDIUM | React auto-escaping, CSP headers, no dangerouslySetInnerHTML |
| **SQL injection** | LOW | Prisma ORM parameterized queries (no raw SQL without sanitization) |
| **Unauthorized data access** | HIGH | 4-layer permission model, query-level scoping |
| **PoB fraud** | HIGH | Anti-gaming checks, reviewer rotation, circular deal detection |
| **Settlement manipulation** | CRITICAL | Dual-path calculation, admin approval, audit trail |
| **Agent misuse** | MEDIUM | Permission levels (READ→ACT), human approval gate, full audit |
| **Insider threat** | MEDIUM | Principle of least privilege, all admin actions audited |
| **Data exfiltration** | MEDIUM | File access logging, rate limiting on bulk reads |
| **DDoS** | MEDIUM | Vercel edge network, fail-closed rate limiting (production), request throttling |

### Security Headers (Implemented in `next.config.mjs`)

All routes receive these headers via the `async headers()` function in `next.config.mjs`:

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
X-DNS-Prefetch-Control: on
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
```

**Note**: `X-XSS-Protection` is intentionally omitted (deprecated in modern browsers; CSP is the replacement). A Content-Security-Policy header should be added as the application matures.

---

## Compliance Framework

| Regulation | Applicability | Requirements | Implementation |
|---|---|---|---|
| **GDPR** | EU users | Right to erasure, data portability, consent | PII pseudonymization in audit logs, export API |
| **MiCA** | EU crypto | Transaction records, conflict management | AuditLog, PoB records, dispute system |
| **SEC** | US operations | Record retention (6yr), accredited investor checks | 7-year audit retention, future KYC integration |
| **SOC 2** | SaaS platform | Access logging, change management, encryption | AuditLog, permission system, TLS everywhere |
| **CCPA** | California users | Disclosure, opt-out, deletion | Privacy center (future), data export API |

---

## Security Operations

### Incident Response Plan

```
1. DETECT   — Risk module alert, audit log anomaly, user report
2. ASSESS   — Severity classification (P0/P1/P2/P3)
3. CONTAIN  — Entity freeze, account suspension, API key revocation
4. ERADICATE — Fix vulnerability, rotate credentials
5. RECOVER  — Restore service, verify integrity
6. REVIEW   — Post-mortem, update threat model, improve detection
```

### Security Review Cadence

| Activity | Frequency |
|----------|-----------|
| Dependency audit (`npm audit`) | Weekly (automated) |
| Permission model review | Monthly |
| Penetration testing | Quarterly |
| Security architecture review | Bi-annual |
| Compliance audit | Annual |
