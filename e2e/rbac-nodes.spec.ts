/**
 * RBAC e2e — Nodes endpoints, focusing on the privileged-field gate.
 *
 * Verifies Week 2 Day 2 (commit ddd6190):
 * - NODE_OWNER can edit profile fields on their own node (name / description /
 *   region / city / contact / etc.).
 * - NODE_OWNER CANNOT flip status / type / level / ownerUserId / riskLevel —
 *   these are review decisions and remain admin-only via the inline gate.
 * - NODE_OWNER cannot mutate a node they don't own (IDOR).
 *
 * Without this gate a NODE_OWNER could self-promote SUBMITTED → LIVE,
 * bypassing review.
 */

import { test, expect, request as playwrightRequest } from "@playwright/test";
import { sessionCookieHeader } from "./fixtures/auth";
import { TEST_IDS } from "./fixtures/seed";

async function asOwnerA() {
  const cookie = await sessionCookieHeader({ userId: TEST_IDS.ownerA, role: "NODE_OWNER" });
  return playwrightRequest.newContext({ extraHTTPHeaders: { cookie } });
}

async function asFounder() {
  const cookie = await sessionCookieHeader({ userId: TEST_IDS.founder, role: "FOUNDER" });
  return playwrightRequest.newContext({ extraHTTPHeaders: { cookie } });
}

test.describe("RBAC: /api/nodes/[id] PATCH privileged-field gate", () => {
  test("NODE_OWNER can edit profile fields on their own node", async () => {
    const ctx = await asOwnerA();
    const res = await ctx.patch(`/api/nodes/${TEST_IDS.nodeA}`, {
      data: { description: "E2E updated description" },
    });
    expect(res.status()).toBe(200);
    await ctx.dispose();
  });

  test.describe.parallel("NODE_OWNER blocked from privileged fields on own node", () => {
    for (const field of ["status", "ownerUserId", "level", "type", "riskLevel"] as const) {
      test(`cannot flip ${field}`, async () => {
        const ctx = await asOwnerA();
        const valueByField: Record<string, unknown> = {
          status: "LIVE",
          ownerUserId: TEST_IDS.ownerB,
          level: 5,
          type: "GLOBAL",
          riskLevel: "HIGH",
        };
        const res = await ctx.patch(`/api/nodes/${TEST_IDS.nodeA}`, {
          data: { [field]: valueByField[field] },
        });
        expect([401, 403]).toContain(res.status());
        await ctx.dispose();
      });
    }
  });

  test("NODE_OWNER A cannot mutate node owned by B (IDOR)", async () => {
    const ctx = await asOwnerA();
    const res = await ctx.patch(`/api/nodes/${TEST_IDS.nodeB}`, {
      data: { description: "Should be rejected" },
    });
    expect([401, 403]).toContain(res.status());
    await ctx.dispose();
  });

  test("FOUNDER can flip status (admin-only field)", async () => {
    const ctx = await asFounder();
    // Toggle to a different status then back, so the test is idempotent.
    // Pick LIVE since the seed creates the node in LIVE; this is a no-op
    // semantically but exercises the gate path.
    const res = await ctx.patch(`/api/nodes/${TEST_IDS.nodeA}`, {
      data: { status: "LIVE" },
    });
    // 200 (succeed) OR 400/409 (state-machine refuses no-op) — gate passed
    // either way. Critically NOT 401/403.
    expect([200, 400, 409]).toContain(res.status());
    expect(res.status()).not.toBe(401);
    expect(res.status()).not.toBe(403);
    await ctx.dispose();
  });

  test("Unauthenticated PATCH is 401", async ({ request }) => {
    const res = await request.patch(`/api/nodes/${TEST_IDS.nodeA}`, {
      data: { description: "no auth" },
    });
    expect(res.status()).toBe(401);
  });
});
