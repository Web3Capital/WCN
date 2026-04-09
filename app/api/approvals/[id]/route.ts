import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requirePermission("update", "settlement");
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));
  const decision = String(body?.decision ?? "");

  if (!["APPROVED", "REJECTED"].includes(decision)) {
    return NextResponse.json({ ok: false, error: "Invalid decision." }, { status: 400 });
  }

  const approval = await prisma.approvalAction.findUnique({ where: { id } });
  if (!approval) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  if (approval.status !== "PENDING") {
    return NextResponse.json({ ok: false, error: "Approval is not pending." }, { status: 400 });
  }
  if (approval.requestedById === auth.session.user!.id) {
    return NextResponse.json({ ok: false, error: "Cannot approve your own request (dual control)." }, { status: 403 });
  }

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

  return NextResponse.json({ ok: true, approval: updated });
}
