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
  // Nodes
  nodeA: "test-node-a", // owned by ownerA
  nodeB: "test-node-b", // owned by ownerB
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
}

/** Clean up created entities. Optional — safe to leave in DB across runs. */
export async function teardownTestFixtures() {
  const prisma = getPrisma();
  await prisma.node.deleteMany({ where: { id: { in: [TEST_IDS.nodeA, TEST_IDS.nodeB] } } });
  await prisma.user.deleteMany({
    where: {
      id: {
        in: [TEST_IDS.founder, TEST_IDS.ownerA, TEST_IDS.ownerB, TEST_IDS.reviewer, TEST_IDS.finance],
      },
    },
  });
}
