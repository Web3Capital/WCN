import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin, requireSignedIn } from "@/lib/admin";
import { isAdminRole } from "@/lib/permissions";
import { redactProjectForMember } from "@/lib/member-redact";
import { AuditAction, writeAudit } from "@/lib/audit";
import type { ProjectStatus } from "@prisma/client";

const VALID_STATUSES = new Set([
  "DRAFT", "SUBMITTED", "SCREENED", "CURATED", "IN_DEAL_ROOM",
  "ACTIVE", "ON_HOLD", "APPROVED", "REJECTED", "ARCHIVED",
]);

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireSignedIn();
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const isAdmin = isAdminRole(auth.session.user?.role ?? "USER");

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      node: { select: { id: true, name: true, ownerUserId: true } },
      tasks: { select: { id: true, title: true, status: true }, take: 20, orderBy: { createdAt: "desc" } },
      pobRecords: { select: { id: true, businessType: true, score: true, status: true }, take: 10 },
      evidence: { select: { id: true, title: true, type: true, createdAt: true }, take: 20, orderBy: { createdAt: "desc" } },
      _count: { select: { tasks: true, pobRecords: true, evidence: true, deals: true } },
    },
  });

  if (!project) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  return NextResponse.json({
    ok: true,
    project: isAdmin ? project : redactProjectForMember(project, auth.session.user?.id ?? ""),
  });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const existing = await prisma.project.findUnique({ where: { id: params.id }, select: { id: true, status: true } });
  if (!existing) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  const data: Record<string, unknown> = {};

  const stringFields = [
    "name", "sector", "website", "pitchUrl", "fundraisingNeed",
    "contactName", "contactEmail", "contactTelegram", "description", "internalNotes",
  ] as const;
  for (const f of stringFields) {
    if (body?.[f] !== undefined) data[f] = body[f] ? String(body[f]).trim() : null;
  }

  if (body?.stage !== undefined) data.stage = String(body.stage);
  if (body?.internalScore !== undefined) data.internalScore = body.internalScore != null ? Number(body.internalScore) : null;
  if (body?.nodeId !== undefined) data.nodeId = body.nodeId ? String(body.nodeId) : null;
  if (body?.confidentialityLevel !== undefined) data.confidentialityLevel = String(body.confidentialityLevel);

  if (body?.riskTags !== undefined) {
    data.riskTags = Array.isArray(body.riskTags) ? body.riskTags.map((t: unknown) => String(t).trim()).filter(Boolean) : [];
  }

  if (body?.status !== undefined) {
    const newStatus = String(body.status);
    if (!VALID_STATUSES.has(newStatus)) {
      return NextResponse.json({ ok: false, error: "Invalid project status." }, { status: 400 });
    }
    data.status = newStatus;
  }

  const project = await prisma.project.update({ where: { id: params.id }, data });

  if (data.status && data.status !== existing.status) {
    await writeAudit({
      actorUserId: admin.session.user?.id ?? null,
      action: AuditAction.PROJECT_STATUS_CHANGE,
      targetType: "PROJECT",
      targetId: params.id,
      metadata: { previousStatus: existing.status, newStatus: data.status },
    });
  }

  return NextResponse.json({ ok: true, project });
}
