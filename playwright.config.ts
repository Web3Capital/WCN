import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PORT || 3000);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "e2e",
  testIgnore: ["**/fixtures/**"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  globalSetup: "./e2e/fixtures/global-setup.ts",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: `npm run build && npx next start -p ${port}`,
        url: `${baseURL}/api/health`,
        reuseExistingServer: !process.env.CI,
        // `npm run build` does `prisma generate && next build`. On CI the
        // build + collect-traces + `next start` boot sits around 150-180s
        // even after dropping unused SSG. Give it real headroom instead of
        // racing the 180s default.
        timeout: 300_000,
        stdout: "pipe",
        stderr: "pipe",
        env: {
          ...process.env,
          PORT: String(port),
        },
      },
});
