import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const data: any = {};
  if (body?.notes !== undefined) data.notes = body.notes ? String(body.notes) : null;

  if (body?.status !== undefined) {
    const status = String(body.status);
    const allowed = new Set(["PENDING", "REVIEWING", "APPROVED", "REJECTED"]);
    if (!allowed.has(status)) {
      return NextResponse.json({ ok: false, error: "Invalid status." }, { status: 400 });
    }
    data.status = status;
  }

  const record = await prisma.poBRecord.update({ where: { id: params.id }, data });
  return NextResponse.json({ ok: true, record });
}

