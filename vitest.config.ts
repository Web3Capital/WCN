import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["**/__tests__/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["lib/modules/**", "lib/core/**"],
      exclude: ["**/__tests__/**", "**/node_modules/**"],
      reporter: ["text", "json-summary", "html"],
      thresholds: {
        branches: 50,
        functions: 50,
        lines: 55,
        statements: 55,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
});
