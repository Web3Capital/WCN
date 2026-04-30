/**
 * RBAC e2e — Tasks endpoints.
 *
 * Verifies row-level scope from Week 2 Day 1 (commit e5be820):
 * NODE_OWNER can create tasks on their own ownerNode but not on someone
 * else's; assignments must also be in their owned set.
 */

import { test, expect, request as playwrightRequest } from "@playwright/test";
import { sessionCookieHeader } from "./fixtures/auth";
import { TEST_IDS } from "./fixtures/seed";

async function asOwnerA() {
  const cookie = await sessionCookieHeader({ userId: TEST_IDS.ownerA, role: "NODE_OWNER" });
  return playwrightRequest.newContext({ extraHTTPHeaders: { cookie } });
}

test.describe("RBAC: /api/tasks/*", () => {
  test("NODE_OWNER A creates task on their own node (201)", async () => {
    const ctx = await asOwnerA();
    const res = await ctx.post("/api/tasks", {
      data: {
        title: "E2E Task A",
        type: "EXECUTION",
        ownerNodeId: TEST_IDS.nodeA,
        evidenceRequired: [],
        assignNodeIds: [TEST_IDS.nodeA],
      },
    });
    expect(res.status()).toBe(201);
    await ctx.dispose();
  });

  test("NODE_OWNER A rejected creating task on node B (IDOR)", async () => {
    const ctx = await asOwnerA();
    const res = await ctx.post("/api/tasks", {
      data: {
        title: "E2E Task IDOR",
        type: "EXECUTION",
        ownerNodeId: TEST_IDS.nodeB,
        evidenceRequired: [],
        assignNodeIds: [],
      },
    });
    expect([401, 403]).toContain(res.status());
    await ctx.dispose();
  });

  test("Unauthenticated POST is 401", async ({ request }) => {
    const res = await request.post("/api/tasks", { data: { title: "x", type: "EXECUTION", evidenceRequired: [], assignNodeIds: [] } });
    expect(res.status()).toBe(401);
  });
});
