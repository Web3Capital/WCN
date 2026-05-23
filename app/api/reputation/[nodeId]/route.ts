import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { HttpError, route } from "@/lib/core/api/route";
import { z } from "zod";

const emptyInputSchema = z.object({});

export const GET = route.session<z.infer<typeof emptyInputSchema>, unknown, { nodeId: string }>({
  input: emptyInputSchema,
  rateLimit: "auth",
  handler: async ({ params }) => {
    const { nodeId } = params;
    const prisma = getPrisma();

    const [score, badges, history] = await Promise.all([
      prisma.reputationScore.findUnique({
        where: { nodeId },
        include: { node: { select: { name: true, type: true } } },
      }),
      prisma.reputationBadge.findMany({
        where: { nodeId },
        orderBy: { awardedAt: "desc" },
      }),
      prisma.reputationHistory.findMany({
        where: { nodeId },
        orderBy: { snapshotAt: "desc" },
        take: 30,
      }),
    ]);

    if (!score) throw new HttpError(404, "NOT_FOUND", "Reputation score not found for this node not found.");

    return { score, badges, history };
  },
});
