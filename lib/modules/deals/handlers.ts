/**
 * @wcn/deals — Event Handlers
 * Reactions this module owns when its events fire.
 */
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";
import type { DealCreatedEvent, DealStageChangedEvent, DealClosedEvent } from "@/lib/core/event-types";
import { createNotification, notifyMany } from "@/lib/notifications";
import { getPrisma } from "@/lib/prisma";

let _initialized = false;

export function initDealHandlers(): void {
  if (_initialized) return;
  _initialized = true;

  eventBus.on<DealCreatedEvent>(Events.DEAL_CREATED, async (payload) => {
    const prisma = getPrisma();
    const node = await prisma.node.findUnique({
      where: { id: payload.leadNodeId },
      select: { ownerUserId: true },
    });
    if (node?.ownerUserId) {
      await createNotification({
        userId: node.ownerUserId,
        type: "DEAL_STAGE_CHANGE",
        title: `New deal created: ${payload.title}`,
        entityType: "Deal",
        entityId: payload.dealId,
      });
    }
  });

  eventBus.on<DealStageChangedEvent>(Events.DEAL_STAGE_CHANGED, async (payload) => {
    const prisma = getPrisma();
    const participants = await prisma.dealParticipant.findMany({
      where: { dealId: payload.dealId },
      select: { node: { select: { ownerUserId: true } } },
    });
    const userIds = participants
      .map((p) => p.node?.ownerUserId)
      .filter((id): id is string => !!id);
    if (userIds.length) {
      await notifyMany(userIds, {
        type: "DEAL_STAGE_CHANGE",
        title: `Deal moved to ${payload.newStage}`,
        entityType: "Deal",
        entityId: payload.dealId,
      });
    }
  });

  eventBus.on<DealClosedEvent>(Events.DEAL_CLOSED, async (payload) => {
    if (payload.outcome !== "FUNDED") return;
    const prisma = getPrisma();
    const existing = await prisma.evidence.findFirst({
      where: { dealId: payload.dealId, title: "Deal Close Evidence" },
    });
    if (!existing) {
      await prisma.evidence.create({
        data: {
          type: "OTHER",
          title: "Deal Close Evidence",
          summary: `Auto-created evidence packet for deal ${payload.dealId}`,
          dealId: payload.dealId,
          projectId: payload.projectId ?? null,
          reviewStatus: "DRAFT",
        },
      });
    }
  });

  eventBus.on<DealClosedEvent>(Events.DEAL_CLOSED, async (payload) => {
    if (!payload.projectId || payload.outcome !== "FUNDED") return;
    const prisma = getPrisma();
    await prisma.project.update({
      where: { id: payload.projectId },
      data: { status: "ARCHIVED" },
    }).catch((err) => console.error("[Deals] project archive failed", err));
  });
}
