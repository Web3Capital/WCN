/**
 * @wcn/risk — Anti-Gaming Engine v1
 *
 * Prevents fraudulent or collusive behavior in the WCN network:
 * 1. Self-dealing detection — same owner on both sides of a match
 * 2. Circular deal detection — lead node and capital node share ownership
 * 3. Velocity checks — max deals/PoB per node per rolling window
 * 4. Duplicate evidence detection — hash-based dedup
 *
 * Returns a risk assessment object; callers decide whether to block or flag.
 */

import { getPrisma } from "@/lib/prisma";

// ─── Configuration ──────────────────────────────────────────────

const MAX_DEALS_PER_NODE_PER_MONTH = 20;
const MAX_POB_PER_NODE_PER_MONTH = 50;
const VELOCITY_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// ─── Types ──────────────────────────────────────────────────────

export type RiskLevel = "CLEAR" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface RiskFlag {
  rule: string;
  level: RiskLevel;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface RiskAssessment {
  level: RiskLevel;
  flags: RiskFlag[];
  blocked: boolean;
}

function maxLevel(a: RiskLevel, b: RiskLevel): RiskLevel {
  const order: RiskLevel[] = ["CLEAR", "LOW", "MEDIUM", "HIGH", "CRITICAL"];
  return order[Math.max(order.indexOf(a), order.indexOf(b))];
}

function aggregate(flags: RiskFlag[]): RiskAssessment {
  let level: RiskLevel = "CLEAR";
  for (const f of flags) level = maxLevel(level, f.level);
  const blocked = level === "CRITICAL" || level === "HIGH";
  return { level, flags, blocked };
}

// ─── Self-Dealing Check ─────────────────────────────────────────

export async function checkSelfDealing(
  projectNodeId: string | null,
  capitalNodeId: string | null,
): Promise<RiskFlag | null> {
  if (!projectNodeId || !capitalNodeId) return null;
  if (projectNodeId === capitalNodeId) {
    return {
      rule: "SELF_DEALING",
      level: "CRITICAL",
      message: "Project and capital node are the same entity.",
      metadata: { projectNodeId, capitalNodeId },
    };
  }

  const prisma = getPrisma();
  const [projectNode, capitalNode] = await Promise.all([
    prisma.node.findUnique({ where: { id: projectNodeId }, select: { ownerUserId: true } }),
    prisma.node.findUnique({ where: { id: capitalNodeId }, select: { ownerUserId: true } }),
  ]);

  if (
    projectNode?.ownerUserId &&
    capitalNode?.ownerUserId &&
    projectNode.ownerUserId === capitalNode.ownerUserId
  ) {
    return {
      rule: "SAME_OWNER",
      level: "HIGH",
      message: "Project node and capital node share the same owner.",
      metadata: {
        projectNodeId,
        capitalNodeId,
        ownerUserId: projectNode.ownerUserId,
      },
    };
  }

  return null;
}

// ─── Circular Deal Check ────────────────────────────────────────

export async function checkCircularDeal(dealId: string): Promise<RiskFlag | null> {
  const prisma = getPrisma();
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: {
      leadNodeId: true,
      leadNode: { select: { ownerUserId: true } },
      participants: {
        select: {
          nodeId: true,
          node: { select: { ownerUserId: true } },
        },
      },
    },
  });
  if (!deal) return null;

  const leadOwner = deal.leadNode?.ownerUserId;
  if (!leadOwner) return null;

  for (const p of deal.participants) {
    if (p.node?.ownerUserId === leadOwner && p.nodeId !== deal.leadNodeId) {
      return {
        rule: "CIRCULAR_DEAL",
        level: "HIGH",
        message: "Deal participant shares ownership with the lead node.",
        metadata: {
          dealId,
          leadNodeId: deal.leadNodeId,
          conflictNodeId: p.nodeId,
          sharedOwner: leadOwner,
        },
      };
    }
  }

  return null;
}

// ─── Velocity Check ─────────────────────────────────────────────

export async function checkNodeVelocity(nodeId: string): Promise<RiskFlag[]> {
  const prisma = getPrisma();
  const since = new Date(Date.now() - VELOCITY_WINDOW_MS);
  const flags: RiskFlag[] = [];

  const [dealCount, pobCount] = await Promise.all([
    prisma.deal.count({
      where: { leadNodeId: nodeId, createdAt: { gte: since } },
    }),
    prisma.poBRecord.count({
      where: { nodeId, createdAt: { gte: since } },
    }),
  ]);

  if (dealCount > MAX_DEALS_PER_NODE_PER_MONTH) {
    flags.push({
      rule: "DEAL_VELOCITY",
      level: dealCount > MAX_DEALS_PER_NODE_PER_MONTH * 2 ? "HIGH" : "MEDIUM",
      message: `Node has ${dealCount} deals in 30 days (max: ${MAX_DEALS_PER_NODE_PER_MONTH}).`,
      metadata: { nodeId, dealCount, limit: MAX_DEALS_PER_NODE_PER_MONTH },
    });
  }

  if (pobCount > MAX_POB_PER_NODE_PER_MONTH) {
    flags.push({
      rule: "POB_VELOCITY",
      level: pobCount > MAX_POB_PER_NODE_PER_MONTH * 2 ? "HIGH" : "MEDIUM",
      message: `Node has ${pobCount} PoB records in 30 days (max: ${MAX_POB_PER_NODE_PER_MONTH}).`,
      metadata: { nodeId, pobCount, limit: MAX_POB_PER_NODE_PER_MONTH },
    });
  }

  return flags;
}

// ─── Duplicate Evidence Check ───────────────────────────────────

export async function checkDuplicateEvidence(
  hash: string | null,
  excludeId?: string,
): Promise<RiskFlag | null> {
  if (!hash) return null;

  const prisma = getPrisma();
  const existing = await prisma.evidence.findFirst({
    where: {
      hash,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true, dealId: true, nodeId: true },
  });

  if (existing) {
    return {
      rule: "DUPLICATE_EVIDENCE",
      level: "MEDIUM",
      message: "Evidence with identical hash already exists.",
      metadata: { hash, existingId: existing.id, existingDealId: existing.dealId },
    };
  }

  return null;
}

// ─── Full Match Risk Assessment ─────────────────────────────────

export async function assessMatchRisk(
  projectNodeId: string | null,
  capitalNodeId: string | null,
): Promise<RiskAssessment> {
  const flags: RiskFlag[] = [];

  const selfDeal = await checkSelfDealing(projectNodeId, capitalNodeId);
  if (selfDeal) flags.push(selfDeal);

  if (capitalNodeId) {
    const velocity = await checkNodeVelocity(capitalNodeId);
    flags.push(...velocity);
  }

  return aggregate(flags);
}

// ─── Full PoB Risk Assessment ───────────────────────────────────

export async function assessPoBRisk(dealId: string, leadNodeId: string): Promise<RiskAssessment> {
  const flags: RiskFlag[] = [];

  const circular = await checkCircularDeal(dealId);
  if (circular) flags.push(circular);

  const velocity = await checkNodeVelocity(leadNodeId);
  flags.push(...velocity);

  return aggregate(flags);
}
