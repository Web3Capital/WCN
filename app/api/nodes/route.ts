import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin, requireSignedIn } from "@/lib/admin";
import { NodeStatus } from "@prisma/client";
import { redactNodeForMember } from "@/lib/member-redact";
import { AuditAction, writeAudit } from "@/lib/audit";

export async function GET() {
  const auth = await requireSignedIn();
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const isAdmin = auth.session.user?.role === "ADMIN";

  const nodes = await prisma.node.findMany({
    orderBy: { createdAt: "desc" },
    take: 200
  });

  return NextResponse.json({
    ok: true,
    nodes: isAdmin ? nodes : nodes.map(redactNodeForMember)
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

  const tags = Array.isArray(body?.tags) ? body.tags.map((t: any) => String(t).trim()).filter(Boolean) : [];

  let status: NodeStatus | undefined = undefined;
  if (body?.status) {
    const s = String(body.status);
    const allowed = new Set(["DRAFT", "SUBMITTED", "ACTIVE", "SUSPENDED", "REJECTED"]);
    if (!allowed.has(s)) {
      return NextResponse.json({ ok: false, error: "Invalid node status." }, { status: 400 });
    }
    status = s as NodeStatus;
  }

  const node = await prisma.node.create({
    data: {
      name,
      type: type as any,
      status,
      description: body?.description ? String(body.description) : null,
      tags,
      region: body?.region ? String(body.region) : null,
      city: body?.city ? String(body.city) : null,
      jurisdiction: body?.jurisdiction ? String(body.jurisdiction) : null,
      level: body?.level ? Number(body.level) : 1,
      ownerUserId: body?.ownerUserId ? String(body.ownerUserId) : null
    }
  });

  await writeAudit({
    actorUserId: admin.session.user?.id ?? null,
    action: AuditAction.NODE_CREATE,
    targetType: "NODE",
    targetId: node.id,
    metadata: { name, type }
  });

  return NextResponse.json({ ok: true, node });
}

