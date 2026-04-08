import { getPrisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const prisma = getPrisma();
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const status = body?.status;
  const notes = body?.notes;

  const allowed = new Set(["PENDING", "REVIEWING", "APPROVED", "REJECTED"]);
  const data: { status?: any; notes?: string | null } = {};
  if (status && allowed.has(String(status))) data.status = String(status);
  if (notes !== undefined) data.notes = notes ? String(notes) : null;

  const updated = await prisma.application.update({
    where: { id: params.id },
    data
  });

  return NextResponse.json({ ok: true, application: updated });
}

