import { getPrisma } from "@/lib/prisma";
import { requireSignedIn } from "@/lib/admin";
import { redirect } from "next/navigation";
import { ReputationLeaderboard } from "./ui";

export const metadata = { title: "Reputation Leaderboard – WCN" };

export default async function ReputationPage() {
  const auth = await requireSignedIn();
  if (!auth.ok) redirect("/login");

  const prisma = getPrisma();

  const leaderboard = await prisma.reputationScore.findMany({
    orderBy: { score: "desc" },
    take: 50,
    include: {
      node: { select: { id: true, name: true, type: true, status: true } },
    },
  });

  return (
    <>
      <div className="page-header">
        <h1>Reputation Leaderboard</h1>
        <p className="muted">Node reputation scores ranked by composite performance.</p>
      </div>
      <ReputationLeaderboard entries={leaderboard as any} />
    </>
  );
}
