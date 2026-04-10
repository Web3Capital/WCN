/**
 * @wcn/realtime — Event Handlers
 * SSE bridge: forward key events to connected clients.
 */
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";
import { sseManager } from "./sse";

let _initialized = false;

export function initRealtimeHandlers(): void {
  if (_initialized) return;
  _initialized = true;

  eventBus.onAny(async (payload, meta) => {
    const broadcastEvents: string[] = [
      Events.DEAL_STAGE_CHANGED,
      Events.TASK_COMPLETED,
      Events.TASK_ASSIGNED,
      Events.POB_CREATED,
      Events.EVIDENCE_APPROVED,
      Events.MATCH_GENERATED,
    ];
    if (broadcastEvents.includes(meta.eventName)) {
      sseManager.broadcast("entity_update", { event: meta.eventName, ...payload });
    }
  });
}
