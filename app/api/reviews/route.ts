import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { apiOk, apiUnauthorized } from "@/lib/core/api-response";
import type { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  const auth = await requirePermission("read", "review");
  if (!auth.ok) return apiUnauthorized();

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
    include: { reviewer: { select: { id: true, name: true, email: true } } },
  });

  return apiOk(reviews);
}
