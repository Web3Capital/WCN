import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requireSignedIn, requirePermission } from "@/lib/admin";
import { apiOk, apiUnauthorized, apiForbidden } from "@/lib/core/api-response";
import { recalculateNodeReputation } from "@/lib/modules/reputation/calculator";
import { evaluateBadges } from "@/lib/modules/reputation/badges";

export async function GET(req: Request) {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);

  const leaderboard = await prisma.reputationScore.findMany({
    orderBy: { score: "desc" },
    take: limit,
    include: {
      node: { select: { id: true, name: true, type: true, status: true } },
    },
  });

  return apiOk(leaderboard);
}

export async function POST() {
  const auth = await requirePermission("manage", "node");
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const nodes = await prisma.node.findMany({
    where: { status: "LIVE" },
    select: { id: true },
  });

  const results: { nodeId: string; score: number; tier: string }[] = [];

  for (const node of nodes) {
    const r = await recalculateNodeReputation(prisma, node.id);
    await evaluateBadges(prisma, node.id);
    results.push({ nodeId: node.id, score: r.score, tier: r.tier });
  }

  return apiOk({ recalculated: results.length, results });
}
