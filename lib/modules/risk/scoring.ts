import type { PrismaClient } from "@prisma/client";

export type RiskScoreResult = {
  entityType: string;
  entityId: string;
  score: number;
  factors: { name: string; weight: number; value: number }[];
};

export async function calculateEntityRiskScore(
  prisma: PrismaClient,
  entityType: string,
  entityId: string,
): Promise<RiskScoreResult> {
  const factors: { name: string; weight: number; value: number }[] = [];

  const activeFlags = await prisma.riskFlag.count({
    where: { entityType, entityId, resolvedAt: null },
  });
  factors.push({ name: "active_flags", weight: 30, value: Math.min(activeFlags, 5) / 5 });

  const criticalFlags = await prisma.riskFlag.count({
    where: { entityType, entityId, resolvedAt: null, severity: { in: ["CRITICAL", "HIGH"] } },
  });
  factors.push({ name: "critical_flags", weight: 25, value: Math.min(criticalFlags, 3) / 3 });

  const disputes = await prisma.dispute.count({
    where: { targetId: entityId },
  });
  factors.push({ name: "dispute_history", weight: 20, value: Math.min(disputes, 10) / 10 });

  const resolvedFlags = await prisma.riskFlag.count({
    where: { entityType, entityId, resolvedAt: { not: null } },
  });
  const totalFlags = activeFlags + resolvedFlags;
  const resolutionRate = totalFlags > 0 ? resolvedFlags / totalFlags : 1;
  factors.push({ name: "resolution_rate", weight: 15, value: 1 - resolutionRate });

  factors.push({ name: "compliance_gaps", weight: 10, value: 0 });

  const score = Math.round(
    factors.reduce((s, f) => s + f.weight * f.value, 0),
  );

  return { entityType, entityId, score, factors };
}

export async function calculateNetworkRiskScore(
  prisma: PrismaClient,
): Promise<{ score: number; breakdown: Record<string, number> }> {
  const [openFlags, criticalFlags, openDisputes, totalNodes] = await Promise.all([
    prisma.riskFlag.count({ where: { resolvedAt: null } }),
    prisma.riskFlag.count({ where: { resolvedAt: null, severity: { in: ["CRITICAL", "HIGH"] } } }),
    prisma.dispute.count({ where: { status: "OPEN" } }),
    prisma.node.count({ where: { status: "LIVE" } }),
  ]);

  const flagRatio = totalNodes > 0 ? openFlags / totalNodes : 0;
  const criticalRatio = totalNodes > 0 ? criticalFlags / totalNodes : 0;
  const disputeRatio = totalNodes > 0 ? openDisputes / totalNodes : 0;

  const score = Math.round(
    (flagRatio * 40 + criticalRatio * 35 + disputeRatio * 25) * 100,
  );

  return {
    score: Math.min(score, 100),
    breakdown: { openFlags, criticalFlags, openDisputes, totalNodes },
  };
}
