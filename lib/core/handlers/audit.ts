/**
 * @wcn/audit — Universal Event Handler
 * Listens to ALL events and writes audit records. Stays in core.
 */
import { eventBus } from "../event-bus";
import { writeAudit } from "@/lib/audit";

let _initialized = false;

export function initAuditHandler(): void {
  if (_initialized) return;
  _initialized = true;

  eventBus.onAny(async (payload, meta) => {
    try {
      await writeAudit({
        actorUserId: meta.actorId ?? null,
        action: meta.eventName,
        targetType: (payload as Record<string, unknown>).entityType as string ?? "SYSTEM",
        targetId: (payload as Record<string, unknown>).entityId as string
          ?? (payload as Record<string, unknown>).dealId as string
          ?? (payload as Record<string, unknown>).nodeId as string
          ?? (payload as Record<string, unknown>).projectId as string
          ?? (payload as Record<string, unknown>).taskId as string
          ?? (payload as Record<string, unknown>).pobId as string
          ?? "unknown",
        metadata: { ...payload as Record<string, unknown>, _eventId: meta.eventId },
        requestId: meta.requestId,
      });
    } catch {
      console.error(`[Audit] Failed to log event ${meta.eventName}`);
    }
  });
}
