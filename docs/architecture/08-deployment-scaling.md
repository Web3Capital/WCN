# 08 — Deployment & Scaling

> Infrastructure topology, CI/CD pipeline, scaling strategy, and operational monitoring.

---

## Deployment Philosophy

**Phase 1 (Current)**: Managed everything. Minimize ops burden for a small team.
**Phase 2 (Growth)**: Selective self-hosting for cost optimization and control.
**Phase 3 (Scale)**: Hybrid — managed for standard services, self-hosted for differentiation.

---

## Infrastructure Topology

### Current (Phase 1)

```
┌────────────────────────────────────────────────────────────┐
│                     Vercel Platform                         │
│                                                            │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐   │
│  │  Edge    │  │  Serverless  │  │  Static Assets    │   │
│  │  Network │→│  Functions   │→│  (Next.js build)  │   │
│  │  (CDN)   │  │  (API routes)│  │  (RSC, pages)     │   │
│  └──────────┘  └──────┬───────┘  └───────────────────┘   │
│                        │                                    │
│  ┌─────────────────────▼───────────────────────────────┐  │
│  │              Vercel Postgres (Neon)                   │  │
│  │              Connection pooling built-in              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Vercel Blob (S3-compatible)              │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘

External Services:
  ├── NextAuth (OAuth providers: Google, Microsoft, Apple, GitHub)
  ├── LLM API (OpenAI / Anthropic — for Agent module)
  ├── Email (Resend / SendGrid — for notifications)
  └── Domain (wcn.network — Vercel DNS)
```

### Target (Phase 2 — When Outgrowing Vercel)

```
┌─────────────────────────────────────────────────────────────────┐
│                     Cloud Infrastructure                         │
│                                                                  │
│  ┌─────────────┐   ┌───────────────┐   ┌──────────────────┐   │
│  │  CDN/Edge   │   │  App Server   │   │  Worker Process  │   │
│  │  Cloudflare │→ │  Next.js on   │   │  Background jobs │   │
│  │             │   │  Docker/K8s   │   │  (events, agents)│   │
│  └─────────────┘   └───────┬───────┘   └────────┬─────────┘   │
│                             │                     │              │
│  ┌──────────────────────────▼─────────────────────▼──────────┐  │
│  │                    Service Mesh                            │  │
│  ├────────────────┬──────────────┬───────────────────────────┤  │
│  │  PostgreSQL 16 │  Redis 7     │  S3 / R2                 │  │
│  │  Primary +     │  Cache +     │  File storage +           │  │
│  │  Read replica  │  Event bus   │  Audit archives           │  │
│  └────────────────┴──────────────┴───────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Monitoring: Grafana + Prometheus + Sentry               │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## CI/CD Pipeline

### Current (Git Push to Vercel)

```
Developer pushes to main
  → Vercel detects push
  → prisma generate
  → next build
  → Deploy to production (atomic swap)
  → URL: https://wcn.network

Branch deploys:
  → Push to feature branch
  → Vercel creates preview deployment
  → URL: https://<branch>-wcn.vercel.app
```

### Target Pipeline

```
┌─────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Push   │→  │  Lint    │→  │  Test    │→  │  Build   │→  │  Deploy  │
│  to Git │    │  ESLint  │    │  Unit    │    │  Next.js │    │  Staging │
│         │    │  TypeCheck│    │  API     │    │  Prisma  │    │  → Prod  │
└─────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
                                    │
                              ┌─────▼─────┐
                              │  DB Migrate│
                              │  (if needed)│
                              └───────────┘

Gates:
  - Lint must pass (zero errors)
  - ESLint module boundary rules pass (lib/modules/.eslintrc.json — no cross-module internal imports)
  - dependency-cruiser pass (.dependency-cruiser.cjs — no circular deps, no uncontracted imports)
  - TypeScript must compile (strict mode)
  - Unit tests must pass (178+ tests, >80% coverage for service layer)
  - API integration tests must pass
  - Build must succeed
  - Prisma schema must be valid
  - No secrets in committed code
```

### Migration Strategy

```
1. Developer creates migration: npx prisma migrate dev --name <description>
2. Migration file committed to git
3. CI validates migration can apply to a clean DB
4. Staging deployment runs: npx prisma migrate deploy
5. Manual verification on staging
6. Production deployment runs: npx prisma migrate deploy
7. Rollback plan: reverse migration script prepared before deploy
```

---

## Scaling Strategy

### Dimension 1: Compute Scaling

| Component | Current | 100 nodes | 1,000 nodes | 10,000 nodes |
|-----------|---------|-----------|-------------|--------------|
| Web/API | Vercel serverless (auto) | Vercel serverless | Docker + auto-scaling | K8s cluster |
| Background workers | None (in-process) | In-process event bus | Redis-backed workers | Dedicated worker pool |
| Agent execution | None | Async API calls | Queue-based with concurrency limit | Dedicated Agent cluster |

### Dimension 2: Data Scaling

| Component | Current | 100 nodes | 1,000 nodes | 10,000 nodes |
|-----------|---------|-----------|-------------|--------------|
| PostgreSQL | Vercel Postgres (shared) | Dedicated instance | Primary + read replicas | Sharded by workspace |
| Redis | None | Single instance | Cluster mode | Redis Cluster |
| File Storage | Vercel Blob | S3 standard | S3 + CloudFront CDN | Multi-region S3 |
| Search | PostgreSQL FTS | PostgreSQL FTS | MeiliSearch | Elasticsearch cluster |

### Dimension 3: Feature-Based Scaling Priorities

```
Phase 1 (now → 100 nodes):
  Priority: Feature completeness over performance
  Bottleneck: Development speed, not infrastructure
  Action: Stay on Vercel, focus on building modules

Phase 2 (100 → 1,000 nodes):
  Priority: Query optimization, caching
  Bottleneck: Database query performance, API response times
  Action: Add Redis cache, optimize Prisma queries, add DB indexes

Phase 3 (1,000 → 10,000 nodes):
  Priority: Horizontal scaling, background processing
  Bottleneck: Concurrent users, Agent execution, event processing
  Action: Extract workers, add queue system, consider service extraction
```

---

## Module Extraction Roadmap

When the modular monolith needs to split, extract in this order (based on independence and load):

```
Priority 1 (independent, high-write):
  @wcn/audit      → Separate write-heavy service (append-only log)
  @wcn/notifications → Separate delivery service (email, push, webhook)

Priority 2 (independent, compute-heavy):
  @wcn/agents     → Separate Agent execution service (long-running LLM calls)
  @wcn/search     → Separate search service (MeiliSearch + indexing workers)

Priority 3 (business-critical, complex):
  @wcn/settlement → Separate financial service (strict correctness requirements)
  @wcn/pob        → Separate verification service (anti-gaming computation)

Keep in monolith (tightly coupled, low volume):
  @wcn/identity, @wcn/nodes, @wcn/governance (foundational, read-heavy)
  @wcn/projects, @wcn/capital, @wcn/deals, @wcn/tasks (core CRUD, moderate volume)
```

---

## Monitoring & Observability

### Three Pillars

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│    Metrics   │  │    Logs      │  │    Traces    │
│  Prometheus  │  │  Structured  │  │  X-Request-Id│
│  + Grafana   │  │  JSON logs   │  │  (correlation│
│  (RUNNING)   │  │              │  │   + future   │
│              │  │              │  │   OpenTelemetry)
└──────────────┘  └──────────────┘  └──────────────┘

Implemented:
  lib/core/metrics.ts      → In-process counters + histograms
  /api/metrics             → Prometheus-compatible text export (secret-protected)
  lib/core/request-id.ts   → X-Request-Id on every response (via middleware.ts)
  /api/health              → Expanded: outbox depth, memory, event bus stats, Node.js version
```

### Key Metrics (SLIs)

| Metric | Target (SLO) | Alert Threshold |
|--------|-------------|-----------------|
| API response time (P50) | < 200ms | > 500ms |
| API response time (P99) | < 2s | > 5s |
| API error rate | < 1% | > 5% |
| Database query time (P95) | < 100ms | > 500ms |
| Agent execution time (P95) | < 60s | > 120s |
| Event processing delay | < 1s | > 10s |
| Outbox pending depth | < 50 | > 200 |
| Authentication success rate | > 95% | < 90% |
| Uptime | 99.9% | Any downtime |

### Dashboards

| Dashboard | Audience | Key Panels |
|-----------|----------|------------|
| **System Health** | Engineering | API latency, error rate, DB connections, memory |
| **Business Metrics** | Product/Founding | Active nodes, deals, PoB rate, settlement |
| **Security** | Security | Failed logins, permission denials, risk alerts |
| **Agent Performance** | AI/Engineering | Execution times, adoption rates, LLM costs |

### Alerting

```
P0 (Page immediately): Service down, data corruption, security breach
P1 (Slack alert, respond in 1h): Error rate spike, latency degradation, failed settlements
P2 (Slack alert, respond in 4h): High memory usage, approaching rate limits, unusual patterns
P3 (Daily review): Performance regression, dependency updates, non-critical anomalies
```

---

## Disaster Recovery

| Scenario | RTO | RPO | Recovery Procedure |
|----------|-----|-----|-------------------|
| Vercel outage | 4 hours | 0 | Failover to backup deployment (Fly.io / Railway) |
| Database corruption | 1 hour | 0 (WAL) | Point-in-time recovery from continuous backup |
| Redis failure | 15 min | 6 hours | Cold restart, cache rebuilds automatically |
| S3 data loss | Immediate | 0 | S3 cross-region replication (11 9s durability) |
| Full infrastructure loss | 24 hours | 1 hour | Restore from latest backup to new provider |
| Compromised credentials | 1 hour | N/A | Rotate all secrets, revoke sessions, force re-auth |

---

## Cost Projection

| Component | 100 Nodes | 1,000 Nodes | 10,000 Nodes |
|-----------|-----------|-------------|--------------|
| Vercel (hosting) | $20/mo (Pro) | $150/mo (Enterprise) | Self-hosted |
| PostgreSQL | $25/mo | $100/mo | $500/mo (dedicated) |
| Redis | $0 (none) | $30/mo | $150/mo |
| S3 Storage | $5/mo | $30/mo | $200/mo |
| LLM API (Agents) | $50/mo | $500/mo | $3,000/mo |
| Email (Notifications) | $0 (free tier) | $20/mo | $100/mo |
| Monitoring | $0 (Vercel) | $50/mo | $200/mo |
| **Total** | **~$100/mo** | **~$880/mo** | **~$4,150/mo** |
