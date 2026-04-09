import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { canTransitionSettlement } from "@/lib/state-machines/settlement";
import { AuditAction, writeAudit } from "@/lib/audit";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requirePermission("update", "settlement");
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));
  const dualControl = body?.dualControl === true;

  const cycle = await prisma.settlementCycle.findUnique({ where: { id } });
  if (!cycle) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  if (cycle.status === "LOCKED" || cycle.status === "EXPORTED" || cycle.status === "FINALIZED") {
    return NextResponse.json({ ok: true, idempotent: true, cycle });
  }

  if (dualControl) {
    if (!canTransitionSettlement(cycle.status, "LOCK_PENDING_APPROVAL")) {
      return NextResponse.json({ ok: false, error: `Cannot request lock from ${cycle.status}.` }, { status: 400 });
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

    return NextResponse.json({ ok: true, pendingApproval: true, approvalId: approval.id });
  }

  if (!canTransitionSettlement(cycle.status, "LOCKED")) {
    return NextResponse.json({ ok: false, error: `Cannot lock from ${cycle.status}. Must be RECONCILED.` }, { status: 400 });
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

  return NextResponse.json({ ok: true, idempotent: false, cycle: updated });
}
