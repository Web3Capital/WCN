import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const data: any = {};
  if (body?.name !== undefined) data.name = String(body.name).trim();
  if (body?.endpoint !== undefined) data.endpoint = body.endpoint ? String(body.endpoint) : null;
  if (body?.status !== undefined) {
    const status = String(body.status);
    const allowed = new Set(["ACTIVE", "DISABLED"]);
    if (!allowed.has(status)) return NextResponse.json({ ok: false, error: "Invalid status." }, { status: 400 });
    data.status = status;
  }

  const agent = await prisma.agent.update({
    where: { id: params.id },
    data,
    include: { ownerNode: true, permissions: true }
  });
  return NextResponse.json({ ok: true, agent });
}

