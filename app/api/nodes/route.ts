import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin, requireSignedIn } from "@/lib/admin";
import { redactNodeForMember } from "@/lib/member-redact";
import { AuditAction, writeAudit } from "@/lib/audit";
import { isAdminRole } from "@/lib/permissions";

export async function GET(req: Request) {
  const auth = await requireSignedIn();
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const isAdmin = isAdminRole(auth.session.user?.role ?? "USER");
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const region = searchParams.get("region");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (type) where.type = type;
  if (region) where.region = region;

  const nodes = await prisma.node.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { owner: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json({
    ok: true,
    nodes: isAdmin ? nodes : nodes.map(redactNodeForMember),
  });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const name = String(body?.name ?? "").trim();
  const type = String(body?.type ?? "").trim();
  if (!name || !type) {
    return NextResponse.json({ ok: false, error: "Missing name/type." }, { status: 400 });
  }

  const allowedTypes = new Set(["GLOBAL", "REGION", "CITY", "INDUSTRY", "FUNCTIONAL", "AGENT"]);
  if (!allowedTypes.has(type)) {
    return NextResponse.json({ ok: false, error: "Invalid node type." }, { status: 400 });
  }

  const tags = Array.isArray(body?.tags) ? body.tags.map((t: unknown) => String(t).trim()).filter(Boolean) : [];
  const allowedServices = Array.isArray(body?.allowedServices) ? body.allowedServices.map((s: unknown) => String(s).trim()).filter(Boolean) : [];

  const node = await prisma.node.create({
    data: {
      name,
      type: type as any,
      description: body?.description ? String(body.description) : null,
      tags,
      region: body?.region ? String(body.region) : null,
      city: body?.city ? String(body.city) : null,
      jurisdiction: body?.jurisdiction ? String(body.jurisdiction) : null,
      level: body?.level ? Number(body.level) : 1,
      ownerUserId: body?.ownerUserId ? String(body.ownerUserId) : null,
      entityName: body?.entityName ? String(body.entityName) : null,
      entityType: body?.entityType ? String(body.entityType) : null,
      contactName: body?.contactName ? String(body.contactName) : null,
      contactEmail: body?.contactEmail ? String(body.contactEmail) : null,
      resourcesOffered: body?.resourcesOffered ? String(body.resourcesOffered) : null,
      pastCases: body?.pastCases ? String(body.pastCases) : null,
      recommendation: body?.recommendation ? String(body.recommendation) : null,
      allowedServices,
      riskLevel: body?.riskLevel ? String(body.riskLevel) : null,
    },
  });

  await writeAudit({
    actorUserId: admin.session.user?.id ?? null,
    action: AuditAction.NODE_CREATE,
    targetType: "NODE",
    targetId: node.id,
    metadata: { name, type },
  });

  return NextResponse.json({ ok: true, node });
}
