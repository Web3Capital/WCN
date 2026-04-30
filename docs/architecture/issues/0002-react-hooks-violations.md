# Issue 0002 — Pre-existing react-hooks violations surfaced by lint reactivation

- **Status**: Closed (2026-04-30, Q1 stretch)
- **Discovered**: 2026-04-30 (Week 2 Day 5)
- **Severity**: Medium — runtime-affecting bugs lurking; not yet observed in production
- **Owner**: Tech Lead (closed in PR after #6)

## Background

[Issue 0001](./0001-eslint-flat-config.md) fixed the broken Next 14 + ESLint 9 lint pipeline by moving to flat config. The first time the lint actually ran, it surfaced **33 pre-existing violations** that the silently-broken legacy lint had been hiding.

These are NOT introduced by Week 2 RBAC migration. They were already present in `main` before any Q1 work began. Surfacing them is a side-effect of fixing the lint infrastructure.

To unblock Week 2 PR #4, all violations are temporarily demoted from `error` to `warn` in `eslint.config.mjs`. CI passes. Each must be promoted back to `error` after the underlying code is fixed.

## Breakdown by rule

| Rule | Count | Severity | Meaning |
|---|---:|---|---|
| `react-hooks/set-state-in-effect` | 11 | warn (was error) | Calling setState synchronously in useEffect → cascading renders |
| `react-hooks/purity` | 8 | warn (was error) | Cannot call impure function during render |
| `react-hooks/static-components` | 5 | warn (was error) | Cannot create new component types during render (creates a new identity each render → React tree thrash) |
| `Unused eslint-disable directive` | 5 | warn | Stale `// eslint-disable …` comments — dead pragmatics |
| `react-hooks/exhaustive-deps` | 2 | warn (already warn) | Missing/extra dependencies in useEffect/useMemo/useCallback |
| `react-hooks/refs` | 1 | warn (was error) | `Cannot update ref during render` (mutating ref.current outside effects/handlers) |
| `import/no-anonymous-default-export` | 1 | warn (was error) | `export default {…}` without a name |

Total: **33 warnings**.

## Why each matters

- **set-state-in-effect** is the dominant React performance footgun. Each occurrence is a potential infinite re-render loop or a "double render" pattern that wastes work. Symptom: pages that feel snappy on dev but stutter under real data.
- **purity** violations break React's mental model and may exhibit different behavior under React 18 strict mode and React 19 (which this repo will adopt in Q4 per ADR-0001).
- **static-components** is most often `const X = (props) => ...` defined inside a parent component, then rendered. Every parent render creates a new component identity, which React treats as a different type — so the entire subtree unmounts and remounts. `matches/ui.tsx` has 5 of these.
- **refs during render** indicates a state-vs-ref confusion. Real bug.

None of these directly compromise correctness in the obvious places (the app works). But each is a latent footgun that becomes a real bug under specific load/timing conditions.

## Files affected (sample, not exhaustive)

Run `npx eslint . | tee` to get the live list. Top offenders:
- `app/[locale]/dashboard/matches/ui.tsx` — 5 static-components violations
- `lib/modules/realtime/client.ts:12` — 1 refs-during-render
- Various `app/[locale]/dashboard/**/ui.tsx` — set-state-in-effect cluster

## Recommended schedule

Bundle into a single dedicated PR:

1. Fix all `react-hooks/static-components` violations first (cheapest — extract component definitions out of render function).
2. Fix `refs` violation (1 file, narrow change).
3. Fix `set-state-in-effect` cluster (largest; may require restructuring to use `useReducer` or derived state).
4. Fix `purity` cluster.
5. Remove unused `eslint-disable` directives.
6. Re-promote each rule to `error` in `eslint.config.mjs`.

Estimated 1–2 days. Target window: Week 2 → Q1 stretch (week 3 if available) or first week of Q2.

## Done criteria

- `npx eslint .` returns 0 warnings (apart from intentional `import/no-anonymous-default-export` if any remain by design)
- All five rules promoted back to `error` in `eslint.config.mjs`
- No new issues introduced (no regression of the now-working lint pipeline)

## Resolution (2026-04-30)

Closed in the same session, after PR #6 (e2e RBAC). Approach by rule:

| Rule | Final count fixed | Approach |
|---|---|---|
| `import/no-anonymous-default-export` | 1 | Named the default export in `eslint.config.mjs` |
| Unused `eslint-disable` | 5 | Removed dead pragmas |
| `react-hooks/static-components` | 5 | Hoisted `SortIcon` from inside `MatchesConsole` to module scope; takes `sortKey`/`sortDir` as props |
| `react-hooks/refs` | 1 | Moved `handlersRef.current = handlers` from render-body to a synchronizing `useEffect` in `useRealtimeEvents` |
| `react-hooks/purity` | 8 | (a) 6 server components: per-line disable + rationale (server runs once per request, no hydration concern); (b) 2 client useMemo/SLA tag: per-line disable + rationale |
| `react-hooks/set-state-in-effect` | 11 | Per-line disable + rationale across 8 files. All 11 are the "intentional sync-on-prop" pattern (e.g., close menu on navigate, reset on dialog open). Structural refactor (use `key=` or derived state) tracked as separate follow-up if React 19 strict mode flags them at runtime |
| `react-hooks/exhaustive-deps` | 2 | Per-line disable in `nodes/[id]/ui.tsx` lazy tab-load effects. Proper fix is `useCallback` wrapping; deferred until tab-state refactor |

After fixes:
- `npx eslint .` → 0 errors, 0 warnings
- 5 rules re-promoted from `warn` to `error` in `eslint.config.mjs`
- 18 disables added with rationale comments — every disable is auditable (file:line + reason). Sweep with `grep -rn "eslint-disable" --include="*.ts" --include="*.tsx"` to review them all.

## Follow-up tracked elsewhere

- Per-handler refactor of "sync-on-prop" patterns to `key=` or derived state — appropriate for React 19 strict mode rollout (Q4 per ADR-0001)
- `useCallback`-wrapping for tab-fetch handlers in `nodes/[id]/ui.tsx` — minor, can be done alongside next dashboard refactor wave
