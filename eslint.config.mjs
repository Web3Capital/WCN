// ESLint flat config (replaces .eslintrc.json — see docs/architecture/issues/0001-eslint-flat-config.md).
//
// Background: Next 14.2's `next lint` wrapper passes ESLint v8 options to
// ESLint v9, which removed them. The legacy .eslintrc.json was silently
// ignored. Migrating to flat config makes lint actually run again, allowing
// the no-restricted-imports rule (banning requireAdmin) to fire.

import nextConfig from "eslint-config-next";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import importPlugin from "eslint-plugin-import";

const config = [
  ...nextConfig,
  {
    name: "wcn/overrides",
    plugins: {
      "react-hooks": reactHooksPlugin,
      import: importPlugin,
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
    },
  },
  {
    name: "wcn/ignores",
    ignores: ["node_modules/", ".next/", "prisma/", "metrics/", "coverage/", "lib/generated/"],
  },
];

export default config;
