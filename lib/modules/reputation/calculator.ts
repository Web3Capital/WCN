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

// ─── White Paper §18: v3 Five-Dimension Model ─────────────────
// Score(node) = α*Resource + β*Execution + γ*Trust + δ*Stability + ε*Contribution

export type V3ReputationComponents = {
  /** Quality of real resources: funds, channels, licenses, geo access (0-200) */
  resource: number;
  /** Task completion rate, SLA attainment, conversion rate (0-200) */
  execution: number;
  /** Evidence completeness, violation rate, dispute outcomes, feedback (0-200) */
  trust: number;
  /** Tenure, continuous contribution, cooperation repurchase (0-200) */
  stability: number;
  /** Verified PoB count, weight, settlement-linked amount (0-200) */
  contribution: number;
};

/** Configurable weights (White Paper: α through ε) */
export const V3_WEIGHTS = {
  alpha: 0.20,   // Resource
  beta: 0.25,    // Execution
  gamma: 0.25,   // Trust
  delta: 0.15,   // Stability
  epsilon: 0.15, // Contribution
};

export function calculateV3Score(c: V3ReputationComponents): number {
  const raw =
    c.resource * V3_WEIGHTS.alpha +
    c.execution * V3_WEIGHTS.beta +
    c.trust * V3_WEIGHTS.gamma +
    c.stability * V3_WEIGHTS.delta +
    c.contribution * V3_WEIGHTS.epsilon;

  return Math.round(Math.min(raw, 1000) * 100) / 100;
}

/**
 * Derive v3 dimensions from existing component data.
 * Maps legacy 7-component model to white paper 5-dimension model.
 */
export function deriveV3Components(legacy: ReputationComponents): V3ReputationComponents {
  // Resource: proxy from deal count & tenure (higher deal volume = better resources)
  const resource = Math.min(legacy.dealCount * 10 + legacy.tenureMonths * 2, 200);

  // Execution: task completion + SLA compliance
  const execution = Math.min(
    legacy.taskCompletionRate * 100 + legacy.slaCompliance * 100,
    200,
  );

  // Trust: evidence quality + inverse dispute rate
  const trust = Math.min(
    legacy.evidenceQuality * 100 + (1 - legacy.disputeRate) * 100,
    200,
  );

  // Stability: tenure-based (max 24 months = 200)
  const stability = Math.min(legacy.tenureMonths * (200 / 24), 200);

  // Contribution: direct from PoB scores (normalized to 0-200 range)
  const contribution = Math.min(legacy.pobScore / 5, 200);

  return { resource, execution, trust, stability, contribution };
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
  const [node, pobRecords, tasks, evidences, disputes, deals, latestActivity] = await Promise.all([
    prisma.node.findUnique({ where: { id: nodeId }, select: { createdAt: true } }),
    prisma.poBRecord.findMany({ where: { nodeId }, select: { score: true } }),
    prisma.task.findMany({
      where: { assignments: { some: { nodeId } } },
      select: { status: true, dueAt: true, updatedAt: true },
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
    prisma.poBRecord.findFirst({
      where: { nodeId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
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

  const tasksWithDue = tasks.filter((t) => t.dueAt && t.updatedAt);
  const onTimeTasks = tasksWithDue.filter((t) => t.updatedAt! <= t.dueAt!).length;
  const slaCompliance = tasksWithDue.length > 0 ? onTimeTasks / tasksWithDue.length : 1;

  const components: ReputationComponents = {
    pobScore: totalPobScore,
    taskCompletionRate,
    evidenceQuality,
    disputeRate: Math.min(disputeRate, 1),
    slaCompliance,
    tenureMonths,
    dealCount: fundedDeals,
  };

  let score = calculateCompositeScore(components);
  const tier = determineTier(score);

  if (latestActivity) {
    const monthsSinceActivity = Math.floor(
      (Date.now() - latestActivity.createdAt.getTime()) / (30 * 24 * 60 * 60 * 1000),
    );
    if (monthsSinceActivity > 3) {
      score = applyDecay(score, monthsSinceActivity - 3);
    }
  }

  // Compute v3 five-dimension scores
  const v3Components = deriveV3Components(components);
  const v3Score = calculateV3Score(v3Components);

  await prisma.$transaction([
    prisma.reputationScore.upsert({
      where: { nodeId },
      create: {
        nodeId, score, tier, components: components as any, calculatedAt: new Date(),
        resource: v3Components.resource,
        execution: v3Components.execution,
        trust: v3Components.trust,
        stability: v3Components.stability,
        contribution: v3Components.contribution,
        v3Score,
      },
      update: {
        score, tier, components: components as any, calculatedAt: new Date(),
        resource: v3Components.resource,
        execution: v3Components.execution,
        trust: v3Components.trust,
        stability: v3Components.stability,
        contribution: v3Components.contribution,
        v3Score,
      },
    }),
    prisma.reputationHistory.create({
      data: { nodeId, score, tier, snapshotAt: new Date() },
    }),
  ]);

  return { score, tier, components };
}
