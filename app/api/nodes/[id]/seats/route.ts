import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin, requireSignedIn } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireSignedIn();
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const isAdmin = auth.session.user?.role === "ADMIN";

  if (!isAdmin) {
    const node = await prisma.node.findUnique({ where: { id: params.id }, select: { ownerUserId: true } });
    if (node?.ownerUserId !== auth.session.user!.id) {
      return NextResponse.json({ ok: false, error: "Access denied." }, { status: 403 });
    }
  }

  const seats = await prisma.nodeSeat.findMany({
    where: { nodeId: params.id },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ ok: true, seats });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const level = Number(body?.level ?? 1);
  const status = body?.status ? String(body.status) : "ACTIVE";

  const seat = await prisma.nodeSeat.create({
    data: { nodeId: params.id, level, status }
  });

  await writeAudit({
    actorUserId: admin.session.user?.id ?? null,
    action: AuditAction.NODE_SEAT_CREATE,
    targetType: "NODE_SEAT",
    targetId: seat.id,
    metadata: { nodeId: params.id, level, status }
  });

  return NextResponse.json({ ok: true, seat });
}
