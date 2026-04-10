import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { ReviewQueueUI } from "./ui";

export const dynamic = "force-dynamic";

export default async function AgentReviewQueuePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const isAdmin = isAdminRole(session.user.role);
  if (!isAdmin) redirect("/dashboard/agents");

  const prisma = getPrisma();
  const pendingRuns = await prisma.agentRun.findMany({
    where: { status: "SUCCESS", reviewStatus: "PENDING" as any },
    orderBy: { finishedAt: "desc" },
    take: 50,
    include: {
      agent: { select: { id: true, name: true, type: true } },
      task: { select: { id: true, title: true } },
    },
  });

  const recentReviewed = await prisma.agentRun.findMany({
    where: { reviewStatus: { in: ["APPROVED", "MODIFIED", "REJECTED"] as any[] } },
    orderBy: { finishedAt: "desc" },
    take: 20,
    include: {
      agent: { select: { id: true, name: true, type: true } },
      reviewedBy: { select: { name: true } },
    },
  });

  return (
    <div className="dashboard-page section">
      <div className="container">
        <ReviewQueueUI
          pendingRuns={JSON.parse(JSON.stringify(pendingRuns))}
          recentReviewed={JSON.parse(JSON.stringify(recentReviewed))}
        />
      </div>
    </div>
  );
}
