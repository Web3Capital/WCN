import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin, requireSignedIn } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";
import { isAdminRole } from "@/lib/permissions";

const ALLOWED_TYPES = new Set(["FREEZE", "SLASH", "DOWNGRADE"]);

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireSignedIn();
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const isAdmin = isAdminRole(auth.session.user?.role ?? "USER");

  if (!isAdmin) {
    const node = await prisma.node.findUnique({ where: { id: params.id }, select: { ownerUserId: true } });
    if (node?.ownerUserId !== auth.session.user!.id) {
      return NextResponse.json({ ok: false, error: "Access denied." }, { status: 403 });
    }
  }

  const penalties = await prisma.penalty.findMany({
    where: { nodeId: params.id },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ ok: true, penalties });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const type = String(body?.type ?? "").trim();
  if (!ALLOWED_TYPES.has(type)) {
    return NextResponse.json({ ok: false, error: "Invalid type. Must be FREEZE, SLASH, or DOWNGRADE." }, { status: 400 });
  }

  const reason = String(body?.reason ?? "").trim();
  if (!reason) return NextResponse.json({ ok: false, error: "Missing reason." }, { status: 400 });

  const penalty = await prisma.penalty.create({
    data: {
      nodeId: params.id,
      type: type as any,
      reason,
      amount: body?.amount !== undefined ? Number(body.amount) : null,
      metadata: body?.metadata ?? null
    }
  });

  await writeAudit({
    actorUserId: admin.session.user?.id ?? null,
    action: AuditAction.PENALTY_CREATE,
    targetType: "PENALTY",
    targetId: penalty.id,
    metadata: { nodeId: params.id, penaltyType: type, reason }
  });

  return NextResponse.json({ ok: true, penalty });
}
