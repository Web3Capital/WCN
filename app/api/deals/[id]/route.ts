import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requireSignedIn, requirePermission } from "@/lib/admin";
import { isAdminRole } from "@/lib/permissions";
import { canTransitionDeal } from "@/lib/state-machines/deal";
import { AuditAction, writeAudit } from "@/lib/audit";
import type { DealStage } from "@prisma/client";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireSignedIn();
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();

  const deal = await prisma.deal.findUnique({
    where: { id: params.id },
    include: {
      project: { select: { id: true, name: true, status: true, sector: true } },
      capital: { select: { id: true, name: true, status: true } },
      leadNode: { select: { id: true, name: true } },
      participants: { include: { node: { select: { id: true, name: true } } }, orderBy: { joinedAt: "asc" } },
      milestones: { orderBy: { createdAt: "asc" } },
      notes: { orderBy: { createdAt: "desc" }, take: 50 },
      tasks: { select: { id: true, title: true, status: true, type: true }, orderBy: { createdAt: "desc" }, take: 30 },
      evidence: { select: { id: true, title: true, type: true, reviewStatus: true }, take: 20 },
      pobRecords: { select: { id: true, businessType: true, status: true, score: true }, take: 10 },
      _count: { select: { participants: true, milestones: true, notes: true, tasks: true, evidence: true } },
    },
  });

  if (!deal) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  return NextResponse.json({ ok: true, deal });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requirePermission("update", "deal");
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const existing = await prisma.deal.findUnique({ where: { id: params.id }, select: { id: true, stage: true } });
  if (!existing) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  const data: Record<string, unknown> = {};

  const stringFields = ["title", "description", "nextAction"] as const;
  for (const f of stringFields) {
    if (body?.[f] !== undefined) data[f] = body[f] ? String(body[f]).trim() : null;
  }

  if (body?.nextActionDueAt !== undefined) data.nextActionDueAt = body.nextActionDueAt ? new Date(String(body.nextActionDueAt)) : null;
  if (body?.riskTags !== undefined) data.riskTags = Array.isArray(body.riskTags) ? body.riskTags.map((t: unknown) => String(t)) : [];
  if (body?.confidentialityLevel !== undefined) data.confidentialityLevel = String(body.confidentialityLevel);

  if (body?.stage !== undefined) {
    const newStage = String(body.stage) as DealStage;
    if (!canTransitionDeal(existing.stage, newStage)) {
      return NextResponse.json({ ok: false, error: `Cannot transition from ${existing.stage} to ${newStage}.` }, { status: 400 });
    }
    data.stage = newStage;
    if (newStage === "FUNDED" || newStage === "PASSED") data.closedAt = new Date();
  }

  const deal = await prisma.deal.update({ where: { id: params.id }, data });

  if (data.stage && data.stage !== existing.stage) {
    await writeAudit({
      actorUserId: auth.session.user?.id ?? null,
      action: AuditAction.DEAL_STAGE_CHANGE,
      targetType: "DEAL",
      targetId: params.id,
      metadata: { previousStage: existing.stage, newStage: data.stage },
    });
  }

  return NextResponse.json({ ok: true, deal });
}
