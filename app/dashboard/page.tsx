import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardIndex() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const isAdmin = session.user.role === "ADMIN";
  const prisma = getPrisma();

  const [nodeCount, projectCount, taskCount, pobPending, applicationCount, myApplications, myNodes] =
    await Promise.all([
      isAdmin ? prisma.node.count() : Promise.resolve(0),
      isAdmin ? prisma.project.count() : Promise.resolve(0),
      isAdmin ? prisma.task.count() : Promise.resolve(0),
      isAdmin ? prisma.poBRecord.count({ where: { status: "PENDING" } }) : Promise.resolve(0),
      isAdmin ? prisma.application.count() : Promise.resolve(0),
      prisma.application.count({ where: { userId: session.user.id } }),
      prisma.node.count({ where: { ownerUserId: session.user.id } })
    ]);

  return (
    <main className="section">
      <div className="container">
        <span className="eyebrow">Dashboard</span>
        <h1 style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: 12 }}>
          WCN Console
          {isAdmin ? (
            <span className="pill" style={{ fontSize: 12, letterSpacing: "0.06em" }}>
              Admin
            </span>
          ) : (
            <span className="pill" style={{ fontSize: 12, letterSpacing: "0.06em" }}>
              Member
            </span>
          )}
        </h1>
        <p className="muted">
          Phase 3 · settlement &amp; asset layer: formalized allocation, digital identity hooks, and long-horizon value
          records—built on Phase 1–2 network, tasks, PoB, agents, and off-chain settlement.
        </p>

        {!isAdmin ? (
          <div className="card" style={{ marginTop: 18 }}>
            <p className="muted" style={{ margin: 0 }}>
              You are signed in as <strong>{session.user.name || session.user.email}</strong>. All modules below are
              available to browse; only administrators can change registry data, reviews, and settlement runs.
            </p>
            <p className="muted" style={{ marginTop: 10, marginBottom: 0 }}>
              Your applications: {myApplications} · Nodes linked to you: {myNodes}
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
            ) : (
              <p className="muted">Open the Node registry module to see structure (admin-only edits).</p>
            )}
          </div>
          <div className="card">
            <div className="pill" style={{ marginBottom: 10 }}>
              Verification
            </div>
            {isAdmin ? (
              <p className="muted">PoB pending: {pobPending}</p>
            ) : (
              <p className="muted">PoB and evidence flows are visible in-console; actions require admin.</p>
            )}
          </div>
          <div className="card">
            <div className="pill" style={{ marginBottom: 10 }}>
              Intake
            </div>
            {isAdmin ? (
              <p className="muted">Node applications: {applicationCount}</p>
            ) : (
              <p className="muted">Track your own applications under Node applications.</p>
            )}
          </div>
        </div>

        <div className="grid-2" style={{ marginTop: 14 }}>
          <div className="card">
            <h3>Modules</h3>
            <div className="list-clean">
              <p style={{ margin: 0 }}>
                <Link href="/dashboard/nodes">Node registry</Link>
                {!isAdmin ? <span className="muted"> · read-only</span> : null}
              </p>
              <p style={{ margin: 0, marginTop: 10 }}>
                <Link href="/dashboard/projects">Project pool</Link>
                {!isAdmin ? <span className="muted"> · read-only</span> : null}
              </p>
              <p style={{ margin: 0, marginTop: 10 }}>
                <Link href="/dashboard/tasks">Task system</Link>
                {!isAdmin ? <span className="muted"> · read-only</span> : null}
              </p>
              <p style={{ margin: 0, marginTop: 10 }}>
                <Link href="/dashboard/pob">PoB verification</Link>
                {!isAdmin ? <span className="muted"> · read-only</span> : null}
              </p>
              <p style={{ margin: 0, marginTop: 10 }}>
                <Link href="/dashboard/agents">Agents</Link>
                {!isAdmin ? <span className="muted"> · read-only</span> : null}
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
          <div className="card">
            <h3>Release track</h3>
            <p className="muted" style={{ marginTop: 10 }}>
              Phase 1 — network MVP. Phase 2 — PoB depth, agents, periodic settlement. Phase 3 — formal settlement,
              identity digitization, and selective on-chain proofs (this console is aligned with that track).
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
