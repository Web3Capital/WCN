# 04 — Data Architecture

> How data is stored, owned, accessed, and flows between modules.

---

## Storage Strategy

### Tier 1: PostgreSQL — Source of Truth

All structured business data lives in PostgreSQL. One logical database, partitioned by module ownership.

```
PostgreSQL 16
├── 44 Prisma models (current)
├── ~55 models (target, after adding Distribution, Reputation, etc.)
├── Estimated scale: <10M rows total for first 2 years
├── Connection: @prisma/adapter-pg with connection pooling
└── Hosting: Vercel Postgres / Neon / Supabase (current: Vercel)
```

**Why single database (not per-module)?**
- Team size <10 — managing 18 databases is operational suicide
- Prisma schema is single-file — cross-module relations are trivial
- Transaction support across modules (e.g., deal close + PoB create) is trivial
- When we need to split: extract high-write modules first (audit, notifications)

### Tier 2: Redis — Cache + Real-time + Events

```
Redis 7
├── Session cache (reduce DB reads for auth checks)
├── Rate limiting (API abuse prevention)
├── Matching cache (pre-computed match scores, invalidate on profile change)
├── Event bus (Redis Streams for domain events)
├── Real-time pub/sub (deal room updates, notification push)
└── Ephemeral state (Agent run progress, search typeahead cache)
```

**Deployment**: Single Redis instance initially. Separate read replicas when needed.

### Tier 3: Object Storage — Files & Exports

```
S3-compatible (Vercel Blob / AWS S3 / Cloudflare R2)
├── Project materials (decks, docs, reports)
├── Deal room documents (term sheets, agreements)
├── Evidence items (signed contracts, payment proofs)
├── Settlement exports (CSV/PDF)
├── Agent outputs (generated reports)
└── Audit log archives (cold storage after 1 year)
```

**Access pattern**: Presigned URLs for upload/download. File metadata in PostgreSQL (`File` model), binary in S3.

### Tier 4: Search Index — Full-Text Discovery

```
Phase 1: PostgreSQL FTS (current — tsvector/tsquery)
Phase 2: MeiliSearch / Typesense (when FTS complexity warrants it)
├── Indexed entities: Node, Project, Deal, Task, Evidence, File
├── Permission-aware results (post-query filter by user access)
└── Real-time indexing (update on entity change events)
```

---

## Data Flow Patterns

### Pattern 1: Synchronous CRUD

Standard request-response for entity management.

```
Client → API Route → Permission Check → Service Function → Prisma → PostgreSQL
                                              ↓
                                         Emit Event → Audit Log
                                              ↓
                                         Return Response
```

**Used by**: All modules for basic CRUD operations.

### Pattern 2: Event-Driven Side Effects

Business events trigger cascading operations across modules.

```
Module A completes action
  → Emits domain event to Event Bus
  → Module B listener: creates record
  → Module C listener: sends notification
  → Module D listener: updates metrics
  → @wcn/audit listener: logs everything

Example: deal.closed
  → @wcn/proof-desk: create Evidence Packet (DRAFT)
  → @wcn/notifications: notify all participants
  → @wcn/cockpit: increment deal close metric
  → @wcn/projects: update project status to FUNDED
  → @wcn/capital: update capital deployment stats
  → @wcn/audit: log deal close with full details
```

### Pattern 3: Computed Aggregation (CQRS Read Side)

Complex read queries that span multiple modules.

```
Dashboard request
  → Cockpit Service
  → Aggregation query across multiple tables
  → Cache result in Redis (TTL: 5 minutes)
  → Return to client

Cached metrics:
  - Total active nodes by type
  - Deal pipeline by stage
  - PoB generation rate (30-day rolling)
  - Settlement summary
  - Agent utilization
```

### Pattern 4: Long-Running Process (Saga)

Multi-step operations that span modules and may fail at any step.

```
Settlement Saga:
  1. Create cycle (settlement module)    → success
  2. Aggregate PoB events (pob module)   → success
  3. Calculate entries (settlement)       → success
  4. Admin review (governance)            → approve/reject
  5. Execute distribution (settlement)    → success/partial failure
  6. Notify nodes (notifications)         → success
  7. Update cockpit metrics              → success

Failure handling:
  - Step 5 partial failure → mark failed entries, continue with successful ones
  - Retry failed entries in next cycle
  - All steps logged to audit
```

---

## Data Ownership Matrix

| Table | Owner Module | Who Reads | Who Writes | Notes |
|-------|-------------|-----------|------------|-------|
| User | M01 identity | All | M01 only | Auth is foundational |
| Account | M01 identity | M01 | M01 | OAuth provider links |
| Session | M01 identity | M01 | M01 | JWT validation |
| Node | M02 nodes | All | M02 only | Node info is read everywhere |
| Application | M02 nodes | M02, M01 | M02 | Admin review workflow |
| NodeSeat | M02 nodes | M02, M11 | M02 | Seat tier affects settlement |
| Project | M04 projects | M04, M05, M06 | M04 | Capital matching reads projects |
| File | M04 projects | M04, M06, M09 | M04 | Shared across deals/evidence |
| CapitalProfile | M05 capital | M05, M06 | M05 | Matching engine input |
| Deal | M06 deals | M06, M07, M09 | M06 | Tasks and evidence reference deals |
| DealParticipant | M06 deals | M06, M09 | M06 | Evidence reviewer assignment |
| Task | M07 tasks | M07, M09 | M07 | Task outputs become evidence |
| Agent | M08 agents | M08 | M08 | Agent configuration |
| AgentRun | M08 agents | M08, M14 | M08 | Cockpit reads for analytics |
| Evidence | M09 proof-desk | M09, M10 | M09 | PoB reads approved evidence |
| PoBRecord | M10 pob | M10, M11, M13 | M10 | Settlement and reputation read |
| Attribution | M10 pob | M10, M11 | M10 | Settlement calculates from this |
| SettlementCycle | M11 settlement | M11, M14 | M11 | Cockpit reads for reporting |
| RiskFlag | M15 risk | M15, M03 | M15 | Governance may freeze flagged entities |
| Notification | M16 notifications | M16 | M16 | User notifications |
| SearchDocument | M17 search | M17 | M17 | Populated from events |
| AuditLog | M18 audit | M18 | M18 + all | Append-only from all modules |

---

## Data Migration Strategy

### Schema Evolution Rules

1. **Additive changes** (new tables, new nullable columns): Deploy with zero downtime
2. **Column renames**: Use Prisma `@map` to decouple code names from DB names
3. **Breaking changes** (column removal, type change): Two-phase deploy:
   - Phase 1: Add new column, backfill data, deploy code that reads both
   - Phase 2: Remove old column after validation period
4. **Data backfills**: Always run as idempotent scripts, never inline in migration

### Backup & Recovery

| Data Tier | Backup Frequency | Retention | Recovery Target |
|-----------|-----------------|-----------|-----------------|
| PostgreSQL | Continuous (WAL) | 30 days | RPO: 0, RTO: <1 hour |
| Redis | Snapshot every 6 hours | 7 days | RPO: 6 hours, RTO: <15 min |
| S3 | Built-in durability | Indefinite | RPO: 0, RTO: immediate |
| Audit logs | Daily archive to cold storage | 7 years | RPO: 1 day, RTO: <24 hours |

---

## Data Classification

| Classification | Examples | Storage Rules |
|---------------|----------|---------------|
| **Public** | Node names, project descriptions (approved for public) | Can be cached, indexed, shown to all |
| **Internal** | Deal details, task assignments, match scores | Visible to participants only |
| **Confidential** | Financial terms, valuations, settlement amounts | Encrypted at rest, access-logged |
| **Secret** | Passwords, 2FA keys, API keys, OAuth tokens | Hashed/encrypted, never logged in plaintext |
| **Regulated** | Personal data (PII), audit logs | GDPR compliance, retention policies apply |
