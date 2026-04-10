import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";
import { apiOk, apiCreated, apiUnauthorized, zodToApiError } from "@/lib/core/api-response";
import { parseBody, createApprovalSchema } from "@/lib/core/validation";
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";

export async function GET(req: Request) {
  const auth = await requirePermission("read", "settlement");
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const workspaceId = url.searchParams.get("workspaceId");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (workspaceId) where.workspaceId = workspaceId;

  const approvals = await prisma.approvalAction.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return apiOk(approvals);
}

export async function POST(req: Request) {
  const auth = await requirePermission("create", "settlement");
  if (!auth.ok) return apiUnauthorized();

  const body = await req.json().catch(() => ({}));
  const parsed = parseBody(createApprovalSchema, body);
  if (!parsed.ok) return zodToApiError(parsed.error);

  const prisma = getPrisma();
  const { workspaceId, entityType, entityId, actionType, reason } = parsed.data;

  const approval = await prisma.approvalAction.create({
    data: {
      workspaceId,
      entityType,
      entityId,
      actionType: actionType as any,
      requestedById: auth.session.user!.id,
      reason: reason ?? null,
    },
  });

  await writeAudit({
    actorUserId: auth.session.user!.id,
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
    requestedBy: auth.session.user!.id,
  }, { actorId: auth.session.user?.id });

  return apiCreated(approval);
}
