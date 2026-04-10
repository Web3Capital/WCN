/**
 * @wcn/pob — Event Handlers
 */
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";
import type { EvidenceApprovedEvent, PoBCreatedEvent, PoBDisputeRaisedEvent } from "@/lib/core/event-types";
import { notifyMany } from "@/lib/notifications";
import { getPrisma } from "@/lib/prisma";
import { calculateAttribution } from "./attribution";
import { assessPoBRisk } from "@/lib/modules/risk/anti-gaming";

let _initialized = false;

export function initPoBHandlers(): void {
  if (_initialized) return;
  _initialized = true;

  eventBus.on<EvidenceApprovedEvent>(Events.EVIDENCE_APPROVED, async (payload) => {
    if (!payload.dealId) return;
    try {
      await calculateAttribution(payload.dealId);
    } catch (e) {
      console.error("[PoB] Attribution calc failed for deal", payload.dealId, e);
    }
  });

  eventBus.on<PoBCreatedEvent>(Events.POB_CREATED, async (payload) => {
    if (!payload.dealId || !payload.nodeId) return;
    try {
      const risk = await assessPoBRisk(payload.dealId, payload.nodeId);
      if (risk.flags.length > 0) {
        const prisma = getPrisma();
        await prisma.riskFlag.create({
          data: {
            entityType: "PoB",
            entityId: payload.pobId,
            severity: risk.level,
            reason: risk.flags.map((f) => `[${f.rule}] ${f.message}`).join("; "),
          },
        }).catch(() => {});
      }
    } catch (e) {
      console.error("[AntiGaming] PoB scan failed", payload.pobId, e);
    }
  });

  eventBus.on<PoBCreatedEvent>(Events.POB_CREATED, async (payload) => {
    const prisma = getPrisma();
    const nodeIds = payload.attributions.map((a) => a.nodeId);
    if (!nodeIds.length) return;
    const nodes = await prisma.node.findMany({
      where: { id: { in: nodeIds } },
      select: { ownerUserId: true },
    });
    const userIds = nodes
      .map((n) => n.ownerUserId)
      .filter((id): id is string => !!id);
    if (userIds.length) {
      await notifyMany(userIds, {
        type: "GENERAL",
        title: "New PoB record — you have attribution",
        entityType: "PoB",
        entityId: payload.pobId,
      });
    }
  });

  eventBus.on<PoBDisputeRaisedEvent>(Events.POB_DISPUTE_RAISED, async (payload) => {
    const prisma = getPrisma();
    await prisma.poBRecord.update({
      where: { id: payload.pobId },
      data: { pobEventStatus: "FROZEN", frozenAt: new Date(), frozenReason: `Dispute #${payload.disputeId}` },
    }).catch(() => {});

    const pob = await prisma.poBRecord.findUnique({
      where: { id: payload.pobId },
      select: { nodeId: true, attributions: { select: { nodeId: true } } },
    });
    if (!pob) return;
    const nodeIds = [pob.nodeId, ...pob.attributions.map((a) => a.nodeId)].filter((id): id is string => !!id);
    const uniqueNodeIds = [...new Set(nodeIds)];
    const nodes = await prisma.node.findMany({
      where: { id: { in: uniqueNodeIds } },
      select: { ownerUserId: true },
    });
    const userIds = nodes.map((n) => n.ownerUserId).filter((id): id is string => !!id);
    if (userIds.length) {
      await notifyMany(userIds, {
        type: "GENERAL",
        title: "PoB dispute raised — record frozen",
        entityType: "Dispute",
        entityId: payload.disputeId,
      });
    }
  });
}
