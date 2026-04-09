import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { getOwnedNodeIds, scopedSummaryCounts } from "@/lib/member-data-scope";
import { isAdminRole } from "@/lib/permissions";
import { Network, FolderKanban, ShieldCheck, Plus, Scale, Inbox, Handshake, Landmark, ListTodo } from "lucide-react";

export const dynamic = "force-dynamic";

function roleLabel(role: string): string {
  const map: Record<string, string> = {
    FOUNDER: "Founder", ADMIN: "Admin", FINANCE_ADMIN: "Finance Admin",
    NODE_OWNER: "Node Owner", PROJECT_OWNER: "Project Owner", CAPITAL_NODE: "Capital Node",
    SERVICE_NODE: "Service Node", REVIEWER: "Reviewer", AGENT_OWNER: "Agent Owner",
    OBSERVER: "Observer", USER: "Member",
  };
  return map[role] || role;
}

export default async function DashboardIndex() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const isAdmin = isAdminRole(session.user.role);
  const userId = session.user.id;
  const role = session.user.role;
  const prisma = getPrisma();

  const [
    nodeCount, projectCount, taskCount, pobPending, applicationCount,
    capitalCount, dealCount, myApplications, memberCounts, recentAudit
  ] = await Promise.all([
    isAdmin ? prisma.node.count() : Promise.resolve(0),
    isAdmin ? prisma.project.count() : Promise.resolve(0),
    isAdmin ? prisma.task.count() : Promise.resolve(0),
    isAdmin ? prisma.poBRecord.count({ where: { status: "PENDING" } }) : Promise.resolve(0),
    isAdmin ? prisma.application.count() : Promise.resolve(0),
    isAdmin ? prisma.capitalProfile.count() : Promise.resolve(0),
    isAdmin ? prisma.deal.count() : Promise.resolve(0),
    prisma.application.count({ where: { userId } }),
    isAdmin
      ? Promise.resolve(null)
      : getOwnedNodeIds(prisma, userId).then((ids) => scopedSummaryCounts(prisma, userId, ids)),
    isAdmin
      ? prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { actor: { select: { name: true, email: true } } } })
      : Promise.resolve([])
  ]);

  return (
    <div className="dashboard-page section">
      <div className="container">
        <span className="eyebrow">My Workspace</span>
        <h1>Welcome back</h1>
        <p className="muted">
          {roleLabel(role)} · WCN Operating Console
        </p>

        {!isAdmin && memberCounts ? (
          <div className="card" style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 14 }}>
            <div className="user-avatar" style={{ width: 40, height: 40, fontSize: 16, flexShrink: 0 }}>
              {(session.user.name || session.user.email || "?").charAt(0).toUpperCase()}
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: "var(--text)" }}>{session.user.name || session.user.email}</p>
              <p className="muted" style={{ margin: "4px 0 0", fontSize: 13 }}>
                Nodes: {memberCounts.ownedNodes} · Projects: {memberCounts.scopedProjects} · Tasks: {memberCounts.scopedTasks} · PoB: {memberCounts.scopedPoB}
              </p>
            </div>
          </div>
        ) : null}

        <div className="grid-4 card-grid-animated" style={{ marginTop: 18 }}>
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span className="badge badge-accent">Registry</span>
              <Network size={18} style={{ color: "var(--muted)" }} />
            </div>
            <div className="stat-number">{isAdmin ? nodeCount : (memberCounts?.ownedNodes ?? 0)}</div>
            <div className="stat-label">{isAdmin ? "Nodes" : "Your nodes"}</div>
          </div>

          <div className="card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span className="badge badge-green">Projects</span>
              <FolderKanban size={18} style={{ color: "var(--muted)" }} />
            </div>
            <div className="stat-number">{isAdmin ? projectCount : (memberCounts?.scopedProjects ?? 0)}</div>
            <div className="stat-label">{isAdmin ? "Projects" : "Your projects"}</div>
          </div>

          <div className="card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span className="badge badge-amber">Verification</span>
              <ShieldCheck size={18} style={{ color: "var(--muted)" }} />
            </div>
            <div className="stat-number">{isAdmin ? pobPending : (memberCounts?.scopedPoB ?? 0)}</div>
            <div className="stat-label">{isAdmin ? "PoB pending" : "Your PoB"}</div>
          </div>

          <div className="card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span className="badge badge-purple">Deals</span>
              <Handshake size={18} style={{ color: "var(--muted)" }} />
            </div>
            <div className="stat-number">{isAdmin ? dealCount : 0}</div>
            <div className="stat-label">{isAdmin ? "Active deals" : "Your deals"}</div>
          </div>
        </div>

        {isAdmin ? (
          <div className="grid-4" style={{ marginTop: 14 }}>
            <Link href="/dashboard/nodes" className="quick-action">
              <div className="quick-action-icon"><Plus size={18} /></div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>Create node</div>
                <div className="muted" style={{ fontSize: 11 }}>New network participant</div>
              </div>
            </Link>
            <Link href="/dashboard/projects" className="quick-action">
              <div className="quick-action-icon"><FolderKanban size={18} /></div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>New project</div>
                <div className="muted" style={{ fontSize: 11 }}>Start project workflow</div>
              </div>
            </Link>
            <Link href="/dashboard/capital" className="quick-action">
              <div className="quick-action-icon"><Landmark size={18} /></div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>Add capital</div>
                <div className="muted" style={{ fontSize: 11 }}>New investor profile</div>
              </div>
            </Link>
            <Link href="/dashboard/settlement" className="quick-action">
              <div className="quick-action-icon"><Scale size={18} /></div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>Settlement</div>
                <div className="muted" style={{ fontSize: 11 }}>Run allocation cycles</div>
              </div>
            </Link>
          </div>
        ) : null}

        <div className="grid-2" style={{ marginTop: 14 }}>
          <div className="card">
            <h3>My work</h3>
            <div style={{ display: "grid", gap: 10 }}>
              <Link href="/dashboard/tasks" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                <span className="status-dot status-dot-accent" /> Tasks
                {isAdmin ? <span className="muted" style={{ fontSize: 12 }}> · {taskCount} total</span> : <span className="muted" style={{ fontSize: 12 }}> · scoped to your nodes</span>}
              </Link>
              <Link href="/dashboard/projects" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                <span className="status-dot status-dot-green" /> Projects
              </Link>
              <Link href="/dashboard/deals" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                <span className="status-dot status-dot-purple" /> Deal Room
              </Link>
              <Link href="/dashboard/pob" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                <span className="status-dot status-dot-amber" /> Proof Desk
              </Link>
            </div>
          </div>
          <div className="card">
            <h3>All modules</h3>
            <div style={{ display: "grid", gap: 10 }}>
              <Link href="/dashboard/nodes" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                <span className="status-dot status-dot-green" /> Node registry
              </Link>
              <Link href="/dashboard/capital" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                <span className="status-dot status-dot-purple" /> Capital pool
                {isAdmin ? <span className="muted" style={{ fontSize: 12 }}> · {capitalCount} profiles</span> : null}
              </Link>
              <Link href="/dashboard/agents" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                <span className="status-dot status-dot-accent" /> Agents
              </Link>
              <Link href="/dashboard/settlement" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                <span className="status-dot status-dot-amber" /> Settlement
              </Link>
              <Link href="/dashboard/applications" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                <span className="status-dot" /> Applications
                {isAdmin ? <span className="muted" style={{ fontSize: 12 }}> · {applicationCount}</span> : <span className="muted" style={{ fontSize: 12 }}> · {myApplications}</span>}
              </Link>
            </div>
          </div>
        </div>

        {isAdmin && recentAudit.length > 0 ? (
          <div className="card" style={{ marginTop: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <h3 style={{ margin: 0 }}>Recent activity</h3>
              <Link href="/dashboard/audit" className="muted" style={{ fontSize: 13 }}>View all →</Link>
            </div>
            <div className="timeline">
              {(recentAudit as any[]).map((log: any) => (
                <div key={log.id} className="timeline-item">
                  <span className="timeline-dot" />
                  <div className="timeline-content">
                    <div className="timeline-action">{log.action.replace(/_/g, " ")}</div>
                    <div className="timeline-meta">
                      {log.actor?.name || log.actor?.email || "System"} · {log.targetType} · {new Date(log.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
