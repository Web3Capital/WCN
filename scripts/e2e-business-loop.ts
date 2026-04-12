/**
 * WCN Phase 2 E2E Business Loop Verification
 *
 * Tests the full business cycle:
 * Project → Match → Deal → Evidence → PoB Attribution → Settlement
 *
 * Run with: npx tsx scripts/e2e-business-loop.ts
 * Requires POSTGRES_URL or DATABASE_URL (direct postgres://) in .env
 */

import "dotenv/config";
import { getPrisma } from "../lib/prisma";

const prisma = getPrisma();

const CHECK = "✓";
const FAIL = "✗";
const INFO = "→";

function log(status: string, msg: string) {
  console.log(`  ${status} ${msg}`);
}

async function cleanup(ids: {
  projectId?: string;
  capitalId?: string;
  nodeLeadId?: string;
  nodeCapitalId?: string;
  dealId?: string;
  userId?: string;
}) {
  try {
    if (ids.dealId) await prisma.deal.delete({ where: { id: ids.dealId } }).catch((e) => console.error("[e2e cleanup]", e));
    if (ids.projectId) await prisma.project.delete({ where: { id: ids.projectId } }).catch((e) => console.error("[e2e cleanup]", e));
    if (ids.capitalId) await prisma.capitalProfile.delete({ where: { id: ids.capitalId } }).catch((e) => console.error("[e2e cleanup]", e));
    if (ids.nodeLeadId) await prisma.node.delete({ where: { id: ids.nodeLeadId } }).catch((e) => console.error("[e2e cleanup]", e));
    if (ids.nodeCapitalId) await prisma.node.delete({ where: { id: ids.nodeCapitalId } }).catch((e) => console.error("[e2e cleanup]", e));
    if (ids.userId) await prisma.user.delete({ where: { id: ids.userId } }).catch((e) => console.error("[e2e cleanup]", e));
  } catch (e) { console.error("[e2e cleanup] outer", e); }
}

async function main() {
  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║  WCN Phase 2 — E2E Business Loop Verification      ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");

  const ids: Record<string, string> = {};
  let passed = 0;
  let failed = 0;

  try {
    // ─── Step 1: Create test user ────────────────────────────
    console.log("Step 1: Create test entities");

    const user = await prisma.user.create({
      data: {
        email: `e2e-test-${Date.now()}@wcn.network`,
        name: "E2E Test User",
        role: "ADMIN",
      },
    });
    ids.userId = user.id;
    log(CHECK, `User created: ${user.id}`);
    passed++;

    // ─── Step 2: Create nodes ────────────────────────────────
    console.log("\nStep 2: Create nodes");

    const leadNode = await prisma.node.create({
      data: {
        name: "E2E Lead Node",
        type: "REGION",
        status: "ACTIVE",
        ownerUserId: user.id,
      },
    });
    ids.nodeLeadId = leadNode.id;
    log(CHECK, `Lead node: ${leadNode.id}`);

    const capitalNode = await prisma.node.create({
      data: {
        name: "E2E Capital Node",
        type: "INDUSTRY",
        status: "ACTIVE",
        ownerUserId: user.id,
      },
    });
    ids.nodeCapitalId = capitalNode.id;
    log(CHECK, `Capital node: ${capitalNode.id}`);
    passed++;

    // ─── Step 3: Create project ──────────────────────────────
    console.log("\nStep 3: Create project");

    const project = await prisma.project.create({
      data: {
        name: "E2E Test Project",
        status: "CURATED",
        stage: "SEED",
        sector: "DeFi",
        fundraisingNeed: "$2M",
        nodeId: leadNode.id,
      },
    });
    ids.projectId = project.id;
    log(CHECK, `Project: ${project.id} (status: ${project.status})`);
    passed++;

    // ─── Step 4: Create capital profile ──────────────────────
    console.log("\nStep 4: Create capital profile");

    const capital = await prisma.capitalProfile.create({
      data: {
        name: "E2E Capital Fund",
        status: "ACTIVE",
        investmentFocus: ["DeFi", "SEED", "Infrastructure"],
        ticketMin: 500000,
        ticketMax: 5000000,
        nodeId: capitalNode.id,
      },
    });
    ids.capitalId = capital.id;
    log(CHECK, `Capital profile: ${capital.id}`);
    passed++;

    // ─── Step 5: Generate matches ────────────────────────────
    console.log("\nStep 5: Matching engine");

    const { generateMatchesForProject } = await import("../lib/modules/matching/engine");
    const matches = await generateMatchesForProject(project.id, user.id);
    if (matches.length > 0) {
      log(CHECK, `Generated ${matches.length} match(es), top score: ${matches[0].score}`);
      passed++;
    } else {
      log(FAIL, "No matches generated");
      failed++;
    }

    const matchRecord = await prisma.match.findFirst({
      where: { projectId: project.id },
      orderBy: { score: "desc" },
    });

    if (matchRecord) {
      log(CHECK, `Match stored: ${matchRecord.id} (score: ${matchRecord.score})`);
      passed++;

      // Express interest
      const { expressInterest } = await import("../lib/modules/matching/engine");
      const interested = await expressInterest(matchRecord.id, user.id);
      if (interested?.status === "INTEREST_EXPRESSED") {
        log(CHECK, "Interest expressed");
        passed++;
      } else {
        log(FAIL, "Interest expression failed");
        failed++;
      }
    }

    // ─── Step 6: Create deal ─────────────────────────────────
    console.log("\nStep 6: Create deal");

    const deal = await prisma.deal.create({
      data: {
        title: "E2E Test Deal",
        stage: "SOURCED",
        projectId: project.id,
        capitalId: capital.id,
        leadNodeId: leadNode.id,
      },
    });
    ids.dealId = deal.id;
    log(CHECK, `Deal: ${deal.id}`);
    passed++;

    // Add participant
    await prisma.dealParticipant.create({
      data: {
        dealId: deal.id,
        nodeId: capitalNode.id,
        role: "capital_provider",
      },
    });
    log(CHECK, "Capital node added as participant");

    // Convert match to deal
    if (matchRecord) {
      const { convertMatchToDeal } = await import("../lib/modules/matching/engine");
      await convertMatchToDeal(matchRecord.id, deal.id, user.id);
      const updated = await prisma.match.findUnique({ where: { id: matchRecord.id } });
      if (updated?.status === "CONVERTED_TO_DEAL") {
        log(CHECK, "Match converted to deal");
        passed++;
      }
    }

    // ─── Step 7: Create evidence ─────────────────────────────
    console.log("\nStep 7: Evidence");

    const evidence = await prisma.evidence.create({
      data: {
        type: "CONTRACT",
        title: "E2E Test Contract",
        summary: "Signed investment agreement",
        dealId: deal.id,
        projectId: project.id,
        nodeId: leadNode.id,
        reviewStatus: "APPROVED",
        reviewedAt: new Date(),
      },
    });
    log(CHECK, `Evidence created: ${evidence.id}`);

    await prisma.evidence.create({
      data: {
        type: "TRANSFER",
        title: "E2E Wire Transfer",
        summary: "Fund transfer confirmation",
        dealId: deal.id,
        projectId: project.id,
        nodeId: capitalNode.id,
        reviewStatus: "APPROVED",
        reviewedAt: new Date(),
      },
    });
    log(CHECK, "Transfer evidence created");
    passed++;

    // Check completeness
    const { checkCompleteness, assembleEvidencePacket } = await import("../lib/modules/evidence/assembly");
    const completeness = await checkCompleteness(deal.id);
    if (completeness.complete) {
      log(CHECK, `Evidence complete: ${completeness.present.length} types, score ${completeness.score}%`);
      passed++;
    } else {
      log(FAIL, `Evidence incomplete, missing: ${completeness.missing.join(", ")}`);
      failed++;
    }

    // Assemble packet
    const packet = await assembleEvidencePacket(deal.id, project.id);
    log(CHECK, `Evidence packet: ${packet.packetId} (${packet.itemCount} items)`);
    passed++;

    // ─── Step 8: PoB Attribution ─────────────────────────────
    console.log("\nStep 8: PoB Attribution");

    const { calculateAttribution } = await import("../lib/modules/pob/attribution");
    const attribution = await calculateAttribution(deal.id);
    if (attribution) {
      log(CHECK, `PoB: ${attribution.pobId} (score: ${attribution.finalScore})`);
      log(INFO, `  Lead: ${attribution.attributions[0]?.shareBps / 100}%`);
      for (const a of attribution.attributions.slice(1)) {
        log(INFO, `  Collab: ${a.shareBps / 100}% (evidence: ${a.evidenceCount})`);
      }

      const totalBps = attribution.attributions.reduce((s, a) => s + a.shareBps, 0);
      if (totalBps === 10000) {
        log(CHECK, `Attribution sums to 100% (${totalBps} bps)`);
        passed++;
      } else {
        log(FAIL, `Attribution sum ${totalBps} ≠ 10000`);
        failed++;
      }
      passed++;
    } else {
      log(FAIL, "Attribution calculation failed");
      failed++;
    }

    // ─── Step 9: Settlement ──────────────────────────────────
    console.log("\nStep 9: Settlement");

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const cycle = await prisma.settlementCycle.create({
      data: {
        kind: "MONTH",
        status: "DRAFT",
        startAt: monthStart,
        endAt: monthEnd,
        pool: 100000,
      },
    });
    log(CHECK, `Settlement cycle: ${cycle.id}`);

    const { calculateSettlementForCycle } = await import("../lib/modules/settlement/calculator");
    const settlement = await calculateSettlementForCycle(cycle.id);
    log(CHECK, `Settlement calculated: ${settlement.lineCount} lines`);
    log(INFO, `  Pool: $${settlement.pool.toLocaleString()}`);
    log(INFO, `  Fee: $${settlement.platformFee.toLocaleString()} (5%)`);
    log(INFO, `  Distributable: $${settlement.distributablePool.toLocaleString()}`);
    for (const line of settlement.lines) {
      log(INFO, `  Node ${line.nodeId.slice(0, 8)}...: $${line.allocation.toLocaleString()} (${line.pobCount} PoB)`);
    }
    passed++;

    // Cleanup settlement
    await prisma.settlementLine.deleteMany({ where: { cycleId: cycle.id } });
    await prisma.settlementCycle.delete({ where: { id: cycle.id } });

    // ─── Summary ─────────────────────────────────────────────
    console.log("\n══════════════════════════════════════════════════════");
    console.log(`  Results: ${passed} passed, ${failed} failed`);
    console.log("══════════════════════════════════════════════════════\n");

    if (failed > 0) {
      process.exitCode = 1;
    }
  } finally {
    // Cleanup test data
    console.log("Cleaning up test data...");
    try {
      if (ids.dealId) {
        await prisma.attribution.deleteMany({ where: { pob: { dealId: ids.dealId } } });
        await prisma.poBRecord.deleteMany({ where: { dealId: ids.dealId } });
        await prisma.evidence.deleteMany({ where: { dealId: ids.dealId } });
        await prisma.dealParticipant.deleteMany({ where: { dealId: ids.dealId } });
        await prisma.deal.delete({ where: { id: ids.dealId } }).catch((e) => console.error("[e2e cleanup]", e));
      }
      if (ids.projectId) {
        await prisma.match.deleteMany({ where: { projectId: ids.projectId } });
        await prisma.project.delete({ where: { id: ids.projectId } }).catch((e) => console.error("[e2e cleanup]", e));
      }
      if (ids.capitalId) await prisma.capitalProfile.delete({ where: { id: ids.capitalId } }).catch((e) => console.error("[e2e cleanup]", e));
      if (ids.nodeLeadId) await prisma.node.delete({ where: { id: ids.nodeLeadId } }).catch((e) => console.error("[e2e cleanup]", e));
      if (ids.nodeCapitalId) await prisma.node.delete({ where: { id: ids.nodeCapitalId } }).catch((e) => console.error("[e2e cleanup]", e));
      if (ids.userId) await prisma.user.delete({ where: { id: ids.userId } }).catch((e) => console.error("[e2e cleanup]", e));
      console.log("Cleanup complete.\n");
    } catch (e) {
      console.error("Cleanup error:", e);
    }

    await prisma.$disconnect();
  }
}

main();
