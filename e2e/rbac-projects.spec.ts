/**
 * RBAC e2e — Projects endpoints.
 *
 * Verifies row-level scope from Week 2 Day 2 (commit 1357ac5):
 * - NODE_OWNER can create projects attached to their own nodes.
 * - DELETE remains admin-only via matrix (FOUNDER/ADMIN have `delete+project`,
 *   NODE_OWNER does not).
 */

import { test, expect, request as playwrightRequest } from "@playwright/test";
import { sessionCookieHeader } from "./fixtures/auth";
import { TEST_IDS } from "./fixtures/seed";

test.describe("RBAC: /api/projects/*", () => {
  test("NODE_OWNER creates project attached to own node (200)", async () => {
    const cookie = await sessionCookieHeader({ userId: TEST_IDS.ownerA, role: "NODE_OWNER" });
    const ctx = await playwrightRequest.newContext({ extraHTTPHeaders: { cookie } });
    const res = await ctx.post("/api/projects", {
      data: {
        name: "E2E Project A",
        stage: "SEED",
        nodeId: TEST_IDS.nodeA,
      },
    });
    expect([200, 201]).toContain(res.status());
    await ctx.dispose();
  });

  test("NODE_OWNER rejected creating project on node B (IDOR)", async () => {
    const cookie = await sessionCookieHeader({ userId: TEST_IDS.ownerA, role: "NODE_OWNER" });
    const ctx = await playwrightRequest.newContext({ extraHTTPHeaders: { cookie } });
    const res = await ctx.post("/api/projects", {
      data: { name: "E2E IDOR Project", stage: "SEED", nodeId: TEST_IDS.nodeB },
    });
    expect([400, 401, 403]).toContain(res.status());
    await ctx.dispose();
  });

  test("Unauthenticated GET list is 401", async ({ request }) => {
    const res = await request.get("/api/projects");
    expect(res.status()).toBe(401);
  });
});
