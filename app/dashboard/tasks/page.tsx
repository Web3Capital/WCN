import { getPrisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ReadOnlyBanner } from "@/app/dashboard/_components/read-only-banner";
import { TasksConsole } from "./ui";
import { getOwnedNodeIds, memberTasksWhere, memberProjectsWhere } from "@/lib/member-data-scope";
import { redactTaskForMember, redactNodeForMember } from "@/lib/member-redact";
import { isAdminRole } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const isAdmin = isAdminRole(session.user.role);
  const userId = session.user.id;

  const prisma = getPrisma();
  const ownedNodeIds = isAdmin ? [] : await getOwnedNodeIds(prisma, userId);
  const taskWhere = isAdmin ? {} : memberTasksWhere(ownedNodeIds);
  const projectWhere = isAdmin ? {} : memberProjectsWhere(ownedNodeIds);

  const [tasks, projects, nodes] = await Promise.all([
    prisma.task.findMany({
      where: taskWhere,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { project: { include: { node: true } }, ownerNode: true, assignments: { include: { node: true } } }
    }),
    prisma.project.findMany({ where: projectWhere, orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.node.findMany({ orderBy: { createdAt: "desc" }, take: 200 })
  ]);

  const safeTasks = isAdmin ? tasks : tasks.map((t) => redactTaskForMember(t, userId));
  const safeNodes = isAdmin ? nodes : nodes.map(redactNodeForMember);

  return (
    <div className="dashboard-page section">
      <div className="container">
        <span className="eyebrow">Work</span>
        <h1>Task system</h1>
        <p className="muted">Structure work into tasks, assign nodes, and track progress.</p>
        {!isAdmin ? <ReadOnlyBanner /> : null}
        <div className="card" style={{ marginTop: 18 }}>
          <TasksConsole initial={safeTasks as any} projects={projects as any} nodes={safeNodes as any} readOnly={!isAdmin} />
        </div>
      </div>
    </div>
  );
}

