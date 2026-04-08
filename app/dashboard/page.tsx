import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardIndex() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");

  const prisma = getPrisma();
  const [nodeCount, projectCount, taskCount, pobPending, applicationCount] = await Promise.all([
    prisma.node.count(),
    prisma.project.count(),
    prisma.task.count(),
    prisma.poBRecord.count({ where: { status: "PENDING" } }),
    prisma.application.count()
  ]);

  return (
    <main className="section">
      <div className="container">
        <span className="eyebrow">Dashboard</span>
        <h1>WCN Admin</h1>
        <p className="muted">Phase 1 chain-pre collaboration network console.</p>

        <div className="grid-3" style={{ marginTop: 18 }}>
          <div className="card">
            <div className="pill" style={{ marginBottom: 10 }}>
              Registry
            </div>
            <p className="muted">Nodes: {nodeCount}</p>
            <p className="muted">Projects: {projectCount}</p>
            <p className="muted">Tasks: {taskCount}</p>
          </div>
          <div className="card">
            <div className="pill" style={{ marginBottom: 10 }}>
              Verification
            </div>
            <p className="muted">PoB pending: {pobPending}</p>
          </div>
          <div className="card">
            <div className="pill" style={{ marginBottom: 10 }}>
              Intake
            </div>
            <p className="muted">Node applications: {applicationCount}</p>
          </div>
        </div>

        <div className="grid-2" style={{ marginTop: 14 }}>
          <div className="card">
            <h3>Modules</h3>
            <div className="list-clean">
              <p style={{ margin: 0 }}>
                <Link href="/dashboard/nodes">Node registry</Link>
              </p>
              <p style={{ margin: 0, marginTop: 10 }}>
                <Link href="/dashboard/projects">Project pool</Link>
              </p>
              <p style={{ margin: 0, marginTop: 10 }}>
                <Link href="/dashboard/tasks">Task system</Link>
              </p>
              <p style={{ margin: 0, marginTop: 10 }}>
                <Link href="/dashboard/pob">PoB verification</Link>
              </p>
              <p style={{ margin: 0, marginTop: 10 }}>
                <Link href="/dashboard/applications">Node applications</Link>
              </p>
            </div>
          </div>
          <div className="card">
            <h3>Phase 1 definition</h3>
            <p className="muted" style={{ marginTop: 10 }}>
              Resource intake → task structuring → human + agent execution → evidence verification → PoB records → future
              settlement.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

