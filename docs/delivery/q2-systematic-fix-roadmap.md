# Q2 Systematic Fix — 6-Week Roadmap

- **Status**: Active (Week 1 in flight)
- **Date opened**: 2026-05-09
- **Owner**: Tech Lead
- **Companion ADRs**: [ADR-0004](../architecture/adr/0004-pob-event-sourcing-pilot.md) (PoB ES, parallel), [ADR-0005](../architecture/adr/0005-api-platform-layer.md) (API platform layer)

## Why this exists

Q1 close-out (`metrics/2026-04-30-q1-final.md`) shipped RBAC + perf + lint stabilization. The post-mortem identified **three classes** of remaining debt:

| Class | Examples | Strategy |
|---|---|---|
| **A. Surface debt** | `apply/ui.tsx` 2 lint errors, `.claude/` lint noise, `WCN/.~lock*`, Prisma baseline gap, i18n 156 keys | One PR each, total < 1 day |
| **B. Coverage debt** | Zod 12% (15/128), rate-limit 4 files, `: any` 239, `JSON.parse(JSON.stringify)` 29, `force-dynamic` 106 | **ADR-0005 platform layer + ratchet**; 4-week back-fill |
| **C. Structural debt** | Events not transactional, 0 read models, 0 `use server`, 0 `unstable_cache` | **ADR-0004**; 6–8 weeks; runs in parallel |

This document is the execution plan for **A + B**. C is owned by ADR-0004.

## Operating rules

- **One concern per PR.** PR title prefix = `[wN-cohort]`. Description links to this doc.
- **Each PR ≤ 800 LOC diff.** Bigger PRs split.
- **Every PR runs**: `tsc --noEmit`, `vitest run`, `eslint`, `metrics-gate`. Build runs in CI on merge.
- **Ratchet first, refactor second.** New code obeys the new contract; legacy code is migrated cohort-by-cohort, not en masse.
- **Reversibility.** Each cohort PR can be reverted without breaking prior cohorts. The builder coexists with legacy handlers throughout.

## Week 1 — Foundation (this week)

| PR | Branch | Status | LOC | Risk |
|---|---|---|---:|---|
| 1 | `claude/eval-and-roadmap` | merging | <1k | 0 (docs only) |
| 2 | `claude/surface-debt-cleanup` | merging | <100 | 0 |
| 3 | `claude/i18n-ratchet-gate` | merging | <300 | 0 |
| 4 | `claude/metrics-ratchet-gate` | merging | <400 | 0 |
| 5 | `claude/api-platform-layer` | merging | ~600 | low (additive) |

**Exit criteria for Week 1:**
- ADR-0005 + this roadmap visible in `main`.
- `apply/ui.tsx` 2 errors fixed; lint reports < 5 real errors.
- `scripts/check-i18n.ts` runs in CI; baseline ratchet committed.
- `scripts/metrics-gate.ts` runs in CI; baseline ratchet committed.
- `lib/core/api/route.ts` builder available; 1 example route migrated to prove pattern.
- ESLint `no-restricted-syntax` rule for `app/api/**` set to `warn`.

## Week 2 — Write-route migration (35 routes)

Cohort: every POST / PATCH / DELETE under `app/api/**` except `app/api/pob/**` (PoB owned by ADR-0004).

Daily slices (one PR per slice):
- Mon: `applications` + `approvals` + `disputes` (8 routes)
- Tue: `nodes/*` (8 routes — sub-resources)
- Wed: `projects` + `tasks` + `evidence` (7 routes)
- Thu: `agents` + `policies` + `risk` (7 routes)
- Fri: `settlement` + `capital` + `governance` + `users` (5 routes); ESLint rule → `error`

Each PR includes:
- Migration to `route.permission(...)`
- Zod schema (already exists in `lib/core/validation.ts` for most)
- E2E spec: 200 (authed + scope match), 401 (unauthed), 403 (wrong scope), 429 (over limit)
- `metrics/ratchet.json` updated to reflect new lower ceilings

**Exit criteria for Week 2:**
- `routesWithoutZod` and `routesWithoutRateLim` ratchets each lowered by ≥ 30.
- All write paths covered by e2e specs.
- ESLint rule for `app/api/**` at `error` severity.
- Metrics snapshot `metrics/2026-W2.md` committed.

## Week 3 — Read-route migration + `/api/v1/*` (45 routes)

- 38 GET routes under `app/api/**`.
- 7 routes under `app/api/v1/**` get **output schemas** (machine-readable contract for external consumers).
- One PR adds a `scripts/generate-openapi.ts` (optional, per Week 1 operator decision) that walks `route.*` calls and writes `docs/product-spec/openapi-v1.yaml`.

**Exit criteria:**
- `rawApiHandlers` ratchet at 0 except PoB grace cohort.
- `/api/v1/*` documented in `docs/product-spec/api.md`.

## Week 4 — Long-tail + ratchet escalation

- Remaining ~30 routes (auth callbacks, webhooks, internal jobs).
- ESLint `no-restricted-syntax` for `app/api/**` graduates from `warn` to `error`.
- `metrics-gate` graduates from `warn` to `error` for all six ratchets.
- PoB grace cohort review: if ADR-0004 Phase A complete, PoB routes also migrate.

**Exit criteria:**
- 0 raw API handlers in `app/api/**`.
- All 5 ratchets at `error` severity.
- New PRs cannot regress any tracked metric.

## Week 5 — i18n + `: any` first sweep

**i18n** — depends on operator decision (full 9-lang vs core 4-lang).

- `scripts/translate-missing.ts` (LLM batch translator, run by author).
- Per-language commit (`zh.json`, `ja.json`, …) reviewed by a native speaker if available.
- `i18nMissingKeysVsEn` ratchet driven to 0.

**`: any` first sweep** — bring 239 → 159 (≥ 80 fixes) by reviewing `lib/modules/{risk,search,settlement,agents}/*` and replacing with proper types. Ratchet stays at `warn`; promotes to `error` only when count < 50.

## Week 6 — Cache primitives + cleanup

- 5 dashboard list pages (`capital`, `deals`, `tasks`, `projects`, `pob`) move from `force-dynamic` → `unstable_cache + revalidateTag`.
- 29 `JSON.parse(JSON.stringify(...))` sites replaced with `superjson` or explicit DTO mappings (mostly mechanical).
- Mid-quarter sync with ADR-0004 (PoB ES Phase B) — if Phase B's read model lands, the cache primitives plug in directly.
- Q2 mid-quarter retrospective + `metrics/2026-W6.md` snapshot.

## Long-running invariants (post-Q2)

After Week 6, the following must hold continuously (CI-enforced):

| Invariant | Guard |
|---|---|
| New `app/api/**/route.ts` files use `route.*` builder | ESLint `no-restricted-syntax` |
| No new `: any` regressions | metrics-gate |
| No new `JSON.parse(JSON.stringify)` | metrics-gate |
| i18n parity with `en.json` | metrics-gate |
| `requireAdmin` cannot be reintroduced | ESLint `no-restricted-imports` (since Q1) |
| Every `/api/v1/*` route has `output` schema | metrics-gate (custom rule) |

## Risks & mitigation

| Risk | Mitigation |
|---|---|
| Migration eats more time than ADR-0004 PoB ES allows | Hard cap: 1.5 engineers on this track, 1 on ADR-0004; weekly check-in to rebalance |
| Builder design v1 has a flaw | Week 1 PR5 prototypes with 3 hardest routes (pob create, settlement cycle generate, agent run) before mass migration |
| Ratchet false positives block legitimate refactors | `metrics-gate.ts` supports `// metrics-gate: allow <metric> <reason>` PR escape hatch (with required reason); aggregated to dashboard for review |
| i18n translation quality | LLM batch + human review on critical pages (apply, login, settlement); other pages ship initial translation, fix forward |
| Team fatigue from sustained PR cadence | Week 4 cuts to 3 PRs/week; Week 5–6 focus on lower-pressure work |

## Companion docs

- [`docs/architecture/adr/0005-api-platform-layer.md`](../architecture/adr/0005-api-platform-layer.md) — what we're building
- [`docs/delivery/q1-evaluation-report.md`](./q1-evaluation-report.md) — why we're building it
- [`metrics/2026-04-30-q1-final.md`](../../metrics/2026-04-30-q1-final.md) — baseline numbers all ratchets are derived from
