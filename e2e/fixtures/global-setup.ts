/**
 * Playwright globalSetup — seeds RBAC test users and nodes once before any
 * spec runs. Wired in playwright.config.ts via `globalSetup`.
 *
 * Idempotent: calls seed.ts upsert, safe to re-run.
 */

import { seedTestFixtures } from "./seed";

export default async function globalSetup() {
  await seedTestFixtures();
}
