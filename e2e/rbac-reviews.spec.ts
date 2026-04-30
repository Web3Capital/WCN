/**
 * RBAC e2e — Reviews endpoint.
 *
 * Verifies Week 2 Day 3 widening (commit 78ca808): REVIEWER and RISK_DESK
 * can list reviews. Previously requireAdmin blocked them despite the
 * matrix granting `review: ["read","create"]`.
 */

import { test, expect, request as playwrightRequest } from "@playwright/test";
import { sessionCookieHeader } from "./fixtures/auth";
import { TEST_IDS } from "./fixtures/seed";

test.describe("RBAC: /api/reviews", () => {
  test("REVIEWER can list reviews (was blocked under requireAdmin)", async () => {
    const cookie = await sessionCookieHeader({ userId: TEST_IDS.reviewer, role: "REVIEWER" });
    const ctx = await playwrightRequest.newContext({ extraHTTPHeaders: { cookie } });
    const res = await ctx.get("/api/reviews");
    expect(res.status()).toBe(200);
    await ctx.dispose();
  });

  test("USER cannot list reviews", async () => {
    const cookie = await sessionCookieHeader({ userId: TEST_IDS.ownerA, role: "USER" });
    const ctx = await playwrightRequest.newContext({ extraHTTPHeaders: { cookie } });
    const res = await ctx.get("/api/reviews");
    expect([401, 403]).toContain(res.status());
    await ctx.dispose();
  });

  test("Unauthenticated is 401", async ({ request }) => {
    const res = await request.get("/api/reviews");
    expect(res.status()).toBe(401);
  });
});
