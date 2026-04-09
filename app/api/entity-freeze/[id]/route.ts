import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requirePermission("freeze", "risk");
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const freeze = await prisma.entityFreeze.findUnique({ where: { id } });
  if (!freeze) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  if (freeze.liftedAt) return NextResponse.json({ ok: false, error: "Already lifted." }, { status: 400 });

  const updated = await prisma.entityFreeze.update({
    where: { id },
    data: {
      liftedAt: new Date(),
      liftedById: auth.session.user!.id,
    },
  });

  await writeAudit({
    actorUserId: auth.session.user!.id,
    action: AuditAction.ENTITY_UNFREEZE,
    targetType: freeze.entityType,
    targetId: freeze.entityId,
    workspaceId: freeze.workspaceId,
    metadata: { freezeId: id, reason: body?.reason },
  });

  return NextResponse.json({ ok: true, freeze: updated });
}
