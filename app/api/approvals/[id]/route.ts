import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";
import { apiOk, apiUnauthorized, apiNotFound, apiForbidden, apiValidationError } from "@/lib/core/api-response";
import { parseBody, updateApprovalSchema } from "@/lib/core/validation";
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requirePermission("update", "approval");
  if (!auth.ok) return apiUnauthorized();

  const body = await req.json().catch(() => ({}));
  const parsed = parseBody(updateApprovalSchema, body);
  if (!parsed.ok) return apiValidationError(parsed.error.issues.map(i => ({ path: i.path.join("."), message: i.message })));

  const prisma = getPrisma();
  const approval = await prisma.approvalAction.findUnique({ where: { id } });
  if (!approval) return apiNotFound("Approval");
  if (approval.status !== "PENDING") return apiValidationError([{ path: "id", message: "Approval is not pending." }]);
  if (approval.requestedById === auth.session.user!.id) return apiForbidden("Cannot approve your own request (dual control).");

  const { decision } = parsed.data;

  const updated = await prisma.approvalAction.update({
    where: { id },
    data: {
      status: decision as any,
      decidedAt: new Date(),
      ...(decision === "APPROVED"
        ? { approvedById: auth.session.user!.id }
        : { rejectedById: auth.session.user!.id }),
    },
  });

  const auditAction = decision === "APPROVED" ? AuditAction.APPROVAL_APPROVE : AuditAction.APPROVAL_REJECT;
  await writeAudit({
    actorUserId: auth.session.user!.id,
    action: auditAction,
    targetType: "APPROVAL",
    targetId: id,
    workspaceId: approval.workspaceId,
    metadata: { decision, entityType: approval.entityType, entityId: approval.entityId, actionType: approval.actionType },
  });

  if (decision === "APPROVED") {
    await eventBus.emit(Events.APPROVAL_GRANTED, {
      approvalId: id,
      grantedBy: auth.session.user!.id,
    }, { actorId: auth.session.user?.id });
  }

  return apiOk(updated);
}
