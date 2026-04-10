import { getPrisma } from "@/lib/prisma";
import { requireSignedIn } from "@/lib/admin";
import { redirect } from "next/navigation";
import { ReputationLeaderboard } from "./ui";

export const metadata = { title: "Reputation Leaderboard – WCN" };

export default async function ReputationPage() {
  const auth = await requireSignedIn();
  if (!auth.ok) redirect("/login");

  const prisma = getPrisma();

  const scores = await prisma.reputationScore.findMany({
    orderBy: { score: "desc" },
    take: 50,
    include: {
      node: { select: { id: true, name: true, type: true, status: true } },
    },
  });

  const nodeIds = scores.map((s) => s.nodeId);
  const badges = nodeIds.length > 0
    ? await prisma.reputationBadge.findMany({ where: { nodeId: { in: nodeIds } } })
    : [];

  const badgesByNode = new Map<string, typeof badges>();
  for (const b of badges) {
    const list = badgesByNode.get(b.nodeId) ?? [];
    list.push(b);
    badgesByNode.set(b.nodeId, list);
  }

  const leaderboard = scores.map((s) => ({
    ...s,
    breakdown: (s as any).components ?? null,
    node: {
      ...s.node,
      badges: (badgesByNode.get(s.nodeId) ?? []).map((b) => ({ id: b.id, badge: b.badgeType, awardedAt: b.awardedAt.toISOString() })),
    },
  }));

  return (
    <>
      <div className="page-header">
        <h1>Reputation Leaderboard</h1>
        <p className="muted">Node reputation scores ranked by composite performance.</p>
      </div>
      <ReputationLeaderboard entries={JSON.parse(JSON.stringify(leaderboard))} />
    </>
  );
}
