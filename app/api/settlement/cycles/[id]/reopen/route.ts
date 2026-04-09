import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { canTransitionSettlement } from "@/lib/state-machines/settlement";
import { AuditAction, writeAudit } from "@/lib/audit";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requirePermission("update", "settlement");
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));
  const reason = String(body?.reason ?? "").trim();
  if (!reason) return NextResponse.json({ ok: false, error: "Reason is required to reopen." }, { status: 400 });

  const cycle = await prisma.settlementCycle.findUnique({ where: { id: params.id } });
  if (!cycle) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  if (!canTransitionSettlement(cycle.status, "REOPENED")) {
    return NextResponse.json({ ok: false, error: `Cannot reopen from ${cycle.status}.` }, { status: 400 });
  }

  const updated = await prisma.settlementCycle.update({
    where: { id: params.id },
    data: { status: "REOPENED", reopenedAt: new Date(), reopenReason: reason },
  });

  await writeAudit({
    actorUserId: auth.session.user?.id ?? null,
    action: AuditAction.SETTLEMENT_REOPEN,
    targetType: "SETTLEMENT_CYCLE",
    targetId: params.id,
    metadata: { previousStatus: cycle.status, reason },
  });

  return NextResponse.json({ ok: true, cycle: updated });
}
