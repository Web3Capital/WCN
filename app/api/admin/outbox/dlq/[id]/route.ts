/**
 * Outbox DLQ per-event mutation surface.
 *
 *   PATCH /api/admin/outbox/dlq/[id]
 *     Body: { action: "requeue" | "discard", reason?: string }
 *
 *     - "requeue" resets retryCount=0 + lastError=null so the poller
 *       picks the event up again. Use after fixing the underlying
 *       handler.
 *     - "discard" tombstones the event (delivered=true, deliveredAt=now)
 *       without dispatching. Use when the event is no longer relevant.
 *
 * FOUNDER + ADMIN only. Both actions write an audit row with the
 * actor + reason + before-state for compliance traceability.
 */
import "@/lib/core/init";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminRole } from "@/lib/permissions";
import {
  requeueOutboxEvent,
  discardOutboxEvent,
} from "@/lib/core/outbox";
import { AuditAction, writeAudit } from "@/lib/audit";
import {
  apiOk,
  apiForbidden,
  apiUnauthorized,
  apiNotFound,
  apiValidationError,
  apiBusinessError,
} from "@/lib/core/api-response";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return apiUnauthorized();
  if (!isAdminRole(session.user.role)) return apiForbidden();

  const body = await req.json().catch(() => ({}));
  const action = String(body?.action ?? "").trim();
  const reason = body?.reason ? String(body.reason).trim() : null;

  if (action !== "requeue" && action !== "discard") {
    return apiValidationError([
      { path: "action", message: "action must be 'requeue' or 'discard'" },
    ]);
  }

  const updated = action === "requeue"
    ? await requeueOutboxEvent(params.id)
    : await discardOutboxEvent(params.id);

  if (!updated) {
    // Either not found or not in the DLQ (defensive — operators must
    // not requeue an actively retrying event).
    return apiNotFound("DLQ event");
  }

  // Audit: who did what, why, with the entire prior state preserved.
  await writeAudit({
    actorUserId: session.user.id,
    action: action === "requeue"
      ? AuditAction.OUTBOX_DLQ_REQUEUE
      : AuditAction.OUTBOX_DLQ_DISCARD,
    targetType: "OUTBOX",
    targetId: params.id,
    metadata: {
      eventName: updated.eventName,
      reason,
    },
    requestId: req.headers.get("x-request-id") ?? null,
  });

  return apiOk({ id: updated.id, action, eventName: updated.eventName });
}
