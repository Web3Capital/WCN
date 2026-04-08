import { getPrisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { TasksConsole } from "./ui";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  const prisma = getPrisma();
  const [tasks, projects, nodes] = await Promise.all([
    prisma.task.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { project: true, ownerNode: true, assignments: { include: { node: true } } }
    }),
    prisma.project.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.node.findMany({ orderBy: { createdAt: "desc" }, take: 200 })
  ]);

  return (
    <main className="section">
      <div className="container">
        <span className="eyebrow">Dashboard</span>
        <h1>Task system</h1>
        <p className="muted">Structure work into tasks, assign nodes, and track progress.</p>
        <div className="card" style={{ marginTop: 18 }}>
          <TasksConsole initial={tasks as any} projects={projects as any} nodes={nodes as any} />
        </div>
      </div>
    </main>
  );
}

