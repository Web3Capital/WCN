import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import type { ApprovalStatus } from "@prisma/client";
import { AuditAction, writeAudit } from "@/lib/audit";
import { HttpError, route } from "@/lib/core/api/route";
import { updateApprovalSchema } from "@/lib/core/validation";
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";
import { z } from "zod";

const updateApprovalInputSchema = z.object(updateApprovalSchema.shape);

export const PATCH = route.permission<z.infer<typeof updateApprovalInputSchema>, unknown, { id: string }>({
  input: updateApprovalInputSchema,
  rateLimit: "write",
  permission: { action: "update", resource: "approval" },
  handler: async ({ input, params, session }) => {
    const { id } = params;
    const prisma = getPrisma();
    const approval = await prisma.approvalAction.findUnique({ where: { id } });
    if (!approval) throw new HttpError(404, "NOT_FOUND", "Approval not found.");
    if (approval.status !== "PENDING") {
      throw new HttpError(400, "VALIDATION_ERROR", "Invalid input.", [{ path: "id", message: "Approval is not pending." }]);
    }
    if (approval.requestedById === session.user.id) {
      throw new HttpError(403, "FORBIDDEN", "Cannot approve your own request (dual control).");
    }

    const { decision } = input;

    const updated = await prisma.approvalAction.update({
      where: { id },
      data: {
        status: decision as ApprovalStatus,
        decidedAt: new Date(),
        ...(decision === "APPROVED"
          ? { approvedById: session.user.id }
          : { rejectedById: session.user.id }),
      },
    });

    const auditAction = decision === "APPROVED" ? AuditAction.APPROVAL_APPROVE : AuditAction.APPROVAL_REJECT;
    await writeAudit({
      actorUserId: session.user.id,
      action: auditAction,
      targetType: "APPROVAL",
      targetId: id,
      workspaceId: approval.workspaceId,
      metadata: { decision, entityType: approval.entityType, entityId: approval.entityId, actionType: approval.actionType },
    });

    if (decision === "APPROVED") {
      await eventBus.emit(Events.APPROVAL_GRANTED, {
        approvalId: id,
        grantedBy: session.user.id,
      }, { actorId: session.user.id });
    }

    return updated;
  },
});
