import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";

export async function GET(req: Request) {
  const auth = await requirePermission("read", "file");
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const url = new URL(req.url);
  const entityType = url.searchParams.get("entityType");
  const entityId = url.searchParams.get("entityId");
  const workspaceId = url.searchParams.get("workspaceId");

  const where: Record<string, unknown> = {};
  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = entityId;
  if (workspaceId) where.workspaceId = workspaceId;

  const grants = await prisma.accessGrant.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ ok: true, grants });
}

export async function POST(req: Request) {
  const auth = await requirePermission("create", "file");
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const { workspaceId, entityType, entityId, grantedToType, grantedToId, grantType, scope, expiresAt } = body;

  if (!workspaceId || !entityType || !entityId || !grantedToType || !grantedToId || !grantType) {
    return NextResponse.json({ ok: false, error: "Missing required fields." }, { status: 400 });
  }

  const grant = await prisma.accessGrant.create({
    data: {
      workspaceId,
      entityType,
      entityId,
      grantedToType,
      grantedToId,
      grantType,
      scope: scope ?? "FULL",
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      grantedById: auth.session.user!.id,
    },
  });

  await writeAudit({
    actorUserId: auth.session.user!.id,
    action: AuditAction.ACCESS_GRANT_CREATE,
    targetType: "ACCESS_GRANT",
    targetId: grant.id,
    workspaceId,
    metadata: { entityType, entityId, grantedToType, grantedToId, grantType },
  });

  return NextResponse.json({ ok: true, grant }, { status: 201 });
}
