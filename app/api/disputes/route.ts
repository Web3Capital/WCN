import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin, requireSignedIn } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";
import { getOwnedNodeIds, memberPoBWhere } from "@/lib/member-data-scope";
import type { Prisma } from "@prisma/client";
import { isAdminRole } from "@/lib/permissions";

export async function GET(req: Request) {
  const auth = await requireSignedIn();
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const isAdmin = isAdminRole(auth.session.user?.role ?? "USER");
  const userId = auth.session.user!.id;

  const { searchParams } = new URL(req.url);
  const pobId = searchParams.get("pobId");
  const targetType = searchParams.get("targetType");
  const status = searchParams.get("status");

  const where: Prisma.DisputeWhereInput = {};
  if (pobId) where.pobId = pobId;
  if (targetType) where.targetType = targetType as any;
  if (status) where.status = status as any;

  if (!isAdmin) {
    const ownedNodeIds = await getOwnedNodeIds(prisma, userId);
    where.pob = memberPoBWhere(ownedNodeIds) as any;
  }

  const disputes = await prisma.dispute.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      pob: { select: { id: true, businessType: true, nodeId: true, dealId: true } },
    },
  });

  return NextResponse.json({ ok: true, disputes });
}

export async function POST(req: Request) {
  const auth = await requireSignedIn();
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const reason = String(body?.reason ?? "").trim();
  if (!reason) return NextResponse.json({ ok: false, error: "Missing reason." }, { status: 400 });

  const targetType = String(body?.targetType ?? "POB").trim();
  const allowed = new Set(["NODE", "PROJECT", "TASK", "POB", "APPLICATION", "EVIDENCE"]);
  if (!allowed.has(targetType)) {
    return NextResponse.json({ ok: false, error: "Invalid targetType." }, { status: 400 });
  }

  const targetId = String(body?.targetId ?? "").trim();
  if (!targetId) return NextResponse.json({ ok: false, error: "Missing targetId." }, { status: 400 });

  const pobId = body?.pobId ? String(body.pobId) : null;
  const windowDays = 5;
  const windowEndsAt = new Date(Date.now() + windowDays * 24 * 60 * 60 * 1000);

  const dispute = await prisma.dispute.create({
    data: {
      reason,
      targetType: targetType as any,
      targetId,
      pobId,
      windowEndsAt,
    },
  });

  await writeAudit({
    actorUserId: auth.session.user?.id ?? null,
    action: AuditAction.DISPUTE_CREATE,
    targetType: "DISPUTE",
    targetId: dispute.id,
    metadata: { pobId, reason, disputeTargetType: targetType, disputeTargetId: targetId, windowEndsAt: windowEndsAt.toISOString() },
  });

  return NextResponse.json({ ok: true, dispute });
}
