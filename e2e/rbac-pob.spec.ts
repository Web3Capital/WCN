/**
 * RBAC e2e — Proof of Business endpoints.
 *
 * Verifies the row-level scope added by Week 2 Day 1 (commit da3b9c2):
 * NODE_OWNER can create / mutate PoBs attributed to their own nodes,
 * but not to nodes they don't own (IDOR).
 */

import { test, expect, request as playwrightRequest } from "@playwright/test";
import { sessionCookieHeader } from "./fixtures/auth";
import { TEST_IDS } from "./fixtures/seed";

async function asUser(userId: string, role: Parameters<typeof sessionCookieHeader>[0]["role"]) {
  const cookie = await sessionCookieHeader({ userId, role });
  return playwrightRequest.newContext({ extraHTTPHeaders: { cookie } });
}

test.describe("RBAC: /api/pob/*", () => {
  test("NODE_OWNER A creates a PoB attributed to their own node (200)", async () => {
    const ctx = await asUser(TEST_IDS.ownerA, "NODE_OWNER");
    const res = await ctx.post("/api/pob", {
      data: { businessType: "TEST_E2E", nodeId: TEST_IDS.nodeA, baseValue: 100 },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body?.data?.nodeId ?? body?.nodeId).toBe(TEST_IDS.nodeA);
    await ctx.dispose();
  });

  test("NODE_OWNER A is rejected when attributing PoB to node they don't own (IDOR check)", async () => {
    const ctx = await asUser(TEST_IDS.ownerA, "NODE_OWNER");
    const res = await ctx.post("/api/pob", {
      data: { businessType: "TEST_E2E_IDOR", nodeId: TEST_IDS.nodeB, baseValue: 100 },
    });
    expect([400, 401, 403]).toContain(res.status());
    await ctx.dispose();
  });

  test("Unauthenticated POST is 401", async ({ request }) => {
    const res = await request.post("/api/pob", {
      data: { businessType: "TEST_E2E_NO_AUTH", nodeId: TEST_IDS.nodeA },
    });
    expect(res.status()).toBe(401);
  });
});
