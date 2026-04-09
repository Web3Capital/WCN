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
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  if (!isAdmin) {
    const ownedNodes = await prisma.node.findMany({
      where: { ownerUserId: auth.session.user?.id },
      select: { id: true },
    });
    where.nodeId = { in: ownedNodes.map((n) => n.id) };
  }

  const profiles = await prisma.capitalProfile.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { node: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ ok: true, profiles });
}

export async function POST(req: Request) {
  const auth = await requirePermission("create", "capital");
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const name = String(body?.name ?? "").trim();
  if (!name) return NextResponse.json({ ok: false, error: "Name required." }, { status: 400 });

  const profile = await prisma.capitalProfile.create({
    data: {
      name,
      entity: body?.entity ? String(body.entity) : null,
      investmentFocus: Array.isArray(body?.investmentFocus) ? body.investmentFocus.map((s: unknown) => String(s)) : [],
      ticketMin: body?.ticketMin != null ? Number(body.ticketMin) : null,
      ticketMax: body?.ticketMax != null ? Number(body.ticketMax) : null,
      jurisdictionLimit: Array.isArray(body?.jurisdictionLimit) ? body.jurisdictionLimit.map((s: unknown) => String(s)) : [],
      structurePref: Array.isArray(body?.structurePref) ? body.structurePref.map((s: unknown) => String(s)) : [],
      blacklist: Array.isArray(body?.blacklist) ? body.blacklist.map((s: unknown) => String(s)) : [],
      restrictions: body?.restrictions ? String(body.restrictions) : null,
      contactName: body?.contactName ? String(body.contactName) : null,
      contactEmail: body?.contactEmail ? String(body.contactEmail) : null,
      notes: body?.notes ? String(body.notes) : null,
      nodeId: body?.nodeId ? String(body.nodeId) : null,
    },
  });

  await writeAudit({
    actorUserId: auth.session.user?.id ?? null,
    action: AuditAction.CAPITAL_CREATE,
    targetType: "CAPITAL",
    targetId: profile.id,
    metadata: { name },
  });

  return NextResponse.json({ ok: true, profile });
}
