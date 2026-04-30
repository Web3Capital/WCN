# Issue 0001 — Lint infrastructure broken (Next 14.2 lint vs ESLint 9)

- **Status**: Open
- **Discovered**: 2026-04-30 (Week 1 Day 5)
- **Severity**: Medium — `npm run lint` produces no signal but does not fail CI either
- **Owner**: TBD (proposed for Week 2 Friday or Q1 stretch)

## Symptom

```
$ npx next lint
Invalid Options:
- Unknown options: useEslintrc, extensions, resolvePluginsRelativeTo, rulePaths, ignorePath, reportUnusedDisableDirectives
- 'extensions' has been removed.
- 'resolvePluginsRelativeTo' has been removed.
- 'ignorePath' has been removed.
- 'rulePaths' has been removed. Please define your rules using plugins.
- 'reportUnusedDisableDirectives' has been removed.
```

`next lint` exits with these errors and does not lint anything. `package.json` still defines `"lint": "next lint"` but the script silently produces no findings.

## Cause

Mismatched versions:

- `next@14.2.35` ships a lint wrapper that calls ESLint with legacy options.
- `eslint@9.39.4` removed those options as part of the v8 → v9 breaking changes.
- `eslint-config-next@16.2.3` is built for the flat-config era but the Next 14 wrapper does not invoke it.

## Consequences

- The new no-restricted-imports rule in `.eslintrc.json` (banning `requireAdmin`) is declared but unenforceable.
- Existing rules (`@next/next/no-img-element` etc.) are also unenforceable.
- CI does not fail on lint regressions, so any rule violation passes silently.

## Fix options

| Option | Pros | Cons |
|---|---|---|
| **A. Flat config + direct eslint** | Modern; works with eslint 9 | Need to write `eslint.config.mjs`; `next lint` script replaced by direct `eslint .` |
| **B. Downgrade eslint to v8** | Smallest diff | Goes backward; eslint-config-next@16 likely still wants flat |
| **C. Upgrade Next to 15+** | Native flat-config support | Out of scope per ADR-0001 (Q4 work) |

**Recommended**: A. Write `eslint.config.mjs`, replace `package.json:scripts.lint` with `eslint .`, drop the legacy `.eslintrc.json` once flat config is verified.

## Estimated effort

2–4 hours including verification on a representative subset of files.

## Done criteria

- `npm run lint` runs without "Unknown options" errors
- `no-restricted-imports` rule fires on a deliberately-violating test file
- All existing handlers using `requireAdmin` show as warnings (35 expected)
- Once Week 2 RBAC migration completes, severity escalates from `warn` to `error`

## Recommended scheduling

End of Week 2 (Friday), bundled with the `requireAdmin` deletion PR.
The two changes together close the loop:

1. All 35 handlers migrated → `requireAdmin` no longer imported
2. `requireAdmin` exported but lint forbids re-introduction (now actually enforceable)
3. `requireAdmin` definition deleted from `lib/admin.ts`
