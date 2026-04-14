import { getPrisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { TasksConsole } from "./ui";
import { getOwnedNodeIds, memberTasksWhere, memberProjectsWhere } from "@/lib/member-data-scope";
import { redactTaskForMember, redactNodeForMember } from "@/lib/member-redact";
import { isAdminRole } from "@/lib/permissions";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";

export const dynamic = "force-dynamic";

export const metadata = dashboardMeta("Tasks", "Task management");

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
      include: { project: { select: { id: true, name: true } }, ownerNode: { select: { id: true, name: true } }, assignments: { include: { node: true } } },
    }),
    prisma.project.findMany({ where: projectWhere, orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.node.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
  ]);

  const safeTasks = isAdmin ? tasks : tasks.map((t) => redactTaskForMember(t, userId));
  const safeNodes = isAdmin ? nodes : nodes.map(redactNodeForMember);

  return (
    <div className="dashboard-page section">
      <div className="container-wide">
        <span className="eyebrow"><T>Work</T></span>
        <h1><T>Task Management</T></h1>
        <p className="muted" style={{ maxWidth: 600 }}>
          <T>Structure work into tasks, assign nodes, and track progress across the network.</T>
        </p>
        <div style={{ marginTop: 24 }}>
          <TasksConsole
            initial={JSON.parse(JSON.stringify(safeTasks))}
            projects={JSON.parse(JSON.stringify(projects))}
            nodes={JSON.parse(JSON.stringify(safeNodes))}
            readOnly={!isAdmin}
          />
        </div>
      </div>
    </div>
  );
}
