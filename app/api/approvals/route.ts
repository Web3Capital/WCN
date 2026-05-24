import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import type { ApprovalActionType, ApprovalStatus, Prisma } from "@prisma/client";
import { AuditAction, writeAudit } from "@/lib/audit";
import { route } from "@/lib/core/api/route";
import { createApprovalSchema } from "@/lib/core/validation";
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";
import { z } from "zod";

const approvalQuerySchema = z.object({
  aggregate: z.string().optional(),
  status: z.string().optional(),
  workspaceId: z.string().optional(),
});

export const GET = route.permission({
  input: approvalQuerySchema,
  rateLimit: "auth",
  permission: { action: "read", resource: "approval" },
  handler: async ({ input }) => {
    const prisma = getPrisma();
    const aggregate = input.aggregate === "1";
    const { status, workspaceId } = input;

    if (aggregate) {
      const where: Prisma.ApprovalActionWhereInput = workspaceId ? { workspaceId } : {};
      const rows = await prisma.approvalAction.groupBy({
        by: ["status"],
        where,
        _count: true,
      });
      const counts: Record<string, number> = {};
      for (const row of rows) {
        counts[row.status] = row._count;
      }
      return counts;
    }

    const where: Prisma.ApprovalActionWhereInput = {};
    if (status) where.status = status as ApprovalStatus;
    if (workspaceId) where.workspaceId = workspaceId;

    const approvals = await prisma.approvalAction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return approvals;
  },
});

export const POST = route.permission({
  input: createApprovalSchema,
  rateLimit: "write",
  permission: { action: "create", resource: "approval" },
  successStatus: 201,
  handler: async ({ input, session }) => {
    const prisma = getPrisma();
    const { workspaceId, entityType, entityId, actionType, reason } = input;

    const approval = await prisma.approvalAction.create({
      data: {
        workspaceId,
        entityType,
        entityId,
        actionType: actionType as ApprovalActionType,
        requestedById: session.user.id,
        reason: reason ?? null,
      },
    });

    await writeAudit({
      actorUserId: session.user.id,
      action: AuditAction.APPROVAL_REQUEST,
      targetType: "APPROVAL",
      targetId: approval.id,
      workspaceId,
      metadata: { entityType, entityId, actionType },
    });

    await eventBus.emit(Events.APPROVAL_REQUESTED, {
      approvalId: approval.id,
      action: actionType,
      entityType,
      entityId,
      requestedBy: session.user.id,
    }, { actorId: session.user.id });

    return approval;
  },
});
