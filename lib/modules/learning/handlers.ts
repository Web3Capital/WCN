/**
 * @wcn/learning — Event Handlers
 *
 * White Paper §05: Learning Loop
 * Captures learning signals from key system events.
 */

import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";
import { captureSignal, SignalTypes } from "./collector";

export function initLearningHandlers(): void {
  // Match conversion/decline → capture match quality feedback
  eventBus.on(Events.MATCH_CONVERTED, async (payload) => {
    await captureSignal({
      signalType: SignalTypes.MATCH_FEEDBACK,
      sourceEvent: Events.MATCH_CONVERTED,
      entityType: "Match",
      entityId: payload.matchId,
      payload: { projectId: payload.projectId, capitalProfileId: payload.capitalProfileId, dealId: payload.dealId, outcome: "converted" },
    }).catch((err) => console.error("[Learning] Failed to capture match conversion signal", err));
  });

  eventBus.on(Events.MATCH_DECLINED, async (payload) => {
    await captureSignal({
      signalType: SignalTypes.MATCH_FEEDBACK,
      sourceEvent: Events.MATCH_DECLINED,
      entityType: "Match",
      entityId: payload.matchId,
      payload: { projectId: payload.projectId, capitalProfileId: payload.capitalProfileId, outcome: "declined" },
    }).catch((err) => console.error("[Learning] Failed to capture match decline signal", err));
  });

  // PoB creation → capture score distribution pattern
  eventBus.on(Events.POB_CREATED, async (payload) => {
    await captureSignal({
      signalType: SignalTypes.SCORE_ADJUSTMENT,
      sourceEvent: Events.POB_CREATED,
      entityType: "PoB",
      entityId: payload.pobId,
      payload: { score: payload.score, attributionCount: payload.attributions.length },
    }).catch((err) => console.error("[Learning] Failed to capture PoB signal", err));
  });

  // Policy evaluation failure → capture policy override potential
  eventBus.on(Events.POLICY_EVALUATED, async (payload) => {
    if (payload.result === "FAIL") {
      await captureSignal({
        signalType: SignalTypes.POLICY_OVERRIDE,
        sourceEvent: Events.POLICY_EVALUATED,
        entityType: payload.entityType,
        entityId: payload.entityId,
        payload: { policyId: payload.policyId, result: payload.result },
      }).catch((err) => console.error("[Learning] Failed to capture policy evaluation signal", err));
    }
  });

  // Dispute raised → capture attribution dispute signal
  eventBus.on(Events.POB_DISPUTE_RAISED, async (payload) => {
    await captureSignal({
      signalType: SignalTypes.ATTRIBUTION_DISPUTE,
      sourceEvent: Events.POB_DISPUTE_RAISED,
      entityType: "Dispute",
      entityId: payload.disputeId,
      payload: { pobId: payload.pobId, raisedBy: payload.raisedBy },
    }).catch((err) => console.error("[Learning] Failed to capture dispute signal", err));
  });
}
