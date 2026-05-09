# `scripts/` — repository tooling

Operational scripts. Run from repo root.

| Script | Purpose |
|---|---|
| `baseline-metrics.sh` | Snapshots the codebase health dimensions Q1 cares about into `metrics/<date>-<label>.{json,md}`. Run weekly. |
| `check-i18n.ts` | i18n parity ratchet — compares each `messages/<locale>.json` against `messages/en.json` and fails CI if any locale drifted further from `en` than its baseline ceiling. |
| `convert-html-to-mdx.ts` | One-shot import of WCN strategy HTML chapters into MDX. |
| `create-admin.mjs` | Bootstrap an admin user (DB write). Local only. |
| `e2e-business-loop.ts` | End-to-end smoke of the apply → node → task → PoB → settlement loop. Runs in CI after Playwright. |

## i18n ratchet (`check-i18n.ts`)

```bash
# verify (default — CI uses this)
npm run check:i18n

# print full table without enforcing
npm run check:i18n:report

# rewrite metrics/i18n-baseline.json (after a translation PR lands)
npm run check:i18n:update
```

The baseline records, per non-en locale, the **current count of missing keys vs en**. CI fails if any locale's missing count exceeds its ceiling. This means:

- **You cannot make i18n worse** — adding an English-only key without back-filling at least one other locale fails CI.
- **You can make it better** — completing translations lowers `missingKeys`; run `--update` and commit the new baseline.
- **Initial Q2 baseline**: 156 missing keys per non-en locale (carryover from Q1 `node-system` strings). To be paid down in Q2 Week 5 per `docs/delivery/q2-systematic-fix-roadmap.md`.

## Metrics ratchet (`metrics-gate.ts`)

Mirrors `check-i18n.ts` for code-shape metrics. Ceilings live in `metrics/ratchet.json`; CI fails if any tracked metric grew.

```bash
npm run check:metrics            # CI verify (default)
npm run check:metrics:report     # snapshot + delta vs ceiling, exit 0
npm run check:metrics:update     # rewrite ceilings (after fix PR)
```

Tracked metrics (Q2 baseline):

| Key | Initial | Goal | Owner |
|---|---:|---:|---|
| `rawApiHandlers` | 128 | 0 | ADR-0005 (Q2 W2–W4) |
| `routesWithoutZod` | 69 | 0 | ADR-0005 |
| `routesWithoutRateLimit` | 126 | 0 | ADR-0005 |
| `anyTypeOccurrences` | 212 | < 50 | Q2 W5 first sweep |
| `jsonParseStringifyFiles` | 29 | 0 | Q2 W6 |
| `forceDynamicFiles` | 106 | n/a | adopt cache primitives, Q2 W6 + ADR-0004 |
| `requireAdminCallSites` | 1 | 0 | tracked-only (lib/admin.ts comment) |

Adding a new metric: append a `Metric` entry to `METRICS` in `scripts/metrics-gate.ts`, run `--update`, commit. The gate is intentionally additive — removing or relaxing a metric requires PR justification.

