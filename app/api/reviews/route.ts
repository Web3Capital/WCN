import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { route } from "@/lib/core/api/route";
import type { Prisma } from "@prisma/client";
import { z } from "zod";

const reviewQuerySchema = z.object({
  targetType: z.enum(["NODE", "PROJECT", "TASK", "POB", "APPLICATION", "DEAL", "CAPITAL", "EVIDENCE"]).optional(),
  targetId: z.string().optional(),
});

export const GET = route.permission({
  input: reviewQuerySchema,
  rateLimit: "auth",
  permission: { action: "read", resource: "review" },
  handler: async ({ input }) => {
    const where: Prisma.ReviewWhereInput = {};
    if (input.targetType) where.targetType = input.targetType;
    if (input.targetId) where.targetId = input.targetId;

    const prisma = getPrisma();
    const reviews = await prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { reviewer: { select: { id: true, name: true, email: true } } },
    });

    return reviews;
  },
});
