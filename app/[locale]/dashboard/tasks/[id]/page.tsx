import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { isAdminRole, can } from "@/lib/permissions";
import { getOwnedNodeIds, memberTasksWhere } from "@/lib/member-data-scope";
import { TaskDetail } from "./ui";

export const dynamic = "force-dynamic";

export default async function TaskDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const prisma = getPrisma();
  const isAdmin = isAdminRole(session.user.role);

  if (!isAdmin) {
    const ownedNodeIds = await getOwnedNodeIds(prisma, session.user.id);
    const scoped = await prisma.task.findFirst({
      where: { id: params.id, ...memberTasksWhere(ownedNodeIds) },
      select: { id: true },
    });
    if (!scoped) redirect("/dashboard/tasks");
  }

  const task = await prisma.task.findUnique({
    where: { id: params.id },
    include: {
      project: { select: { id: true, name: true, status: true } },
      ownerNode: { select: { id: true, name: true } },
      deal: { select: { id: true, title: true, stage: true } },
      assignments: { include: { node: { select: { id: true, name: true } } } },
      evidences: { select: { id: true, title: true, type: true, reviewStatus: true, createdAt: true }, take: 30, orderBy: { createdAt: "desc" } },
      pobRecords: { select: { id: true, businessType: true, status: true, score: true }, take: 10 },
      agentRuns: { select: { id: true, status: true, cost: true, startedAt: true, finishedAt: true }, take: 10, orderBy: { startedAt: "desc" } },
    },
  });

  if (!task) redirect("/dashboard/tasks");

  return (
    <div className="dashboard-page section">
      <div className="container">
        <TaskDetail task={JSON.parse(JSON.stringify(task))} isAdmin={isAdmin} canReviewEvidence={can(session.user.role, "review", "evidence")} />
      </div>
    </div>
  );
}
