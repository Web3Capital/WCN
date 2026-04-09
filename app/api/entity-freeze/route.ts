import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";

export async function GET(req: Request) {
  const auth = await requirePermission("read", "risk");
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const url = new URL(req.url);
  const entityType = url.searchParams.get("entityType");
  const entityId = url.searchParams.get("entityId");
  const active = url.searchParams.get("active");

  const where: Record<string, unknown> = {};
  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = entityId;
  if (active === "true") where.liftedAt = null;

  const freezes = await prisma.entityFreeze.findMany({
    where,
    orderBy: { frozenAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ ok: true, freezes });
}

export async function POST(req: Request) {
  const auth = await requirePermission("freeze", "risk");
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const { workspaceId, entityType, entityId, freezeLevel, reason, expiresAt } = body;

  if (!workspaceId || !entityType || !entityId || !freezeLevel || !reason) {
    return NextResponse.json({ ok: false, error: "Missing required fields." }, { status: 400 });
  }

  const freeze = await prisma.entityFreeze.create({
    data: {
      workspaceId,
      entityType,
      entityId,
      freezeLevel,
      reason,
      frozenById: auth.session.user!.id,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  });

  await writeAudit({
    actorUserId: auth.session.user!.id,
    action: AuditAction.ENTITY_FREEZE,
    targetType: entityType,
    targetId: entityId,
    workspaceId,
    metadata: { freezeId: freeze.id, freezeLevel, reason },
  });

  return NextResponse.json({ ok: true, freeze }, { status: 201 });
}
