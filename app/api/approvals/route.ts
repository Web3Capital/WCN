import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";

export async function GET(req: Request) {
  const auth = await requirePermission("read", "settlement");
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const workspaceId = url.searchParams.get("workspaceId");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (workspaceId) where.workspaceId = workspaceId;

  const approvals = await prisma.approvalAction.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ ok: true, approvals });
}

export async function POST(req: Request) {
  const auth = await requirePermission("create", "settlement");
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const { workspaceId, entityType, entityId, actionType, reason, expiresAt } = body;

  if (!workspaceId || !entityType || !entityId || !actionType) {
    return NextResponse.json({ ok: false, error: "Missing required fields." }, { status: 400 });
  }

  const approval = await prisma.approvalAction.create({
    data: {
      workspaceId,
      entityType,
      entityId,
      actionType,
      requestedById: auth.session.user!.id,
      reason: reason ?? null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  });

  await writeAudit({
    actorUserId: auth.session.user!.id,
    action: AuditAction.APPROVAL_REQUEST,
    targetType: "APPROVAL",
    targetId: approval.id,
    workspaceId,
    metadata: { entityType, entityId, actionType },
  });

  return NextResponse.json({ ok: true, approval }, { status: 201 });
}
