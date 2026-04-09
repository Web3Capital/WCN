import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { canTransitionSettlement } from "@/lib/state-machines/settlement";
import { AuditAction, writeAudit } from "@/lib/audit";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requirePermission("update", "settlement");
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const cycle = await prisma.settlementCycle.findUnique({ where: { id: params.id } });
  if (!cycle) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  if (cycle.status === "LOCKED" || cycle.status === "EXPORTED" || cycle.status === "FINALIZED") {
    return NextResponse.json({ ok: true, idempotent: true, cycle });
  }

  if (!canTransitionSettlement(cycle.status, "LOCKED")) {
    return NextResponse.json({ ok: false, error: `Cannot lock from ${cycle.status}. Must be RECONCILED.` }, { status: 400 });
  }

  const updated = await prisma.settlementCycle.update({
    where: { id: params.id },
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
