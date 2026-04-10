import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { canTransitionSettlement } from "@/lib/state-machines/settlement";
import { AuditAction, writeAudit } from "@/lib/audit";
import { apiOk, apiUnauthorized, apiNotFound, apiValidationError } from "@/lib/core/api-response";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requirePermission("update", "settlement");
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));
  const reason = String(body?.reason ?? "").trim();
  if (!reason) return apiValidationError([{ path: "reason", message: "Reason is required to reopen." }]);

  const cycle = await prisma.settlementCycle.findUnique({ where: { id } });
  if (!cycle) return apiNotFound("SettlementCycle");

  const dualControl = body?.dualControl === true;

  if (dualControl) {
    if (!canTransitionSettlement(cycle.status, "REOPEN_PENDING_APPROVAL")) {
      return apiValidationError([{ path: "status", message: `Cannot request reopen from ${cycle.status}.` }]);
    }

    const approval = await prisma.approvalAction.create({
      data: {
        workspaceId: cycle.workspaceId ?? "",
        entityType: "SETTLEMENT_CYCLE",
        entityId: id,
        actionType: "REOPEN",
        requestedById: auth.session.user!.id,
        reason,
      },
    });

    await prisma.settlementCycle.update({
      where: { id },
      data: { status: "REOPEN_PENDING_APPROVAL", reopenApprovalId: approval.id },
    });

    await writeAudit({
      actorUserId: auth.session.user?.id ?? null,
      action: AuditAction.SETTLEMENT_REOPEN_APPROVAL,
      targetType: "SETTLEMENT_CYCLE",
      targetId: id,
      metadata: { approvalId: approval.id, previousStatus: cycle.status, reason },
    });

    return apiOk({ pendingApproval: true, approvalId: approval.id });
  }

  if (!canTransitionSettlement(cycle.status, "REOPENED")) {
    return apiValidationError([{ path: "status", message: `Cannot reopen from ${cycle.status}.` }]);
  }

  const updated = await prisma.settlementCycle.update({
    where: { id },
    data: { status: "REOPENED", reopenedAt: new Date(), reopenReason: reason },
  });

  await writeAudit({
    actorUserId: auth.session.user?.id ?? null,
    action: AuditAction.SETTLEMENT_REOPEN,
    targetType: "SETTLEMENT_CYCLE",
    targetId: id,
    metadata: { previousStatus: cycle.status, reason },
  });

  return apiOk(updated);
}
