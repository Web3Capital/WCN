import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requirePermission("update", "risk");
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const existing = await prisma.riskFlag.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (body?.resolution !== undefined) data.resolution = body.resolution ? String(body.resolution) : null;
  if (body?.resolve === true) {
    data.resolvedAt = new Date();
    data.resolution = body.resolution ? String(body.resolution) : "Resolved";
  }
  if (body?.severity !== undefined) data.severity = String(body.severity);

  const flag = await prisma.riskFlag.update({ where: { id: params.id }, data });

  if (data.resolvedAt) {
    await writeAudit({
      actorUserId: auth.session.user?.id ?? null,
      action: AuditAction.RISK_FLAG_RESOLVE,
      targetType: existing.entityType,
      targetId: existing.entityId,
      metadata: { riskFlagId: params.id, resolution: data.resolution },
    });
  }

  return NextResponse.json({ ok: true, flag });
}
