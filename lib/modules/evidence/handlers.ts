/**
 * @wcn/evidence — Event Handlers
 */
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";
import type { DealClosedEvent, EvidenceApprovedEvent } from "@/lib/core/event-types";
import { createNotification } from "@/lib/notifications";
import { getPrisma } from "@/lib/prisma";
import { assembleEvidencePacket } from "./assembly";

let _initialized = false;

export function initEvidenceHandlers(): void {
  if (_initialized) return;
  _initialized = true;

  eventBus.on<DealClosedEvent>(Events.DEAL_CLOSED, async (payload) => {
    if (payload.outcome !== "FUNDED") return;
    try {
      await assembleEvidencePacket(payload.dealId, payload.projectId ?? undefined);
    } catch (e) {
      console.error("[Evidence] Assembly failed for deal", payload.dealId, e);
    }
  });

  eventBus.on<EvidenceApprovedEvent>(Events.EVIDENCE_APPROVED, async (payload) => {
    if (!payload.dealId) return;
    const prisma = getPrisma();
    const deal = await prisma.deal.findUnique({
      where: { id: payload.dealId },
      select: { leadNode: { select: { ownerUserId: true } } },
    });
    if (deal?.leadNode?.ownerUserId) {
      await createNotification({
        userId: deal.leadNode.ownerUserId,
        type: "EVIDENCE_SUBMITTED",
        title: "Evidence approved — PoB pending",
        entityType: "Evidence",
        entityId: payload.evidenceId,
      });
    }
  });
}
