import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin, requireSignedIn } from "@/lib/admin";
import { isAdminRole } from "@/lib/permissions";
import { canTransitionNode } from "@/lib/state-machines/node";
import { AuditAction, writeAudit } from "@/lib/audit";
import { redactNodeForMember } from "@/lib/member-redact";
import type { NodeStatus } from "@prisma/client";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireSignedIn();
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const isAdmin = isAdminRole(auth.session.user?.role ?? "USER");

  const node = await prisma.node.findUnique({
    where: { id: params.id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      seats: { orderBy: { createdAt: "desc" } },
      stakeLedger: { orderBy: { createdAt: "desc" }, take: 20 },
      penalties: { orderBy: { createdAt: "desc" }, take: 20 },
      projects: { select: { id: true, name: true, status: true }, take: 20 },
      tasksAsOwner: { select: { id: true, title: true, status: true }, take: 20, orderBy: { createdAt: "desc" } },
      ownedAgents: { select: { id: true, name: true, status: true, type: true } },
      _count: { select: { pobRecords: true, settlementLines: true, assignments: true } },
    },
  });

  if (!node) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  if (!isAdmin && node.ownerUserId !== auth.session.user?.id) {
    return NextResponse.json({ ok: true, node: redactNodeForMember(node) });
  }

  return NextResponse.json({ ok: true, node });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const existing = await prisma.node.findUnique({ where: { id: params.id }, select: { id: true, status: true } });
  if (!existing) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  const data: Record<string, unknown> = {};

  const stringFields = [
    "name", "description", "region", "city", "jurisdiction",
    "entityName", "entityType", "contactName", "contactEmail",
    "resourcesOffered", "pastCases", "recommendation", "riskLevel",
    "billingStatus", "depositStatus", "seatFeeStatus",
  ] as const;
  for (const f of stringFields) {
    if (body?.[f] !== undefined) data[f] = body[f] ? String(body[f]).trim() : null;
  }

  if (body?.level !== undefined) data.level = Number(body.level);
  if (body?.ownerUserId !== undefined) data.ownerUserId = body.ownerUserId ? String(body.ownerUserId) : null;
  if (body?.onboardingScore !== undefined) data.onboardingScore = body.onboardingScore != null ? Number(body.onboardingScore) : null;

  if (body?.tags !== undefined) {
    data.tags = Array.isArray(body.tags) ? body.tags.map((t: unknown) => String(t).trim()).filter(Boolean) : [];
  }
  if (body?.allowedServices !== undefined) {
    data.allowedServices = Array.isArray(body.allowedServices) ? body.allowedServices.map((s: unknown) => String(s).trim()).filter(Boolean) : [];
  }

  if (body?.type !== undefined) {
    const type = String(body.type);
    const allowedTypes = new Set(["GLOBAL", "REGION", "CITY", "INDUSTRY", "FUNCTIONAL", "AGENT"]);
    if (!allowedTypes.has(type)) {
      return NextResponse.json({ ok: false, error: "Invalid node type." }, { status: 400 });
    }
    data.type = type;
  }

  if (body?.status !== undefined) {
    const newStatus = String(body.status) as NodeStatus;
    if (!canTransitionNode(existing.status, newStatus)) {
      return NextResponse.json({
        ok: false,
        error: `Cannot transition from ${existing.status} to ${newStatus}.`
      }, { status: 400 });
    }
    data.status = newStatus;

    if (newStatus === "LIVE" && !data.goLiveAt) data.goLiveAt = new Date();
    if (newStatus === "OFFBOARDED" && !data.offboardedAt) data.offboardedAt = new Date();
    if (newStatus === "PROBATION" && !data.probationStartAt) data.probationStartAt = new Date();
  }

  const node = await prisma.node.update({ where: { id: params.id }, data });

  if (data.status && data.status !== existing.status) {
    await prisma.review.create({
      data: {
        targetType: "NODE",
        targetId: params.id,
        decision: data.status === "REJECTED" || data.status === "OFFBOARDED" ? "REJECT" : data.status === "NEED_MORE_INFO" ? "NEEDS_CHANGES" : "APPROVE",
        notes: body?.notes ? String(body.notes) : null,
        status: "RESOLVED",
        reviewerId: admin.session.user?.id ?? null,
      },
    });

    await writeAudit({
      actorUserId: admin.session.user?.id ?? null,
      action: AuditAction.NODE_STATUS_CHANGE,
      targetType: "NODE",
      targetId: params.id,
      metadata: { previousStatus: existing.status, newStatus: data.status, notes: body?.notes },
    });
  }

  return NextResponse.json({ ok: true, node });
}
