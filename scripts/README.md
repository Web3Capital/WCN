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

## Metrics ratchet (planned)

`metrics-gate.ts` will follow the same pattern for code-shape ratchets (any-type count, force-dynamic count, raw API handler count, etc.). See ADR-0005.
