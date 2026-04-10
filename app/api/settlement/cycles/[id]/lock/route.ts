import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { canTransitionSettlement } from "@/lib/state-machines/settlement";
import { AuditAction, writeAudit } from "@/lib/audit";
import { apiOk, apiUnauthorized, apiNotFound, apiValidationError } from "@/lib/core/api-response";
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";
import type { SettlementApprovedEvent } from "@/lib/core/event-types";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requirePermission("update", "settlement");
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));
  const dualControl = body?.dualControl === true;

  const cycle = await prisma.settlementCycle.findUnique({ where: { id } });
  if (!cycle) return apiNotFound("SettlementCycle");

  if (cycle.status === "LOCKED" || cycle.status === "EXPORTED" || cycle.status === "FINALIZED") {
    return apiOk({ idempotent: true, cycle });
  }

  if (dualControl) {
    if (!canTransitionSettlement(cycle.status, "LOCK_PENDING_APPROVAL")) {
      return apiValidationError([{ path: "status", message: `Cannot request lock from ${cycle.status}.` }]);
    }

    const approval = await prisma.approvalAction.create({
      data: {
        workspaceId: cycle.workspaceId ?? "",
        entityType: "SETTLEMENT_CYCLE",
        entityId: id,
        actionType: "LOCK",
        requestedById: auth.session.user!.id,
        reason: body?.reason ?? null,
      },
    });

    await prisma.settlementCycle.update({
      where: { id },
      data: { status: "LOCK_PENDING_APPROVAL", lockApprovalId: approval.id },
    });

    await writeAudit({
      actorUserId: auth.session.user?.id ?? null,
      action: AuditAction.SETTLEMENT_LOCK_APPROVAL,
      targetType: "SETTLEMENT_CYCLE",
      targetId: id,
      metadata: { approvalId: approval.id, previousStatus: cycle.status },
    });

    return apiOk({ pendingApproval: true, approvalId: approval.id });
  }

  if (!canTransitionSettlement(cycle.status, "LOCKED")) {
    return apiValidationError([{ path: "status", message: `Cannot lock from ${cycle.status}. Must be RECONCILED.` }]);
  }

  const updated = await prisma.settlementCycle.update({
    where: { id },
    data: { status: "LOCKED", lockedById: auth.session.user?.id ?? null },
  });

  await writeAudit({
    actorUserId: auth.session.user?.id ?? null,
    action: AuditAction.SETTLEMENT_CYCLE_LOCK,
    targetType: "SETTLEMENT_CYCLE",
    targetId: updated.id,
    metadata: { previousStatus: cycle.status },
  });

  await eventBus.emit<SettlementApprovedEvent>(Events.SETTLEMENT_APPROVED, {
    cycleId: id,
    approvedBy: auth.session.user?.id ?? "system",
  }, { actorId: auth.session.user?.id });

  return apiOk({ idempotent: false, cycle: updated });
}
