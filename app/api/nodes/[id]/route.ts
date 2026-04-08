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
  if (body?.description !== undefined) data.description = body.description ? String(body.description) : null;
  if (body?.region !== undefined) data.region = body.region ? String(body.region) : null;
  if (body?.city !== undefined) data.city = body.city ? String(body.city) : null;
  if (body?.jurisdiction !== undefined) data.jurisdiction = body.jurisdiction ? String(body.jurisdiction) : null;
  if (body?.level !== undefined) data.level = Number(body.level);
  if (body?.ownerUserId !== undefined) data.ownerUserId = body.ownerUserId ? String(body.ownerUserId) : null;

  if (body?.type !== undefined) {
    const type = String(body.type);
    const allowedTypes = new Set(["GLOBAL", "REGION", "CITY", "INDUSTRY", "FUNCTIONAL", "AGENT"]);
    if (!allowedTypes.has(type)) {
      return NextResponse.json({ ok: false, error: "Invalid node type." }, { status: 400 });
    }
    data.type = type;
  }

  if (body?.status !== undefined) {
    const status = String(body.status);
    const allowed = new Set(["DRAFT", "SUBMITTED", "ACTIVE", "SUSPENDED", "REJECTED"]);
    if (!allowed.has(status)) {
      return NextResponse.json({ ok: false, error: "Invalid node status." }, { status: 400 });
    }
    data.status = status;
  }

  if (body?.tags !== undefined) {
    data.tags = Array.isArray(body.tags) ? body.tags.map((t: any) => String(t).trim()).filter(Boolean) : [];
  }

  const node = await prisma.node.update({
    where: { id: params.id },
    data
  });

  return NextResponse.json({ ok: true, node });
}

