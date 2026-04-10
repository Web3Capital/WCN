import type { PrismaClient } from "@prisma/client";

export type ReputationComponents = {
  pobScore: number;
  taskCompletionRate: number;
  evidenceQuality: number;
  disputeRate: number;
  slaCompliance: number;
  tenureMonths: number;
  dealCount: number;
};

export type TierName = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND";

const TIER_THRESHOLDS: [number, TierName][] = [
  [800, "DIAMOND"],
  [600, "PLATINUM"],
  [400, "GOLD"],
  [200, "SILVER"],
  [0, "BRONZE"],
];

const DECAY_RATE_PER_MONTH = 0.05;

export function determineTier(score: number): TierName {
  for (const [threshold, tier] of TIER_THRESHOLDS) {
    if (score >= threshold) return tier;
  }
  return "BRONZE";
}

export function calculateCompositeScore(c: ReputationComponents): number {
  const raw =
    c.pobScore * 0.3 +
    c.taskCompletionRate * 200 * 0.15 +
    c.evidenceQuality * 200 * 0.15 +
    (1 - c.disputeRate) * 200 * 0.1 +
    c.slaCompliance * 200 * 0.1 +
    Math.min(c.tenureMonths, 24) * (100 / 24) * 0.1 +
    Math.min(c.dealCount, 20) * (200 / 20) * 0.1;

  return Math.round(Math.min(raw, 1000) * 100) / 100;
}

export function applyDecay(score: number, monthsInactive: number): number {
  if (monthsInactive <= 0) return score;
  const factor = Math.pow(1 - DECAY_RATE_PER_MONTH, monthsInactive);
  return Math.round(score * factor * 100) / 100;
}

export async function recalculateNodeReputation(
  prisma: PrismaClient,
  nodeId: string,
): Promise<{ score: number; tier: TierName; components: ReputationComponents }> {
  const [node, pobRecords, tasks, evidences, disputes, deals] = await Promise.all([
    prisma.node.findUnique({ where: { id: nodeId }, select: { createdAt: true } }),
    prisma.poBRecord.findMany({ where: { nodeId }, select: { score: true } }),
    prisma.task.findMany({
      where: { assignments: { some: { nodeId } } },
      select: { status: true },
    }),
    prisma.evidence.findMany({
      where: { nodeId },
      select: { reviewStatus: true },
    }),
    prisma.dispute.findMany({
      where: { pob: { nodeId } },
      select: { id: true },
    }),
    prisma.deal.findMany({
      where: { OR: [{ leadNodeId: nodeId }, { participants: { some: { nodeId } } }] },
      select: { stage: true },
    }),
  ]);

  const tenureMonths = node
    ? Math.floor((Date.now() - node.createdAt.getTime()) / (30 * 24 * 60 * 60 * 1000))
    : 0;

  const totalPobScore = pobRecords.reduce((sum, p) => sum + (p.score ?? 0), 0);
  const completedTasks = tasks.filter((t) => t.status === "ACCEPTED" || t.status === "CLOSED").length;
  const taskCompletionRate = tasks.length > 0 ? completedTasks / tasks.length : 0;
  const approvedEvidence = evidences.filter((e) => e.reviewStatus === "APPROVED").length;
  const evidenceQuality = evidences.length > 0 ? approvedEvidence / evidences.length : 0;
  const disputeRate = deals.length > 0 ? disputes.length / deals.length : 0;
  const fundedDeals = deals.filter((d) => d.stage === "FUNDED").length;

  const components: ReputationComponents = {
    pobScore: totalPobScore,
    taskCompletionRate,
    evidenceQuality,
    disputeRate: Math.min(disputeRate, 1),
    slaCompliance: 1,
    tenureMonths,
    dealCount: fundedDeals,
  };

  const score = calculateCompositeScore(components);
  const tier = determineTier(score);

  await prisma.$transaction([
    prisma.reputationScore.upsert({
      where: { nodeId },
      create: { nodeId, score, tier, components: components as any, calculatedAt: new Date() },
      update: { score, tier, components: components as any, calculatedAt: new Date() },
    }),
    prisma.reputationHistory.create({
      data: { nodeId, score, tier, snapshotAt: new Date() },
    }),
  ]);

  return { score, tier, components };
}
