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
  const reason = String(body?.reason ?? "").trim();
  if (!reason) return NextResponse.json({ ok: false, error: "Reason is required to reopen." }, { status: 400 });

  const cycle = await prisma.settlementCycle.findUnique({ where: { id } });
  if (!cycle) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  const dualControl = body?.dualControl === true;

  if (dualControl) {
    if (!canTransitionSettlement(cycle.status, "REOPEN_PENDING_APPROVAL")) {
      return NextResponse.json({ ok: false, error: `Cannot request reopen from ${cycle.status}.` }, { status: 400 });
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

    return NextResponse.json({ ok: true, pendingApproval: true, approvalId: approval.id });
  }

  if (!canTransitionSettlement(cycle.status, "REOPENED")) {
    return NextResponse.json({ ok: false, error: `Cannot reopen from ${cycle.status}.` }, { status: 400 });
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

  return NextResponse.json({ ok: true, cycle: updated });
}
