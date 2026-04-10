/**
 * @wcn/reputation — Event Handlers
 */
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";
import { getPrisma } from "@/lib/prisma";
import { recalculateNodeReputation } from "./calculator";
import { evaluateBadges } from "./badges";

let _initialized = false;

export function initReputationHandlers(): void {
  if (_initialized) return;
  _initialized = true;

  for (const evt of [Events.POB_CREATED, Events.DEAL_CLOSED, Events.EVIDENCE_APPROVED]) {
    eventBus.on(evt, async (payload: any) => {
      const nodeId = payload.nodeId;
      if (!nodeId) return;
      try {
        const prisma = getPrisma();
        await recalculateNodeReputation(prisma, nodeId);
        await evaluateBadges(prisma, nodeId);
      } catch (e) {
        console.error("[Reputation] Recalculation failed:", e);
      }
    });
  }
}
