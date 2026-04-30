# Week 1 Demo — Q1 Stabilization

**Period**: 2026-04-30 (single working day, but 5 functional "days" of progress)
**Branch**: `claude/recursing-raman-762674`
**PR**: [#2 (Draft)](https://github.com/Web3Capital/WCN/pull/2)
**Final commit**: `b1db445`

---

## TL;DR

15 commits. 5 P0 security holes closed. 4 dashboard list pages narrowed. 3 composite indexes added. 3 ADRs + 1 follow-up issue documented. RBAC migration tooling fully prepared for Week 2.

239 unit tests passing (43 new). 0 tsc errors. 0 production deploys yet — branch is review-ready, awaiting sign-off.

---

## What shipped (15 commits, 5 day-blocks)

### Day 1 — Stop the bleeding (7 commits)

| Commit | Type | Bug class closed |
|---|---|---|
| `4402e3b` | hygiene | gitignore .env*.local |
| `39295df` | architecture | ADR-0001 Strangler Fig evolution strategy |
| `d9528bd` | infra | DB Pool max 10 → 2 (Vercel Fluid Compute connection exhaustion) |
| `a8ee040` | **P0** | `/api/admin/account-status` hardening (rate limit + secret separation + info-leak removal) |
| `05750da` | **P0** | Sentry beforeSend PII sanitizer + 6 tests |
| `c558885` | **P0** | SIWE nonce store + replay protection + 4 tests |
| `4d9a5d0` | tooling | baseline metrics snapshot script |

### Day 2 — More P0 (2 commits)

| Commit | Type | Bug class closed |
|---|---|---|
| `595c100` | **P0** | Wallet + Phone providers respect 2FA gate (TwoFactorRequiredError refactor + 6 tests) |
| `26bc864` | **P0** | File upload MIME allowlist + size cap + scanStatus lockdown + 11 tests |

### Day 3 — Performance + Week 2 prep (4 commits)

| Commit | Type | Outcome |
|---|---|---|
| `a735a4b` | perf | `include` → `select` on 4 dashboard list pages (PoB / Tasks / Nodes / Projects) |
| `6789225` | perf | 3 composite indexes (Deal_stage_updatedAt / CapitalProfile_status_createdAt / Node_ownerUserId_createdAt) |
| `044f8de` | architecture | ADR-0002 — Week 2 RBAC migration plan with 35-handler classification |
| `83634f8` | metrics | Day 3 baseline snapshot |

### Day 4 — Unblock Week 2 (2 commits)

| Commit | Type | Outcome |
|---|---|---|
| `d21f8fd` | RBAC | Add `policy` resource to permissions matrix (unblocks /api/policies/* migration) |
| `b1db445` | RBAC | 6 row-level ownership helpers (`ownsNode/Project/Task/PoB/Evidence/Agent`) + 23 tests |

### Day 5 — Friday wrap (this commit)

| Item | Outcome |
|---|---|
| ESLint rule | `no-restricted-imports` declared (severity warn — escalates to error end of Week 2) |
| Follow-up issue | docs/architecture/issues/0001-eslint-flat-config.md (Next 14 / ESLint 9 mismatch — separate fix) |
| ADR-0003 | Week 2 daily PR plan with 35-handler schedule |
| This document | Week 1 demo summary |
| Friday metrics snapshot | metrics/2026-04-30-week-1-friday.md |

---

## P0 closeout

| # | P0 | Status | File |
|---|---|---|---|
| P0-1 | SIWE signature replay | ✅ Day 1 | `lib/modules/siwe/nonce.ts` |
| P0-2 | Wallet/Phone bypass 2FA | ✅ Day 2 | `lib/auth/two-factor.ts` |
| P0-3 | account-status PUBLIC + CRON_SECRET fallback | ✅ Day 1 | `middleware.ts`, `app/api/admin/account-status/route.ts` |
| P0-6 | DB connection pool exhaustion | ✅ Day 1 (band-aid) | `lib/prisma.ts` |
| P0-7 | File upload no MIME / size cap / client-set scanStatus | ✅ Day 2 | `lib/modules/storage/constraints.ts` + presign route + complete route |
| **P0-4** | **RBAC matrix vs reality drift (76→0 requireAdmin)** | ⏳ **Week 2 main thrust** | tooling ready Day 4 |
| **P0-5** | **Row-level IDOR on /api/ledger /audit /access-grants** | ⏳ Week 2 alongside P0-4 | helpers ready Day 4 |

---

## Metrics: Day 0 baseline → Day 5 Friday

| Dimension | Day 0 | Day 5 | Δ | Q1 target |
|---|---:|---:|---:|---|
| Unit test files | 19 | 22 | **+3** | growing |
| Unit tests passing | 196 | 239 | **+43** | growing |
| `requirePermission` (call sites) | 104 | 106 | +2 | ≥ 25 (already met) |
| `requireAdmin` (real call sites; not raw text) | 35 | 35 | 0 | < 5 (Week 2) |
| `requireAdmin` (raw grep — includes docstrings) | 76 | 77 | +1 | descriptive only |
| Prisma `select:` in dashboard pages | 158 | 171 | **+13** | select > include |
| Prisma `include:` in dashboard pages | 84 | 83 | -1 | descriptive |
| Indexes declared | 151 | 154 | **+3** | targeted growth |
| `: any` / `as any` occurrences | 214 | 214 | 0 | downward (Q2) |
| `JSON.parse(JSON.stringify())` files | 29 | 29 | 0 | 0 (Q2) |
| `"use server"` files | 0 | 0 | 0 | ≥ 5 (Q1+) |
| streaming AI files | 0 | 0 | 0 | > 0 (Q1) |
| e2e spec files | 1 | 1 | 0 | ≥ 7 (Q1) |
| `force-dynamic` files | 105 | 105 | 0 | downward (Q2) |
| `unstable_cache` files | 0 | 0 | 0 | ≥ 10 (Q2) |

Three dimensions moved this week: **tests +43**, **select +13**, **indexes +3**. The dimensions that will move in Week 2: `requireAdmin` (35→0), `requirePermission` (+30), `e2e specs` (1→7+).

---

## Operator action required (before merge)

1. **Verify `ADMIN_API_SECRET` is set** in Vercel for Production / Preview / Development. (Already done by Tech Lead; reverify with `vercel env ls`.)
2. **Stop using `CRON_SECRET` to call `/api/admin/account-status`** — only `ADMIN_API_SECRET` works now. Update any operator scripts.
3. **Confirm `UPSTASH_REDIS_REST_URL` is set in Production** — without it, SIWE login throws.
4. **Run the new index migration on production**: `npx prisma migrate deploy` (or via your CI pipeline). Index creation will block writes briefly on Deal / CapitalProfile / Node tables.
5. **Apprise the Vercel project**: review log volume after Sentry sanitizer ships — events should redact Authorization / Cookie headers and password / token bodies.

---

## Three operator decisions still pending (decided this week, recorded for posterity)

| # | Decision | Made? |
|---|---|---|
| (1) Push Day 1 commits to PR | ✅ done — PR #2 |
| (2) DB pooler choice (Neon / Accelerate / PgBouncer) | ⏳ "C — observe first"; revisit Q1 end with real connection metrics |
| (3) Set ADMIN_API_SECRET to Vercel | ✅ done across 3 envs |

---

## Risks I'm tracking

| Risk | Status | Mitigation |
|---|---|---|
| Single owner (me) on Week 2 RBAC migration | active | Cookbook + helpers prepared so a second engineer could pick up without context |
| Lint pipeline broken (Next 14 / ESLint 9) | tracked | issue 0001; planned for Week 2 Friday |
| `: any` count plateaued at 214 | not addressed | Q2 work behind `noUncheckedIndexedAccess` strict-mode upgrade |
| 0 streaming AI calls | not addressed | Will move when `lib/modules/agents/*` is migrated to `streamText` (Q2) |
| 0 `unstable_cache` use | not addressed | Q2 work tied to Server Actions migration |
| DB drift in dev (Node.category column missing) | observed but not blocking | Out of scope; ops can resync via `prisma migrate deploy` |

---

## What I refused to do (per ADR-0001)

- ❌ Pull `<EntityListConsole>` Q2 refactor into Week 1 (would conflate stabilization with refactor)
- ❌ Big-bang rewrite the 80-model schema
- ❌ Adopt Kafka / Temporal / microservices
- ❌ Migrate to Clerk / Descope / Auth0 (hooks repeatedly suggested this; deferred to Q2+)
- ❌ Upgrade Next 14 → 15 → 16 (Q4 work)
- ❌ Replace Prisma with Drizzle
- ❌ Auto-merge Day 1 commits without operator review

---

## Week 2 starts Monday

See [ADR-0003](./adr/0003-week2-kickoff.md). The plan is fully sequenced: 35 handlers across 4 working days, then a Friday cleanup. Same operating contract: I lead, you have veto.
