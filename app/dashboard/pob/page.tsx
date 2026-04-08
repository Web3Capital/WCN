import { getPrisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { PobConsole } from "./ui";

export const dynamic = "force-dynamic";

export default async function PobPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  const prisma = getPrisma();
  const [pob, tasks, projects, nodes] = await Promise.all([
    prisma.poBRecord.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { task: true, project: true, node: true }
    }),
    prisma.task.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.project.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.node.findMany({ orderBy: { createdAt: "desc" }, take: 200 })
  ]);

  return (
    <main className="section">
      <div className="container">
        <span className="eyebrow">Dashboard</span>
        <h1>PoB verification</h1>
        <p className="muted">Record and review proof-of-business outcomes.</p>
        <div className="card" style={{ marginTop: 18 }}>
          <PobConsole initial={pob as any} tasks={tasks as any} projects={projects as any} nodes={nodes as any} />
        </div>
      </div>
    </main>
  );
}

