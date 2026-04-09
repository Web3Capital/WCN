import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requirePermission("update", "risk");
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const existing = await prisma.riskFlag.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (body?.resolution !== undefined) data.resolution = body.resolution ? String(body.resolution) : null;
  if (body?.resolve === true) {
    data.resolvedAt = new Date();
    data.resolution = body.resolution ? String(body.resolution) : "Resolved";
  }
  if (body?.severity !== undefined) data.severity = String(body.severity);

  const flag = await prisma.riskFlag.update({ where: { id }, data });

  if (body?.freeze === true) {
    await prisma.entityFreeze.create({
      data: {
        workspaceId: existing.workspaceId ?? "",
        entityType: existing.entityType,
        entityId: existing.entityId,
        freezeLevel: body?.freezeLevel ?? "SOFT",
        reason: `Risk flag #${id}: ${existing.reason}`,
        frozenById: auth.session.user!.id,
      },
    });

    await writeAudit({
      actorUserId: auth.session.user?.id ?? null,
      action: AuditAction.ENTITY_FREEZE,
      targetType: existing.entityType,
      targetId: existing.entityId,
      metadata: { riskFlagId: id, freezeLevel: body?.freezeLevel ?? "SOFT" },
    });
  }

  if (data.resolvedAt) {
    await writeAudit({
      actorUserId: auth.session.user?.id ?? null,
      action: AuditAction.RISK_FLAG_RESOLVE,
      targetType: existing.entityType,
      targetId: existing.entityId,
      metadata: { riskFlagId: id, resolution: data.resolution },
    });
  }

  return NextResponse.json({ ok: true, flag });
}
