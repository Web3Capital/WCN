# WCN Q1 → Q2 Evaluation Report

- **Date**: 2026-05-09
- **Branch evaluated**: `main` @ `c99dfe8` (post Q1 close-out)
- **Companion**: [`docs/delivery/q2-systematic-fix-roadmap.md`](./q2-systematic-fix-roadmap.md)

## Executive summary (one paragraph)

WCN has crossed two major milestones (functional MVP + RBAC stabilization) and is structurally ready for the Q2 architectural pivot (event sourcing pilot per ADR-0004). The codebase is unusually disciplined for its stage — 18 PRDs, 11 architecture docs, 5 ADRs, weekly metrics snapshots — and engineering velocity in Q1 produced verifiable, ratcheted improvements. The single largest remaining risk is **input validation and rate-limit coverage** (Zod on 12% of API routes, rate-limit on 4 of 128) — a gap that ADR-0005 closes structurally.

## Health-at-a-glance

| Axis | Rating | One-liner |
|---|---|---|
| Product surface | 🟢 | 47 dashboard routes + 128 API routes covering the full node→task→PoB→settlement loop |
| Data model | 🟢 | 70 Prisma models / 60 enums / 154 indexes |
| Type safety | 🟢 | `tsc --noEmit` clean |
| Tests | 🟢 | 88 vitest files / 956 cases passing in 9.6s; 9 e2e specs |
| Lint | 🟡 | 1193 warnings (managed by ratchet); 30 "errors" — 28 from `.claude/worktrees/` noise + 2 real in `apply/ui.tsx` |
| Security/RBAC | 🟢 | Q1 migrated 35 `requireAdmin` → `requirePermission` + row scope; ESLint guards against regression |
| API hygiene | 🔴 | 113/128 routes lack Zod parse; 124/128 lack rate-limit — **biggest open gap** |
| i18n | 🟡 | 10 locales live; 9 non-EN missing 156 keys (≈18%) |
| Performance | 🟡 | 0 `unstable_cache`, 0 `use server`, 106 `force-dynamic`; cache work scheduled for Week 6 |
| Architecture evolution | 🟢 | ADR-0004 (PoB event sourcing) sequenced and ready to start |
| CI/Deploy | 🟢 | 3-stage CI (lint/typecheck/test → build → e2e) + Vercel deploy + cron + Sentry |

## Verified facts (measured in evaluation session)

```
tsc --noEmit:           0 errors
vitest run:             956 / 956 passing (9.6s)
eslint:                 30 errors / 1193 warnings  (28/30 errors from .claude/worktrees/)
i18n diff (en vs zh):   en=878 keys, zh=722; 156 missing in zh; 0 extra
git log: main HEAD =    c99dfe8 (Merge PR #33)
prisma models:          70   enums: 60
api route handlers:     128
unit test files:        22   e2e specs: 9
: any / as any:         239
JSON.parse(JSON.stringify): 29 files
force-dynamic:          106 files
unstable_cache:         0 files
"use server":           0 files
```

## Risk register (prioritized)

| P | Risk | Mitigation strategy | Owner |
|---|---|---|---|
| 🔴 P0 | Zod coverage 12% (15/128) | ADR-0005 builder + Week 2–4 migration | Tech Lead |
| 🔴 P0 | Rate-limit coverage 3% (4/128) | Same ADR-0005, single profile decision per route | Tech Lead |
| 🟠 P1 | i18n 9 non-EN locales missing 156 keys | Week 1 CI gate + Week 5 batch translation | TBD |
| 🟠 P1 | Prisma `baseline_sync_all` migration empty (cold-start broken) | Already documented in `docs/runbook/disaster-recovery-fresh-db.md`; regenerate after Q2 cache work | TBD |
| 🟠 P1 | `apply/ui.tsx` render-purity violation + unescaped entity | Week 1 surface-debt PR | now |
| 🟡 P2 | 239 `: any` / `as any` | metrics ratchet + Week 5 first sweep | Tech Lead |
| 🟡 P2 | 0 cache primitives, 106 `force-dynamic` | Week 6 + ADR-0004 Phase B | Tech Lead |
| 🟡 P2 | 29 `JSON.parse(JSON.stringify)` | Week 6 mechanical replacement | Tech Lead |
| 🟢 P3 | `.claude/worktrees/` 198 MB residue polluting lint | Week 1 surface-debt PR | now |
| 🟢 P3 | `WCN/` strategy PDFs untracked (200 MB) | Operator decision: LFS / external repo / Notion | Operator |

## Q1 wins worth preserving (system patterns)

1. **ADRs as first-class artifacts.** ADR-0001..0004 set scope, alternatives, done criteria, and rollback plans. **Continue.**
2. **Metrics weekly snapshots.** `scripts/baseline-metrics.sh` + `metrics/*.md` make progress measurable. **Extend** with ratchet enforcement.
3. **One concern per PR.** PR series in Q1 averaged < 600 LOC each. **Continue.**
4. **`docs/runbook/`** for disaster recovery — rare and valuable.
5. **ESLint as enforcement layer**, not just style. `no-restricted-imports` blocking `requireAdmin` is the canonical example. **Extend** with `no-restricted-syntax` for API handler shape.

## Decisions sought from operator

(Listed in priority for Week 1 scaffolding to proceed unblocked.)

| # | Decision | Default if no answer by Week 2 | Impact |
|---|---|---|---|
| 1 | Accept double-track (ADR-0004 PoB ES + ADR-0005 platform) for Q2 | yes | 1.5 engineers on platform, 1 on PoB |
| 2 | i18n scope: 9 langs vs core 4 (zh/ja/ko/en) | core 4 first | 1404 keys vs 624 keys to translate |
| 3 | `WCN/` strategy materials destination | external private repo | git history hygiene |
| 4 | Inngest install for ADR-0004 Phase A | recommend yes (Marketplace) | unblocks Q2 PoB work |
| 5 | OpenAPI generation for `/api/v1/*` (Week 3) | yes | 1-day extra, external API consumers benefit |

## What this report is NOT

- It is not the daily standup (those live in PR descriptions).
- It is not the architectural reference (that's `docs/architecture/`).
- It is not a sales narrative (that's `WCN/` strategy materials).
- It is the **engineering health snapshot** that opens Q2 and closes the loop on Q1.
