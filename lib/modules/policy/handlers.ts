/**
 * @wcn/policy — Event Handlers
 *
 * Listens to governance-related events and triggers policy evaluations.
 */

import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";

export function initPolicyHandlers(): void {
  // Log policy lifecycle events for audit
  eventBus.on(Events.POLICY_CREATED, async (payload) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[Policy] Created: ${payload.name} (scope=${payload.scope})`);
    }
  });

  eventBus.on(Events.POLICY_EVALUATED, async (payload) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[Policy] Evaluated: ${payload.policyId} → ${payload.result} for ${payload.entityType}:${payload.entityId}`);
    }
  });
}
