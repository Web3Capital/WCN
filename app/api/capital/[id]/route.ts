import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requirePermission, requireSignedIn } from "@/lib/admin";
import { isAdminRole } from "@/lib/permissions";
import { AuditAction, writeAudit } from "@/lib/audit";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireSignedIn();
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const profile = await prisma.capitalProfile.findUnique({
    where: { id: params.id },
    include: {
      node: { select: { id: true, name: true, ownerUserId: true } },
      deals: { select: { id: true, title: true, stage: true }, take: 20 },
    },
  });

  if (!profile) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  const isAdmin = isAdminRole(auth.session.user?.role ?? "USER");
  if (!isAdmin && profile.node?.ownerUserId !== auth.session.user?.id) {
    const redacted = { ...profile, contactEmail: null, restrictions: null, blacklist: [] };
    return NextResponse.json({ ok: true, profile: redacted });
  }

  return NextResponse.json({ ok: true, profile });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requirePermission("update", "capital");
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const existing = await prisma.capitalProfile.findUnique({ where: { id: params.id }, select: { id: true, status: true } });
  if (!existing) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  const data: Record<string, unknown> = {};

  const stringFields = ["name", "entity", "restrictions", "contactName", "contactEmail", "notes"] as const;
  for (const f of stringFields) {
    if (body?.[f] !== undefined) data[f] = body[f] ? String(body[f]).trim() : null;
  }

  if (body?.status !== undefined) data.status = String(body.status);
  if (body?.ticketMin !== undefined) data.ticketMin = body.ticketMin != null ? Number(body.ticketMin) : null;
  if (body?.ticketMax !== undefined) data.ticketMax = body.ticketMax != null ? Number(body.ticketMax) : null;
  if (body?.responseSpeed !== undefined) data.responseSpeed = body.responseSpeed != null ? Number(body.responseSpeed) : null;
  if (body?.activityScore !== undefined) data.activityScore = body.activityScore != null ? Number(body.activityScore) : null;
  if (body?.nodeId !== undefined) data.nodeId = body.nodeId ? String(body.nodeId) : null;

  const arrayFields = ["investmentFocus", "jurisdictionLimit", "structurePref", "blacklist"] as const;
  for (const f of arrayFields) {
    if (body?.[f] !== undefined) {
      data[f] = Array.isArray(body[f]) ? body[f].map((s: unknown) => String(s)) : [];
    }
  }

  const profile = await prisma.capitalProfile.update({ where: { id: params.id }, data });

  if (data.status && data.status !== existing.status) {
    await writeAudit({
      actorUserId: auth.session.user?.id ?? null,
      action: AuditAction.CAPITAL_STATUS_CHANGE,
      targetType: "CAPITAL",
      targetId: params.id,
      metadata: { previousStatus: existing.status, newStatus: data.status },
    });
  }

  return NextResponse.json({ ok: true, profile });
}
