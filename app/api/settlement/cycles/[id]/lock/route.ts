import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const prisma = getPrisma();

  const cycle = await prisma.settlementCycle.update({
    where: { id: params.id },
    data: { status: "LOCKED" }
  });
  return NextResponse.json({ ok: true, cycle });
}

