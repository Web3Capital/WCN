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
];

export default config;
