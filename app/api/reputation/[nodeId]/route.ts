import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requireSignedIn } from "@/lib/admin";
import { apiOk, apiUnauthorized, apiNotFound } from "@/lib/core/api-response";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ nodeId: string }> },
) {
  const { nodeId } = await params;
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

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

  if (!score) return apiNotFound("Reputation score not found for this node");

  return apiOk({ score, badges, history });
}
