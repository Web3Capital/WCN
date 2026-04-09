import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requirePermission("update", "deal");
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));
  const nodeId = body?.nodeId ? String(body.nodeId) : null;
  const role = String(body?.role ?? "participant");

  if (!nodeId) return NextResponse.json({ ok: false, error: "nodeId required." }, { status: 400 });

  const participant = await prisma.dealParticipant.upsert({
    where: { dealId_nodeId: { dealId: params.id, nodeId } },
    create: { dealId: params.id, nodeId, role, userId: body?.userId ?? null },
    update: { role },
    include: { node: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ ok: true, participant });
}
