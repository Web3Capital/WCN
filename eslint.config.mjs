// ESLint flat config (replaces .eslintrc.json — see docs/architecture/issues/0001-eslint-flat-config.md).
//
// Background: Next 14.2's `next lint` wrapper passes ESLint v8 options to
// ESLint v9, which removed them. The legacy .eslintrc.json was silently
// ignored. Migrating to flat config makes lint actually run again, allowing
// the no-restricted-imports rule (banning requireAdmin) to fire.

import { globalIgnores } from "eslint/config";
import nextConfig from "eslint-config-next";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import importPlugin from "eslint-plugin-import";
import tsEslintPlugin from "@typescript-eslint/eslint-plugin";

const config = [
  globalIgnores(
    [
      "node_modules/",
      ".next/",
      "**/.next/**",
      ".claude/",
      ".claude/**",
      "prisma/",
      "metrics/",
      "coverage/",
      "test-results/",
      "playwright-report/",
      "blob-report/",
      "lib/generated/",
    ],
    "wcn/ignores",
  ),
  ...nextConfig,
  {
    name: "wcn/overrides",
    plugins: {
      "react-hooks": reactHooksPlugin,
      import: importPlugin,
      "@typescript-eslint": tsEslintPlugin,
    },
    rules: {
      "no-unused-vars": "off",
      // Bans the legacy requireAdmin import. requireAdmin was deleted at the
      // end of Week 2; this rule prevents reintroduction. Severity is
      // `error` now that all 35 prior call sites have migrated and the
      // export no longer exists.
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/admin",
              importNames: ["requireAdmin"],
              message:
                "requireAdmin was removed (Week 2 RBAC migration). Use requirePermission(action, resource) from @/lib/admin plus a row-level check from @/lib/auth/resource-scope. See docs/architecture/adr/0002-rbac-migration-week2.md.",
            },
          ],
        },
      ],
      // ── react-hooks rules (issue 0002 closeout) ──────────────────────
      // These were demoted to `warn` after issue 0001 reactivated lint and
      // surfaced 33 pre-existing violations. All have since been addressed:
      //   - refs / static-components: real refactor (hoist + ref-via-effect)
      //   - purity / set-state-in-effect / exhaustive-deps: per-line
      //     disables with rationale where the violation is an intentional
      //     pattern (server-component request-time, sync-on-prop, lazy
      //     tab-load). New occurrences without explanatory disable will fail.
      // Promoted to error to prevent new violations.
      "react-hooks/refs": "error",
      "react-hooks/set-state-in-effect": "error",
      "react-hooks/purity": "error",
      "react-hooks/static-components": "error",
      "import/no-anonymous-default-export": "error",
      // Catch new `any` in code review without forcing a 239-site refactor.
      // Per Q1 close-out: existing 239 occurrences stay; the rule prevents
      // the trend from worsening. Pay down systematically alongside other
      // refactors. Ratchet to error once the count drops below 50 or so.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    // Marketing pages must be fully internationalized — see docs/marketing-redesign.md.
    // ADR-MR-005: ESLint AST rule is cheaper than runtime checks at preventing
    // English string regressions in JSX. Scope is intentionally narrow to the
    // marketing surface; dashboard i18n debt is tracked separately.
    //
    // The regex matches a capitalized word followed by a lowercase word in JSX
    // text (e.g. "Editor's note", "Designed for", "Operating Loop"). Single
    // words like "Affirmative" are not caught here — they should already be
    // fixed by Phase 1. The rule primarily prevents NEW English strings from
    // sneaking back in.
    //
    // Phase 1 completed 2026-05-27 with 0 violations; promoted from warn to
    // error to prevent regression. New marketing English strings will now
    // fail CI rather than just warn.
    name: "wcn/marketing-i18n-guard",
    // `[locale]` is a Next.js dynamic-segment dir. micromatch (used by ESLint
    // flat config) parses bare `[locale]` as a character class, so we use the
    // single-segment wildcard `*` to match the locale dir name. `*` does not
    // cross `/`, so `app/*/page.tsx` matches `app/[locale]/page.tsx` and
    // nothing nested deeper.
    files: [
      "app/*/page.tsx",
      "app/*/about/**/*.tsx",
      "app/*/how-it-works/**/*.tsx",
      "app/*/nodes/**/*.tsx",
      "app/*/pob/**/*.tsx",
      "app/*/apply/**/*.tsx",
      "components/brand/**/*.tsx",
      "components/marketing/**/*.tsx",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          // Matches capital-led token + space + letter token.
          // - `\\S*` covers ASCII apostrophes AND Unicode curly quotes (Editor's vs Editor's)
          // - second token allows both casings, catches "Operating Loop" and "Not rewarded"
          // - "Volume · MMXXVI" survives because `·` breaks the \\S* run
          selector: "JSXText[value=/[A-Z]\\S* [A-Za-z]+/]",
          message:
            "JSX 文本含英文短语,必须走 t('...')。品牌名 (WCN / PoB / Volume · MMXXVI) 等约定例外请加 // eslint-disable-next-line no-restricted-syntax。详见 docs/marketing-redesign.md ADR-MR-005。",
        },
      ],
    },
  },
];

export default config;
