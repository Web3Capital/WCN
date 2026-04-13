/**
 * @wcn/settlement — Settlement Calculation Engine
 *
 * Aggregates PoB scores within a settlement cycle window,
 * deducts platform fees, and produces per-node line items.
 *
 * Flow:
 * 1. Gather all confirmed PoBRecords in the cycle date range
 * 2. Aggregate per-node: total PoB score, PoB count
 * 3. Compute network-wide total score
 * 4. Distribute cycle pool proportionally
 * 5. Apply fee deduction (configurable)
 * 6. Upsert SettlementLine records
 */

import { getPrisma } from "@/lib/prisma";

// ─── Configuration ──────────────────────────────────────────────

const PLATFORM_FEE_BPS = 500; // 5% platform fee

interface NodeAggregation {
  nodeId: string;
  totalScore: number;
  pobCount: number;
}

export interface SettlementCalculationResult {
  cycleId: string;
  pool: number;
  networkScore: number;
  platformFee: number;
  distributablePool: number;
  lineCount: number;
  lines: Array<{
    nodeId: string;
    scoreTotal: number;
    allocation: number;
    pobCount: number;
  }>;
}

/**
 * Calculate settlement line items for a given cycle.
 * Idempotent — re-running overwrites existing lines.
 */
export async function calculateSettlementForCycle(
  cycleId: string,
): Promise<SettlementCalculationResult> {
  const prisma = getPrisma();

  const cycle = await prisma.settlementCycle.findUnique({
    where: { id: cycleId },
  });
  if (!cycle) throw new Error(`Settlement cycle ${cycleId} not found`);

  const NON_CALCULABLE = new Set(["LOCKED", "EXPORTED", "FINALIZED"]);
  if (NON_CALCULABLE.has(cycle.status)) {
    throw new Error(`Cannot recalculate cycle in ${cycle.status} state`);
  }

  const pobs = await prisma.poBRecord.findMany({
    where: {
      pobEventStatus: "EFFECTIVE",
      status: "APPROVED",
      createdAt: {
        gte: cycle.startAt,
        lte: cycle.endAt,
      },
    },
    include: {
      attributions: {
        select: { nodeId: true, shareBps: true },
      },
    },
  });

  const nodeMap = new Map<string, NodeAggregation>();

  for (const pob of pobs) {
    if (pob.attributions.length === 0) continue;

    for (const attr of pob.attributions) {
      const existing = nodeMap.get(attr.nodeId) ?? {
        nodeId: attr.nodeId,
        totalScore: 0,
        pobCount: 0,
      };
      const nodeScore = (pob.score * attr.shareBps) / 10000;
      existing.totalScore += nodeScore;
      existing.pobCount += 1;
      nodeMap.set(attr.nodeId, existing);
    }
  }

  const networkScore = [...nodeMap.values()].reduce((sum, n) => sum + n.totalScore, 0);
  const platformFee = Math.round((cycle.pool * PLATFORM_FEE_BPS) / 10000 * 100) / 100;
  const distributablePool = cycle.pool - platformFee;

  const lines: SettlementCalculationResult["lines"] = [];

  for (const agg of nodeMap.values()) {
    const share = networkScore > 0 ? agg.totalScore / networkScore : 0;
    const allocation = Math.round(distributablePool * share * 100) / 100;

    lines.push({
      nodeId: agg.nodeId,
      scoreTotal: Math.round(agg.totalScore * 100) / 100,
      allocation,
      pobCount: agg.pobCount,
    });
  }

  lines.sort((a, b) => b.allocation - a.allocation);

  await prisma.$transaction(async (tx) => {
    await tx.settlementLine.deleteMany({ where: { cycleId } });

    if (lines.length > 0) {
      await tx.settlementLine.createMany({
        data: lines.map((l) => ({
          cycleId,
          nodeId: l.nodeId,
          scoreTotal: l.scoreTotal,
          allocation: l.allocation,
          pobCount: l.pobCount,
        })),
      });
    }

    await tx.settlementCycle.update({
      where: { id: cycleId },
      data: { reconciledAt: new Date() },
    });
  });

  return {
    cycleId,
    pool: cycle.pool,
    networkScore: Math.round(networkScore * 100) / 100,
    platformFee,
    distributablePool,
    lineCount: lines.length,
    lines,
  };
}

/**
 * Get the current settlement summary for a cycle.
 */
export async function getSettlementSummary(cycleId: string) {
  const prisma = getPrisma();

  const [cycle, lines] = await Promise.all([
    prisma.settlementCycle.findUnique({ where: { id: cycleId } }),
    prisma.settlementLine.findMany({
      where: { cycleId },
      include: { node: { select: { id: true, name: true, type: true } } },
      orderBy: { allocation: "desc" },
    }),
  ]);

  if (!cycle) return null;

  const totalAllocated = lines.reduce((sum, l) => sum + l.allocation, 0);
  const totalPoB = lines.reduce((sum, l) => sum + l.pobCount, 0);

  return {
    cycle,
    lines,
    stats: {
      nodeCount: lines.length,
      totalAllocated: Math.round(totalAllocated * 100) / 100,
      totalPoB,
      averageAllocation: lines.length > 0 ? Math.round((totalAllocated / lines.length) * 100) / 100 : 0,
    },
  };
}
