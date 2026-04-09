import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requirePermission, requireSignedIn } from "@/lib/admin";
import { isAdminRole } from "@/lib/permissions";
import { AuditAction, writeAudit } from "@/lib/audit";

export async function GET(req: Request) {
  const auth = await requireSignedIn();
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const isAdmin = isAdminRole(auth.session.user?.role ?? "USER");
  const { searchParams } = new URL(req.url);
  const stage = searchParams.get("stage");

  const where: Record<string, unknown> = {};
  if (stage) where.stage = stage;

  if (!isAdmin) {
    const ownedNodes = await prisma.node.findMany({
      where: { ownerUserId: auth.session.user?.id },
      select: { id: true },
    });
    const nodeIds = ownedNodes.map((n) => n.id);
    where.OR = [
      { leadNodeId: { in: nodeIds } },
      { participants: { some: { nodeId: { in: nodeIds } } } },
    ];
  }

  const deals = await prisma.deal.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 200,
    include: {
      project: { select: { id: true, name: true } },
      capital: { select: { id: true, name: true } },
      leadNode: { select: { id: true, name: true } },
      _count: { select: { participants: true, milestones: true, notes: true, tasks: true } },
    },
  });

  return NextResponse.json({ ok: true, deals });
}

export async function POST(req: Request) {
  const auth = await requirePermission("create", "deal");
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const title = String(body?.title ?? "").trim();
  const leadNodeId = String(body?.leadNodeId ?? "").trim();
  if (!title || !leadNodeId) {
    return NextResponse.json({ ok: false, error: "Title and leadNodeId are required." }, { status: 400 });
  }

  const deal = await prisma.deal.create({
    data: {
      title,
      leadNodeId,
      description: body?.description ? String(body.description) : null,
      projectId: body?.projectId ? String(body.projectId) : null,
      capitalId: body?.capitalId ? String(body.capitalId) : null,
      nextAction: body?.nextAction ? String(body.nextAction) : null,
      confidentialityLevel: body?.confidentialityLevel ?? "DEAL_ROOM",
    },
    include: {
      project: { select: { id: true, name: true } },
      leadNode: { select: { id: true, name: true } },
    },
  });

  await writeAudit({
    actorUserId: auth.session.user?.id ?? null,
    action: AuditAction.DEAL_CREATE,
    targetType: "DEAL",
    targetId: deal.id,
    metadata: { title, leadNodeId },
  });

  return NextResponse.json({ ok: true, deal });
}
