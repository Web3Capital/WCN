import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { ApiCode, apiError } from "@/lib/api-error";
import { AuditAction, writeAudit } from "@/lib/audit";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin.ok) {
    return apiError(ApiCode.UNAUTHORIZED, "Unauthorized.", 401);
  }
  const prisma = getPrisma();

  const cycle = await prisma.settlementCycle.findUnique({ where: { id: params.id } });
  if (!cycle) {
    return apiError(ApiCode.NOT_FOUND, "Settlement cycle not found.", 404);
  }

  if (cycle.status === "LOCKED" || cycle.status === "FINALIZED") {
    await writeAudit({
      actorUserId: admin.session.user?.id ?? null,
      action: AuditAction.SETTLEMENT_CYCLE_LOCK,
      targetType: "SETTLEMENT_CYCLE",
      targetId: cycle.id,
      metadata: { idempotent: true, status: cycle.status }
    });
    return NextResponse.json({ ok: true, idempotent: true, cycle });
  }

  if (cycle.status !== "DRAFT") {
    return apiError(ApiCode.SETTLEMENT_INVALID_STATE, "Only DRAFT cycles can be locked.", 400, {
      currentStatus: cycle.status
    });
  }

  const updated = await prisma.settlementCycle.update({
    where: { id: params.id },
    data: { status: "LOCKED" }
  });

  await writeAudit({
    actorUserId: admin.session.user?.id ?? null,
    action: AuditAction.SETTLEMENT_CYCLE_LOCK,
    targetType: "SETTLEMENT_CYCLE",
    targetId: updated.id,
    metadata: { idempotent: false, previousStatus: cycle.status, nextStatus: updated.status }
  });

  return NextResponse.json({ ok: true, idempotent: false, cycle: updated });
}
