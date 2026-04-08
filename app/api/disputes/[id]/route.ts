import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const existing = await prisma.dispute.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ ok: false, error: "Dispute not found." }, { status: 404 });

  if (existing.status !== "OPEN") {
    return NextResponse.json({ ok: false, error: "Only OPEN disputes can be updated." }, { status: 400 });
  }

  const status = String(body?.status ?? "").trim();
  if (!["RESOLVED", "REJECTED"].includes(status)) {
    return NextResponse.json({ ok: false, error: "Status must be RESOLVED or REJECTED." }, { status: 400 });
  }

  const resolution = body?.resolution ? String(body.resolution).trim() : null;

  const dispute = await prisma.dispute.update({
    where: { id: params.id },
    data: {
      status: status as any,
      resolution,
      resolvedAt: new Date()
    }
  });

  await writeAudit({
    actorUserId: admin.session.user?.id ?? null,
    action: AuditAction.DISPUTE_RESOLVE,
    targetType: "DISPUTE",
    targetId: params.id,
    metadata: { newStatus: status, resolution }
  });

  return NextResponse.json({ ok: true, dispute });
}
