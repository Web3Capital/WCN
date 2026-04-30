/**
 * RBAC e2e — Settlement endpoints.
 *
 * Verifies the capability unlocked by Week 2 Day 4 (commit 0c0d7fb):
 * FINANCE_ADMIN can now create / generate / reconcile cycles, where
 * before requireAdmin blocked them despite the matrix granting
 * `settlement: ["read","create","update","export"]`.
 */

import { test, expect, request as playwrightRequest } from "@playwright/test";
import { sessionCookieHeader } from "./fixtures/auth";
import { TEST_IDS } from "./fixtures/seed";

test.describe("RBAC: /api/settlement/*", () => {
  test("FINANCE_ADMIN can create a settlement cycle (was blocked under requireAdmin)", async () => {
    const cookie = await sessionCookieHeader({ userId: TEST_IDS.finance, role: "FINANCE_ADMIN" });
    const ctx = await playwrightRequest.newContext({ extraHTTPHeaders: { cookie } });
    const res = await ctx.post("/api/settlement/cycles", {
      data: { kind: "MONTH", periodStart: "2026-04-01", periodEnd: "2026-04-30" },
    });
    expect([200, 201, 400, 422]).toContain(res.status()); // 400/422 acceptable if validation rejects payload — gate didn't reject
    expect(res.status()).not.toBe(401);
    expect(res.status()).not.toBe(403);
    await ctx.dispose();
  });

  test("NODE_OWNER cannot create a settlement cycle", async () => {
    const cookie = await sessionCookieHeader({ userId: TEST_IDS.ownerA, role: "NODE_OWNER" });
    const ctx = await playwrightRequest.newContext({ extraHTTPHeaders: { cookie } });
    const res = await ctx.post("/api/settlement/cycles", {
      data: { kind: "MONTH" },
    });
    expect([401, 403]).toContain(res.status());
    await ctx.dispose();
  });
});
