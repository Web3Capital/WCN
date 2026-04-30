/**
 * E2E test seed — creates a small set of users and nodes that the RBAC
 * specs reference.
 *
 * Idempotent: uses upsert so reruns don't accumulate. The test IDs are
 * deterministic so specs can hardcode them.
 *
 * Called from playwright.config.ts globalSetup (or per-spec beforeAll if
 * we don't want a test DB reset on every CI run).
 */

import { getPrisma } from "@/lib/prisma";

export const TEST_IDS = {
  // Users
  founder: "test-user-founder",
  ownerA: "test-user-owner-a",
  ownerB: "test-user-owner-b",
  reviewer: "test-user-reviewer",
  finance: "test-user-finance",
  riskDesk: "test-user-risk-desk",
  // Nodes
  nodeA: "test-node-a", // owned by ownerA
  nodeB: "test-node-b", // owned by ownerB
  // Agents
  agentA: "test-agent-a", // owned by nodeA (so ownerA can mutate; RISK_DESK can freeze)
} as const;

export async function seedTestFixtures() {
  const prisma = getPrisma();

  // Users
  await prisma.user.upsert({
    where: { id: TEST_IDS.founder },
    update: { role: "FOUNDER" },
    create: { id: TEST_IDS.founder, name: "Test Founder", role: "FOUNDER", accountStatus: "ACTIVE" },
  });
  await prisma.user.upsert({
    where: { id: TEST_IDS.ownerA },
    update: { role: "NODE_OWNER" },
    create: { id: TEST_IDS.ownerA, name: "Test Owner A", role: "NODE_OWNER", accountStatus: "ACTIVE" },
  });
  await prisma.user.upsert({
    where: { id: TEST_IDS.ownerB },
    update: { role: "NODE_OWNER" },
    create: { id: TEST_IDS.ownerB, name: "Test Owner B", role: "NODE_OWNER", accountStatus: "ACTIVE" },
  });
  await prisma.user.upsert({
    where: { id: TEST_IDS.reviewer },
    update: { role: "REVIEWER" },
    create: { id: TEST_IDS.reviewer, name: "Test Reviewer", role: "REVIEWER", accountStatus: "ACTIVE" },
  });
  await prisma.user.upsert({
    where: { id: TEST_IDS.finance },
    update: { role: "FINANCE_ADMIN" },
    create: { id: TEST_IDS.finance, name: "Test Finance", role: "FINANCE_ADMIN", accountStatus: "ACTIVE" },
  });
  await prisma.user.upsert({
    where: { id: TEST_IDS.riskDesk },
    update: { role: "RISK_DESK" },
    create: { id: TEST_IDS.riskDesk, name: "Test Risk Desk", role: "RISK_DESK", accountStatus: "ACTIVE" },
  });

  // Nodes — each owned by one of the NODE_OWNER users so we can test IDOR.
  await prisma.node.upsert({
    where: { id: TEST_IDS.nodeA },
    update: { ownerUserId: TEST_IDS.ownerA },
    create: {
      id: TEST_IDS.nodeA,
      name: "Test Node A",
      type: "FUNCTIONAL",
      status: "LIVE",
      ownerUserId: TEST_IDS.ownerA,
    },
  });
  await prisma.node.upsert({
    where: { id: TEST_IDS.nodeB },
    update: { ownerUserId: TEST_IDS.ownerB },
    create: {
      id: TEST_IDS.nodeB,
      name: "Test Node B",
      type: "FUNCTIONAL",
      status: "LIVE",
      ownerUserId: TEST_IDS.ownerB,
    },
  });

  // Agent — owned by nodeA. Lets us test:
  //   - ownerA (NODE_OWNER) can update / trigger runs (matrix update+agent)
  //   - ownerB (NODE_OWNER) cannot mutate (IDOR)
  //   - riskDesk can freeze (matrix freeze+agent, disjunctive PATCH gate)
  await prisma.agent.upsert({
    where: { id: TEST_IDS.agentA },
    update: { ownerNodeId: TEST_IDS.nodeA },
    create: {
      id: TEST_IDS.agentA,
      name: "Test Agent A",
      type: "DEAL",
      status: "ACTIVE",
      ownerNodeId: TEST_IDS.nodeA,
    },
  });
}

/** Clean up created entities. Optional — safe to leave in DB across runs. */
export async function teardownTestFixtures() {
  const prisma = getPrisma();
  await prisma.agent.deleteMany({ where: { id: { in: [TEST_IDS.agentA] } } });
  await prisma.node.deleteMany({ where: { id: { in: [TEST_IDS.nodeA, TEST_IDS.nodeB] } } });
  await prisma.user.deleteMany({
    where: {
      id: {
        in: [TEST_IDS.founder, TEST_IDS.ownerA, TEST_IDS.ownerB, TEST_IDS.reviewer, TEST_IDS.finance, TEST_IDS.riskDesk],
      },
    },
  });
}
