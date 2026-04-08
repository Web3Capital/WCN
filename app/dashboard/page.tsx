import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { getOwnedNodeIds, scopedSummaryCounts } from "@/lib/member-data-scope";

export const dynamic = "force-dynamic";

export default async function DashboardIndex() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const isAdmin = session.user.role === "ADMIN";
  const userId = session.user.id;
  const prisma = getPrisma();

  const [nodeCount, projectCount, taskCount, pobPending, applicationCount, myApplications, memberCounts] =
    await Promise.all([
      isAdmin ? prisma.node.count() : Promise.resolve(0),
      isAdmin ? prisma.project.count() : Promise.resolve(0),
      isAdmin ? prisma.task.count() : Promise.resolve(0),
      isAdmin ? prisma.poBRecord.count({ where: { status: "PENDING" } }) : Promise.resolve(0),
      isAdmin ? prisma.application.count() : Promise.resolve(0),
      prisma.application.count({ where: { userId } }),
      isAdmin
        ? Promise.resolve(null)
        : getOwnedNodeIds(prisma, userId).then((ids) => scopedSummaryCounts(prisma, userId, ids))
    ]);

  return (
    <div className="dashboard-page section">
      <div className="container">
        <span className="eyebrow">Dashboard</span>
        <h1>Console home</h1>
        <p className="muted">
          Phase 3 · settlement &amp; asset layer: formalized allocation, digital identity hooks, and long-horizon value
          records—built on Phase 1–2 network, tasks, PoB, agents, and off-chain settlement.
        </p>

        {!isAdmin && memberCounts ? (
          <div className="card" style={{ marginTop: 18 }}>
            <p className="muted" style={{ margin: 0 }}>
              Signed in as <strong>{session.user.name || session.user.email}</strong>. You see projects, tasks, and PoB
              linked to your nodes. Contact details are hidden unless the project belongs to your node. Editing and
              settlement actions require an <strong>ADMIN</strong> role.
            </p>
            <p className="muted" style={{ marginTop: 10, marginBottom: 0 }}>
              Your applications: {myApplications} · Owned nodes: {memberCounts.ownedNodes} · My projects:{" "}
              {memberCounts.scopedProjects} · My tasks: {memberCounts.scopedTasks} · My PoB: {memberCounts.scopedPoB}
            </p>
          </div>
        ) : null}

        <div className="grid-3" style={{ marginTop: 18 }}>
          <div className="card">
            <div className="pill" style={{ marginBottom: 10 }}>
              Registry
            </div>
            {isAdmin ? (
              <>
                <p className="muted">Nodes: {nodeCount}</p>
                <p className="muted">Projects: {projectCount}</p>
                <p className="muted">Tasks: {taskCount}</p>
              </>
            ) : memberCounts ? (
              <>
                <p className="muted">Owned nodes: {memberCounts.ownedNodes}</p>
                <p className="muted">My projects: {memberCounts.scopedProjects}</p>
                <p className="muted">My tasks: {memberCounts.scopedTasks}</p>
              </>
            ) : null}
          </div>
          <div className="card">
            <div className="pill" style={{ marginBottom: 10 }}>
              Verification
            </div>
            {isAdmin ? (
              <p className="muted">PoB pending: {pobPending}</p>
            ) : memberCounts ? (
              <p className="muted">My PoB records: {memberCounts.scopedPoB}</p>
            ) : null}
          </div>
          <div className="card">
            <div className="pill" style={{ marginBottom: 10 }}>
              Intake
            </div>
            {isAdmin ? (
              <p className="muted">Node applications: {applicationCount}</p>
            ) : (
              <p className="muted">Your applications: {myApplications}</p>
            )}
          </div>
        </div>

        <div className="grid-2" style={{ marginTop: 14 }}>
          <div className="card">
            <h3>My work</h3>
            <div className="list-clean">
              <p style={{ margin: 0 }}>
                <Link href="/dashboard/tasks">Tasks</Link>
                {!isAdmin ? <span className="muted"> · scoped to your nodes</span> : null}
              </p>
              <p style={{ margin: 0, marginTop: 10 }}>
                <Link href="/dashboard/projects">Projects</Link>
                {!isAdmin ? <span className="muted"> · scoped to your nodes</span> : null}
              </p>
              <p style={{ margin: 0, marginTop: 10 }}>
                <Link href="/dashboard/pob">PoB verification</Link>
                {!isAdmin ? <span className="muted"> · scoped to your nodes</span> : null}
              </p>
            </div>
          </div>
          <div className="card">
            <h3>All modules</h3>
            <div className="list-clean">
              <p style={{ margin: 0 }}>
                <Link href="/dashboard/nodes">Node registry</Link>
                {!isAdmin ? <span className="muted"> · read-only</span> : null}
              </p>
              <p style={{ margin: 0, marginTop: 10 }}>
                <Link href="/dashboard/agents">Agents</Link>
                {!isAdmin ? <span className="muted"> · scoped to your nodes</span> : null}
              </p>
              <p style={{ margin: 0, marginTop: 10 }}>
                <Link href="/dashboard/settlement">Settlement</Link>
                {!isAdmin ? <span className="muted"> · read-only</span> : null}
              </p>
              <p style={{ margin: 0, marginTop: 10 }}>
                <Link href="/dashboard/applications">Node applications</Link>
                {!isAdmin ? <span className="muted"> · your submissions</span> : null}
              </p>
              <p style={{ margin: 0, marginTop: 10 }}>
                <Link href="/dashboard/assets">Phase 3 · Assets &amp; on-chain proofs</Link>
                <span className="muted"> · roadmap</span>
              </p>
            </div>
          </div>
        </div>

        {isAdmin ? (
          <div className="card" style={{ marginTop: 14 }}>
            <h3>Release track</h3>
            <p className="muted" style={{ marginTop: 10 }}>
              Phase 1 — network MVP. Phase 2 — PoB depth, agents, periodic settlement. Phase 3 — formal settlement,
              identity digitization, and selective on-chain proofs (this console is aligned with that track).
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
