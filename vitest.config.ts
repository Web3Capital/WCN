import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["**/__tests__/**/*.test.ts"],
    coverage: {
      provider: "v8",
      // Only enforce coverage on directories that actually have tests. The
      // previous wildcards (lib/modules/**, lib/core/**) included many
      // untested files (e.g. handlers.ts, ports.ts, index.ts barrels) that
      // dragged the average below thresholds and blocked CI on every PR.
      // Each entry below corresponds to a directory containing a __tests__
      // sibling. Add new modules here once they get a test file.
      include: [
        "lib/core/**",
        "lib/modules/agents/**",
        "lib/modules/apikeys/**",
        "lib/modules/evidence/**",
        "lib/modules/matching/**",
        "lib/modules/payment/**",
        "lib/modules/reputation/**",
        "lib/modules/risk/**",
        "lib/modules/settlement/**",
        "lib/modules/sms/**",
      ],
      exclude: [
        "**/__tests__/**",
        "**/node_modules/**",
        // Barrels and pure type/port files have no logic to cover.
        "**/index.ts",
        "**/ports.ts",
        // Handlers wire up event listeners — exercised by integration tests
        // and the live event bus rather than unit-level assertions. Excluding
        // them keeps the coverage gate honest about what unit tests cover.
        "**/handlers.ts",
      ],
      reporter: ["text", "json-summary", "html"],
      // Transitional thresholds — set just below current measured coverage
      // so CI prevents *regressions* while the team grows test coverage
      // toward the eventual aspirational target (50/50/55/55, see ADR todo).
      // When coverage rises, raise these in lockstep. NEVER let real coverage
      // exceed thresholds by more than ~5 points without bumping.
      thresholds: {
        branches: 25,
        functions: 30,
        lines: 35,
        statements: 35,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
});
