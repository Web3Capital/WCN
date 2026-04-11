/**
 * @wcn/realtime — Event Handlers
 * SSE bridge: forward key events to connected clients, scoped by role and involvement.
 */
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";
import { sseManager } from "./sse";
import { isAdminRole } from "@/lib/permissions";

let _initialized = false;

export function initRealtimeHandlers(): void {
  if (_initialized) return;
  _initialized = true;

  const broadcastEvents = new Set<string>([
    Events.DEAL_STAGE_CHANGED,
    Events.TASK_COMPLETED,
    Events.TASK_ASSIGNED,
    Events.POB_CREATED,
    Events.EVIDENCE_APPROVED,
    Events.MATCH_GENERATED,
  ]);

  eventBus.onAny(async (payload, meta) => {
    if (!broadcastEvents.has(meta.eventName)) return;

    const safePayload = { event: meta.eventName, timestamp: new Date().toISOString() };

    const actorId = meta.actorId;

    sseManager.broadcast("entity_update", safePayload, (client) => {
      if (isAdminRole(client.role as any)) return true;
      if (actorId && client.userId === actorId) return true;
      return false;
    });
  });
}
