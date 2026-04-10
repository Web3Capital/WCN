import type { PrismaClient } from "@prisma/client";

export interface BadgeDefinition {
  type: string;
  label: string;
  description: string;
  check: (ctx: BadgeContext) => boolean;
}

interface BadgeContext {
  dealCount: number;
  pobCount: number;
  disputeCount: number;
  score: number;
  tenureMonths: number;
  taskCompletionRate: number;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    type: "FIRST_DEAL",
    label: "First Deal",
    description: "Completed first funded deal",
    check: (ctx) => ctx.dealCount >= 1,
  },
  {
    type: "TEN_DEALS",
    label: "Deal Maker",
    description: "Completed 10 funded deals",
    check: (ctx) => ctx.dealCount >= 10,
  },
  {
    type: "TOP_SCORER",
    label: "Top Scorer",
    description: "Reputation score above 800",
    check: (ctx) => ctx.score >= 800,
  },
  {
    type: "ZERO_DISPUTES",
    label: "Clean Record",
    description: "No disputes raised after 5+ deals",
    check: (ctx) => ctx.dealCount >= 5 && ctx.disputeCount === 0,
  },
  {
    type: "CONSISTENT_PERFORMER",
    label: "Consistent Performer",
    description: "90%+ task completion over 50+ tasks",
    check: (ctx) => ctx.taskCompletionRate >= 0.9 && ctx.pobCount >= 50,
  },
  {
    type: "VETERAN",
    label: "Veteran",
    description: "Active for 12+ months",
    check: (ctx) => ctx.tenureMonths >= 12,
  },
  {
    type: "RISING_STAR",
    label: "Rising Star",
    description: "Score above 400 within 3 months",
    check: (ctx) => ctx.score >= 400 && ctx.tenureMonths <= 3,
  },
];

export async function evaluateBadges(
  prisma: PrismaClient,
  nodeId: string,
): Promise<string[]> {
  const [repScore, deals, pobs, disputes, tasks] = await Promise.all([
    prisma.reputationScore.findUnique({ where: { nodeId } }),
    prisma.deal.count({
      where: { stage: "FUNDED", OR: [{ leadNodeId: nodeId }, { participants: { some: { nodeId } } }] },
    }),
    prisma.poBRecord.count({ where: { nodeId } }),
    prisma.dispute.count({ where: { raisedById: nodeId } }),
    prisma.task.findMany({
      where: { assignments: { some: { nodeId } } },
      select: { status: true },
    }),
  ]);

  const node = await prisma.node.findUnique({ where: { id: nodeId }, select: { createdAt: true } });
  const tenureMonths = node
    ? Math.floor((Date.now() - node.createdAt.getTime()) / (30 * 24 * 60 * 60 * 1000))
    : 0;
  const completed = tasks.filter((t) => t.status === "COMPLETED").length;
  const taskCompletionRate = tasks.length > 0 ? completed / tasks.length : 0;

  const ctx: BadgeContext = {
    dealCount: deals,
    pobCount: pobs,
    disputeCount: disputes,
    score: repScore?.score ?? 0,
    tenureMonths,
    taskCompletionRate,
  };

  const awarded: string[] = [];

  for (const badge of BADGE_DEFINITIONS) {
    if (badge.check(ctx)) {
      await prisma.reputationBadge.upsert({
        where: { nodeId_badgeType: { nodeId, badgeType: badge.type } },
        create: { nodeId, badgeType: badge.type },
        update: {},
      });
      awarded.push(badge.type);
    }
  }

  return awarded;
}
