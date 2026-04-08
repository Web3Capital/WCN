import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import type { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const targetType = url.searchParams.get("targetType");
  const targetId = url.searchParams.get("targetId");

  const where: Prisma.ReviewWhereInput = {};
  if (targetType) where.targetType = targetType as any;
  if (targetId) where.targetId = targetId;

  const prisma = getPrisma();
  const reviews = await prisma.review.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { reviewer: { select: { id: true, name: true, email: true } } }
  });

  return NextResponse.json({ ok: true, reviews });
}
