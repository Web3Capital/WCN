# 05 — API Architecture

> RESTful API conventions, versioning strategy, gateway design, and developer experience.

---

## API Design Philosophy

WCN's API is the contract between the platform and its consumers (Web UI, future mobile, future SDK, future third-party integrations). It must be:

1. **Consistent** — Same patterns everywhere, predictable behavior
2. **Self-documenting** — Endpoint names, response shapes, and error codes tell the story
3. **Permission-aware** — Every endpoint enforces auth + scope
4. **Auditable** — Every mutation logs to audit trail
5. **Versionable** — Can evolve without breaking existing consumers

---

## URL Convention

```
/api/{module}/{resource}                    → Collection (GET list, POST create)
/api/{module}/{resource}/{id}               → Singleton (GET detail, PATCH update, DELETE)
/api/{module}/{resource}/{id}/{sub}         → Sub-resource collection
/api/{module}/{resource}/{id}/{sub}/{subId} → Sub-resource singleton

Examples:
GET    /api/deals                           → List deals (scoped by user permission)
POST   /api/deals                           → Create deal
GET    /api/deals/abc123                     → Get deal detail
PATCH  /api/deals/abc123                     → Update deal
GET    /api/deals/abc123/participants        → List deal participants
POST   /api/deals/abc123/participants        → Add participant
GET    /api/deals/abc123/milestones          → List milestones
PATCH  /api/deals/abc123/milestones/m456     → Update milestone

Action endpoints (non-CRUD):
POST   /api/settlement/cycles/{id}/lock      → Lock settlement cycle
POST   /api/settlement/cycles/{id}/generate  → Generate settlement entries
POST   /api/agents/{id}/run                  → Trigger agent execution
POST   /api/account/2fa/setup               → Start 2FA enrollment
```

---

## Request / Response Standards

### Request Headers
```
Authorization: Bearer <JWT>          (required for authenticated endpoints)
Content-Type: application/json       (required for POST/PATCH)
X-Request-Id: <uuid>                 (optional, for tracing)
X-WCN-Workspace: <workspace-id>     (future, for multi-workspace)
```

### Success Response
```json
{
  "data": { ... },                   // Single entity or array
  "meta": {                          // Pagination metadata (for lists)
    "total": 150,
    "page": 1,
    "pageSize": 20,
    "hasMore": true
  }
}
```

### Error Response
```json
{
  "error": {
    "code": "DEAL_INVALID_TRANSITION",
    "message": "Cannot transition deal from DRAFT to CLOSING. Valid transitions: ACTIVE, CANCELLED.",
    "details": {
      "currentStatus": "DRAFT",
      "requestedStatus": "CLOSING",
      "validTransitions": ["ACTIVE", "CANCELLED"]
    }
  }
}
```

### Error Codes Convention
```
HTTP 400 — Validation error (bad input)
HTTP 401 — Not authenticated (no/invalid token)
HTTP 403 — Not authorized (authenticated but insufficient permissions)
HTTP 404 — Entity not found (or not visible to this user)
HTTP 409 — Conflict (state machine violation, duplicate, concurrency)
HTTP 422 — Business rule violation (valid input but business logic rejects)
HTTP 429 — Rate limited
HTTP 500 — Internal server error
```

---

## API Route Handler Pattern

Every API route follows this pattern:

```typescript
// app/api/deals/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { hasPermission } from "@/lib/permissions";
import { validateCreateDeal } from "@/lib/modules/deals/validation";
import { createDeal } from "@/lib/modules/deals/service";
import { emitEvent } from "@/lib/core/event-bus";

export async function POST(req: NextRequest) {
  // 1. Auth
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });

  // 2. Permission
  if (!hasPermission(session.user, "deals", "create")) {
    return NextResponse.json({ error: { code: "FORBIDDEN" } }, { status: 403 });
  }

  // 3. Validate
  const body = await req.json();
  const validation = validateCreateDeal(body);
  if (!validation.success) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", details: validation.errors } }, { status: 400 });
  }

  // 4. Execute
  const deal = await createDeal(validation.data, session.user);

  // 5. Audit
  await audit({
    category: "DEAL",
    action: "deal.created",
    actorId: session.user.id,
    entityType: "Deal",
    entityId: deal.id,
    afterState: deal,
  });

  // 6. Emit events
  await emitEvent("deal.created", { dealId: deal.id, projectId: deal.projectId });

  // 7. Return
  return NextResponse.json({ data: deal }, { status: 201 });
}
```

---

## Pagination

All list endpoints support pagination:

```
GET /api/deals?page=1&pageSize=20&sort=createdAt&order=desc
GET /api/deals?cursor=abc123&limit=20         (cursor-based, for infinite scroll)
```

Default: `page=1, pageSize=20, sort=createdAt, order=desc`
Maximum: `pageSize=100`

---

## Filtering & Search

```
GET /api/projects?sector=DEFI&stage=SEED,MVP&status=MATCHING
GET /api/nodes?type=CAPITAL&region=APAC&status=ACTIVE
GET /api/deals?stage=ACTIVE,DUE_DILIGENCE&leadNodeId=xxx
GET /api/tasks?status=TODO,IN_PROGRESS&assigneeId=yyy

Full-text search:
GET /api/search?q=DeFi+lending&type=project,node
```

---

## Rate Limiting

| Endpoint Category | Rate Limit | Window |
|---|---|---|
| Public (login, signup, apply) | 10 requests | per minute per IP |
| Authenticated reads | 100 requests | per minute per user |
| Authenticated writes | 30 requests | per minute per user |
| Admin operations | 60 requests | per minute per user |
| Agent execution | 10 runs | per minute per agent |
| Search | 30 queries | per minute per user |

Implementation: Redis-backed sliding window counter.

---

## Versioning Strategy

**Phase 1 (current)**: No explicit versioning. All endpoints are v1 implicitly.

**Phase 2 (when breaking changes needed)**:
```
/api/v1/deals          → Original behavior
/api/v2/deals          → New behavior

Header alternative:
Accept: application/vnd.wcn.v2+json
```

**Migration policy**: Old version supported for 6 months after new version launches. Deprecation headers warn consumers.

---

## API Endpoint Registry (Complete)

### Authentication & Identity (M01)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/[...nextauth] | Mixed | NextAuth handler |
| POST | /api/signup | Public | Create account |
| GET/PATCH | /api/users | Admin | User management |
| GET/PATCH | /api/users/:id | Admin | User detail |
| PATCH | /api/account/password | Auth | Change password |
| GET/DELETE | /api/account/sessions | Auth | Session management |
| POST | /api/account/2fa/setup | Auth | 2FA enrollment |
| POST | /api/account/2fa/verify | Auth | 2FA verification |
| POST | /api/terms | Auth | Accept terms |

### Nodes (M02)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET/POST | /api/nodes | Auth | List/create nodes |
| GET/PATCH | /api/nodes/:id | Auth | Node detail/update |
| GET/POST | /api/nodes/:id/seats | Admin | Seat management |
| GET/POST | /api/nodes/:id/stake | Admin | Stake ledger |
| GET/POST | /api/nodes/:id/penalties | Admin | Penalties |
| GET/POST | /api/applications | Mixed | Submit/list applications |
| PATCH | /api/applications/:id | Admin | Review application |
| GET/POST | /api/invites | Admin | Invite management |
| POST | /api/invites/:token/activate | Public | Activate invite |
| GET/POST | /api/workspaces | Auth | Workspace management |

### Governance (M03)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET/POST | /api/approvals | Auth | Approval requests |
| PATCH | /api/approvals/:id | Admin | Approve/deny |
| GET/POST | /api/entity-freeze | Admin | Freeze entity |
| PATCH | /api/entity-freeze/:id | Admin | Unfreeze |
| GET/POST | /api/access-grants | Admin | Grant access |
| PATCH | /api/access-grants/:id | Admin | Revoke |

### Business Core (M04-M07)
| Method | Endpoint | Auth | Module |
|--------|----------|------|--------|
| GET/POST | /api/projects | Auth | M04 |
| GET/PATCH | /api/projects/:id | Auth | M04 |
| GET/POST | /api/files | Auth | M04 |
| GET/PATCH | /api/files/:id | Auth | M04 |
| POST | /api/files/:id/presign | Auth | M04 |
| POST | /api/files/:id/complete | Auth | M04 |
| GET | /api/files/:id/preview | Auth | M04 |
| GET/POST | /api/capital | Auth | M05 |
| GET/PATCH | /api/capital/:id | Auth | M05 |
| GET/POST | /api/deals | Auth | M06 |
| GET/PATCH | /api/deals/:id | Auth | M06 |
| GET/POST | /api/deals/:id/participants | Auth | M06 |
| GET/POST | /api/deals/:id/milestones | Auth | M06 |
| GET/POST | /api/deals/:id/notes | Auth | M06 |
| GET/POST | /api/tasks | Auth | M07 |
| GET/PATCH | /api/tasks/:id | Auth | M07 |

### Intelligence (M08)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET/POST | /api/agents | Auth | Agent management |
| GET/PATCH | /api/agents/:id | Auth | Agent detail |
| GET/POST | /api/agents/:id/permissions | Auth | Permissions |
| GET | /api/agents/:id/logs | Auth | Execution logs |
| GET/POST | /api/agents/runs | Auth | Run history |

### Verification & Settlement (M09-M11)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET/POST | /api/evidence | Auth | Evidence management |
| GET/PATCH | /api/evidence/:id | Auth | Evidence detail/review |
| GET/POST | /api/reviews | Auth | Review queue |
| GET/POST | /api/pob | Auth | PoB records |
| GET/PATCH | /api/pob/:id | Auth | PoB detail |
| GET/POST | /api/pob/attribution | Auth | Attribution data |
| GET/POST | /api/pob/confirmations | Auth | Confirmations |
| GET/POST | /api/disputes | Auth | Disputes |
| PATCH | /api/disputes/:id | Auth | Resolve dispute |
| GET | /api/settlement/preview | Admin | Preview calculation |
| GET/POST | /api/settlement/cycles | Admin | Cycle management |
| POST | /api/settlement/cycles/:id/generate | Admin | Generate entries |
| POST | /api/settlement/cycles/:id/lock | Admin | Lock cycle |
| POST | /api/settlement/cycles/:id/reopen | Admin | Reopen cycle |
| GET | /api/settlement/cycles/:id/export | Admin | Export data |

### Operations (M14-M18)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/data-cockpit | Auth | Dashboard metrics |
| GET/POST | /api/risk | Admin | Risk flags |
| PATCH | /api/risk/:id | Admin | Resolve risk |
| GET/PATCH | /api/notifications | Auth | Notifications |
| GET | /api/search | Auth | Full-text search |
| POST | /api/search-index | Admin | Rebuild index |
| GET | /api/audit | Admin | Audit log |
