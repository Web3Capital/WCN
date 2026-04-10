/**
 * @wcn/pob — Proof of Business Attribution Engine
 *
 * Deterministic multi-role attribution algorithm:
 * 1. Identifies all participant nodes in a deal
 * 2. Assigns roles (LEAD vs COLLAB)
 * 3. Computes share basis points (1 bp = 0.01%)
 * 4. Creates PoBRecord + Attribution records
 *
 * Anti-gaming v1:
 * - Minimum evidence threshold per attribution claim
 * - Lead must have ≥1 approved evidence
 * - Max 70% to any single node
 * - Time-decay on stale deals (>90 days = 10% discount)
 */

import { getPrisma } from "@/lib/prisma";
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";
import type { PoBCreatedEvent } from "@/lib/core/event-types";
import { assessPoBRisk } from "@/lib/modules/risk/anti-gaming";

// ─── Configuration ──────────────────────────────────────────────

const LEAD_BASE_BPS = 4000; // 40%
const COLLAB_POOL_BPS = 6000; // 60% split among collaborators
const MAX_SINGLE_NODE_BPS = 7000; // 70% cap
const STALE_DEAL_DAYS = 90;
const STALE_DISCOUNT = 0.10;
const MIN_EVIDENCE_FOR_ATTRIBUTION = 0;

// ─── Types ──────────────────────────────────────────────────────

interface NodeAttribution {
  nodeId: string;
  role: "LEAD" | "COLLAB";
  shareBps: number;
  evidenceCount: number;
  evidenceIds: string[];
}

export interface AttributionResult {
  pobId: string;
  dealId: string;
  baseValue: number;
  qualityMult: number;
  timeMult: number;
  finalScore: number;
  attributions: NodeAttribution[];
}

// ─── Core: Calculate Attribution ────────────────────────────────

export async function calculateAttribution(dealId: string): Promise<AttributionResult | null> {
  const prisma = getPrisma();

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: {
      id: true,
      title: true,
      projectId: true,
      leadNodeId: true,
      closedAt: true,
      participants: {
        select: { nodeId: true, role: true },
      },
      evidence: {
        where: { reviewStatus: "APPROVED" },
        select: { id: true, nodeId: true },
      },
    },
  });
  if (!deal) return null;
  if (!deal.leadNodeId) return null;

  const risk = await assessPoBRisk(dealId, deal.leadNodeId);
  if (risk.blocked) {
    const prisma2 = getPrisma();
    await prisma2.riskFlag.create({
      data: {
        entityType: "Deal",
        entityId: dealId,
        severity: risk.level,
        reason: risk.flags.map((f) => `[${f.rule}] ${f.message}`).join("; "),
      },
    }).catch(() => {});
    return null;
  }

  const evidenceByNode = new Map<string, string[]>();
  for (const ev of deal.evidence) {
    if (!ev.nodeId) continue;
    const list = evidenceByNode.get(ev.nodeId) ?? [];
    list.push(ev.id);
    evidenceByNode.set(ev.nodeId, list);
  }

  const leadEvidence = evidenceByNode.get(deal.leadNodeId) ?? [];

  const collabNodes = deal.participants
    .filter((p) => p.nodeId && p.nodeId !== deal.leadNodeId)
    .map((p) => p.nodeId!)
    .filter((nodeId) => {
      const evCount = (evidenceByNode.get(nodeId) ?? []).length;
      return evCount >= MIN_EVIDENCE_FOR_ATTRIBUTION;
    });

  const attributions: NodeAttribution[] = [];

  let leadBps = LEAD_BASE_BPS;
  if (collabNodes.length === 0) {
    leadBps = 10000;
  }
  leadBps = Math.min(leadBps, MAX_SINGLE_NODE_BPS);

  attributions.push({
    nodeId: deal.leadNodeId,
    role: "LEAD",
    shareBps: leadBps,
    evidenceCount: leadEvidence.length,
    evidenceIds: leadEvidence,
  });

  if (collabNodes.length > 0) {
    const remainingBps = 10000 - leadBps;
    const collabEvTotal = collabNodes.reduce(
      (sum, nid) => sum + (evidenceByNode.get(nid) ?? []).length,
      0,
    );

    for (const nodeId of collabNodes) {
      const nodeEvidence = evidenceByNode.get(nodeId) ?? [];
      let share: number;
      if (collabEvTotal > 0) {
        share = Math.round((nodeEvidence.length / collabEvTotal) * remainingBps);
      } else {
        share = Math.round(remainingBps / collabNodes.length);
      }
      share = Math.min(share, MAX_SINGLE_NODE_BPS);

      attributions.push({
        nodeId,
        role: "COLLAB",
        shareBps: share,
        evidenceCount: nodeEvidence.length,
        evidenceIds: nodeEvidence,
      });
    }

    const totalBps = attributions.reduce((s, a) => s + a.shareBps, 0);
    if (totalBps !== 10000 && attributions.length > 0) {
      attributions[0].shareBps += 10000 - totalBps;
    }
  }

  // Base value derived from evidence volume — 1 approved evidence = 100 base points
  const baseValue = deal.evidence.length * 100;
  const qualityMult = leadEvidence.length > 0 ? 1.0 : 0.8;

  let timeMult = 1.0;
  if (deal.closedAt) {
    const daysSinceClose = (Date.now() - deal.closedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceClose > STALE_DEAL_DAYS) {
      timeMult = 1.0 - STALE_DISCOUNT;
    }
  }

  const finalScore = Math.round(baseValue * qualityMult * timeMult * 100) / 100;

  const existingPob = await prisma.poBRecord.findFirst({
    where: { dealId, businessType: "DEAL_CLOSE" },
    select: { id: true },
  });

  const pobId = await prisma.$transaction(async (tx) => {
    let id: string;

    if (existingPob) {
      await tx.poBRecord.update({
        where: { id: existingPob.id },
        data: {
          baseValue,
          qualityMult,
          timeMult,
          score: finalScore,
          version: { increment: 1 },
        },
      });
      await tx.attribution.deleteMany({ where: { pobId: existingPob.id } });
      id = existingPob.id;
    } else {
      const pob = await tx.poBRecord.create({
        data: {
          businessType: "DEAL_CLOSE",
          baseValue,
          qualityMult,
          timeMult,
          score: finalScore,
          dealId,
          projectId: deal.projectId,
          nodeId: deal.leadNodeId,
          leadNodeId: deal.leadNodeId,
          supportingNodeIds: collabNodes,
          pobEventStatus: "EFFECTIVE",
          status: "APPROVED",
        },
      });
      id = pob.id;
    }

    for (const attr of attributions) {
      await tx.attribution.create({
        data: {
          pobId: id,
          nodeId: attr.nodeId,
          role: attr.role,
          shareBps: attr.shareBps,
          evidenceRefs: attr.evidenceIds,
        },
      });
    }

    return id;
  });

  await eventBus.emit<PoBCreatedEvent>(Events.POB_CREATED, {
    pobId,
    dealId,
    projectId: deal.projectId ?? undefined,
    nodeId: deal.leadNodeId,
    score: finalScore,
    attributions: attributions.map((a) => ({
      nodeId: a.nodeId,
      percentage: a.shareBps / 100,
    })),
  });

  return { pobId, dealId, baseValue, qualityMult, timeMult, finalScore, attributions };
}

/**
 * Get attribution breakdown for a specific PoB record.
 */
export async function getAttributionBreakdown(pobId: string) {
  const prisma = getPrisma();
  return prisma.attribution.findMany({
    where: { pobId },
    include: { node: { select: { id: true, name: true, type: true } } },
    orderBy: { shareBps: "desc" },
  });
}
