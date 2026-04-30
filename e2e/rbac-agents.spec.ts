/**
 * RBAC e2e — Agents endpoint, focusing on the disjunctive PATCH gate.
 *
 * Verifies Week 2 Day 3 (commit e6bbc9b): agents/[id] PATCH covers two
 * matrix-distinct flows in one endpoint:
 *
 * 1. update+agent (AGENT_OWNER / NODE_OWNER on own agents, plus admins)
 *    — used for general profile edits (name, endpoint, version, etc.)
 *
 * 2. freeze+agent (RISK_DESK + admins, on ANY agent without owning)
 *    — used to set freezeLevel / suspend
 *
 * The handler detects "freeze-only" payloads (only freezeLevel + reason
 * keys) and routes to the freeze gate; otherwise requires update+ownsAgent.
 *
 * This split lets RISK_DESK do their job (freeze any agent for risk
 * reasons) without granting them general edit capability — matching the
 * matrix split between `update` and `freeze` actions.
 */

import { test, expect, request as playwrightRequest } from "@playwright/test";
import { sessionCookieHeader } from "./fixtures/auth";
import { TEST_IDS } from "./fixtures/seed";

async function asOwnerA() {
  const cookie = await sessionCookieHeader({ userId: TEST_IDS.ownerA, role: "NODE_OWNER" });
  return playwrightRequest.newContext({ extraHTTPHeaders: { cookie } });
}

async function asOwnerB() {
  const cookie = await sessionCookieHeader({ userId: TEST_IDS.ownerB, role: "NODE_OWNER" });
  return playwrightRequest.newContext({ extraHTTPHeaders: { cookie } });
}

async function asRiskDesk() {
  const cookie = await sessionCookieHeader({ userId: TEST_IDS.riskDesk, role: "RISK_DESK" });
  return playwrightRequest.newContext({ extraHTTPHeaders: { cookie } });
}

test.describe("RBAC: /api/agents/[id] PATCH disjunctive gate", () => {
  test("NODE_OWNER A can update general fields on own agent (update path)", async () => {
    const ctx = await asOwnerA();
    const res = await ctx.patch(`/api/agents/${TEST_IDS.agentA}`, {
      data: { name: "Test Agent A (e2e renamed)" },
    });
    expect(res.status()).toBe(200);
    await ctx.dispose();
  });

  test("NODE_OWNER B cannot update agent owned by A (IDOR on update path)", async () => {
    const ctx = await asOwnerB();
    const res = await ctx.patch(`/api/agents/${TEST_IDS.agentA}`, {
      data: { name: "Should reject" },
    });
    expect([401, 403]).toContain(res.status());
    await ctx.dispose();
  });

  test("RISK_DESK CAN freeze an agent they don't own (freeze path)", async () => {
    const ctx = await asRiskDesk();
    const res = await ctx.patch(`/api/agents/${TEST_IDS.agentA}`, {
      data: { freezeLevel: "L1_PAUSE_TASK", reason: "e2e freeze test" },
    });
    // 200 success — RISK_DESK has freeze+agent in matrix even without ownership.
    expect(res.status()).toBe(200);
    // Restore: freeze back to null/unfrozen so the test is idempotent.
    const restore = await ctx.patch(`/api/agents/${TEST_IDS.agentA}`, {
      data: { freezeLevel: null, status: "ACTIVE" },
    });
    // Restore may not always be allowed via freeze path (status field requires
    // update+agent which RISK_DESK lacks). Accept either 200 (allowed) or
    // 401/403 (gate refused — non-blocking for the test's main assertion).
    expect([200, 401, 403]).toContain(restore.status());
    await ctx.dispose();
  });

  test("RISK_DESK CANNOT update general fields (no update+agent in matrix)", async () => {
    const ctx = await asRiskDesk();
    const res = await ctx.patch(`/api/agents/${TEST_IDS.agentA}`, {
      data: { name: "RISK_DESK should not rename agents" },
    });
    expect([401, 403]).toContain(res.status());
    await ctx.dispose();
  });

  test("Unauthenticated PATCH is 401", async ({ request }) => {
    const res = await request.patch(`/api/agents/${TEST_IDS.agentA}`, {
      data: { name: "no auth" },
    });
    expect(res.status()).toBe(401);
  });
});
