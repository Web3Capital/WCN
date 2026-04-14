import { Link } from "@/i18n/routing";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { getOwnedNodeIds, scopedSummaryCounts } from "@/lib/member-data-scope";
import { isAdminRole } from "@/lib/permissions";
import { Network, FolderKanban, ShieldCheck, Plus, Scale, Inbox, Handshake, Landmark, ListTodo } from "lucide-react";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";

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


export const metadata = dashboardMeta("Dashboard", "WCN console overview");
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
      <div className="container-wide">
        <span className="eyebrow"><T>Overview</T></span>
        <h1><T>Welcome back</T></h1>
        <p className="muted">
          {roleLabel(role)} · WCN Operating Console
        </p>

        {!isAdmin && memberCounts ? (
          <div className="card profile-bar mt-18">
            <div className="user-avatar" style={{ width: 40, height: 40, fontSize: 16, flexShrink: 0 }}>
              {(session.user.name || session.user.email || "?").charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="profile-name mt-0 mb-0">{session.user.name || session.user.email}</p>
              <p className="muted profile-meta mt-0 mb-0">
                Nodes: {memberCounts.ownedNodes} · Projects: {memberCounts.scopedProjects} · Tasks: {memberCounts.scopedTasks} · PoB: {memberCounts.scopedPoB}
              </p>
            </div>
          </div>
        ) : null}

        <div className="grid-4 card-grid-animated mt-18">
          <div className="card kpi-card">
            <div className="kpi-header">
              <span className="badge badge-accent"><T>Registry</T></span>
              <Network size={18} className="kpi-icon" />
            </div>
            <div className="stat-number">{isAdmin ? nodeCount : (memberCounts?.ownedNodes ?? 0)}</div>
            <div className="stat-label">{isAdmin ? "Nodes" : "Your nodes"}</div>
          </div>

          <div className="card kpi-card">
            <div className="kpi-header">
              <span className="badge badge-green"><T>Projects</T></span>
              <FolderKanban size={18} className="kpi-icon" />
            </div>
            <div className="stat-number">{isAdmin ? projectCount : (memberCounts?.scopedProjects ?? 0)}</div>
            <div className="stat-label">{isAdmin ? "Projects" : "Your projects"}</div>
          </div>

          <div className="card kpi-card">
            <div className="kpi-header">
              <span className="badge badge-amber"><T>Verification</T></span>
              <ShieldCheck size={18} className="kpi-icon" />
            </div>
            <div className="stat-number">{isAdmin ? pobPending : (memberCounts?.scopedPoB ?? 0)}</div>
            <div className="stat-label">{isAdmin ? "PoB pending" : "Your PoB"}</div>
          </div>

          <div className="card kpi-card">
            <div className="kpi-header">
              <span className="badge badge-purple"><T>Deals</T></span>
              <Handshake size={18} className="kpi-icon" />
            </div>
            <div className="stat-number">{isAdmin ? dealCount : 0}</div>
            <div className="stat-label">{isAdmin ? "Active deals" : "Your deals"}</div>
          </div>
        </div>

        {isAdmin ? (
          <div className="grid-4 mt-14">
            <Link href="/dashboard/nodes" className="quick-action">
              <div className="quick-action-icon"><Plus size={18} /></div>
              <div>
                <div className="quick-action-title"><T>Create node</T></div>
                <div className="quick-action-desc"><T>New network participant</T></div>
              </div>
            </Link>
            <Link href="/dashboard/projects" className="quick-action">
              <div className="quick-action-icon"><FolderKanban size={18} /></div>
              <div>
                <div className="quick-action-title"><T>New project</T></div>
                <div className="quick-action-desc"><T>Start project workflow</T></div>
              </div>
            </Link>
            <Link href="/dashboard/capital" className="quick-action">
              <div className="quick-action-icon"><Landmark size={18} /></div>
              <div>
                <div className="quick-action-title"><T>Add capital</T></div>
                <div className="quick-action-desc"><T>New investor profile</T></div>
              </div>
            </Link>
            <Link href="/dashboard/settlement" className="quick-action">
              <div className="quick-action-icon"><Scale size={18} /></div>
              <div>
                <div className="quick-action-title"><T>Settlement</T></div>
                <div className="quick-action-desc"><T>Run allocation cycles</T></div>
              </div>
            </Link>
          </div>
        ) : null}

        <div className="grid-2 mt-14">
          <div className="card">
            <h3><T>My work</T></h3>
            <div className="flex-col gap-10">
              <Link href="/dashboard/tasks" className="module-link">
                <span className="status-dot status-dot-accent" /> <T>Tasks</T>
                {isAdmin ? <span className="muted"> · {taskCount} total</span> : <span className="muted"> · scoped to your nodes</span>}
              </Link>
              <Link href="/dashboard/projects" className="module-link">
                <span className="status-dot status-dot-green" /> <T>Projects</T>
              </Link>
              <Link href="/dashboard/deals" className="module-link">
                <span className="status-dot status-dot-purple" /> <T>Deal Room</T>
              </Link>
              <Link href="/dashboard/proof-desk" className="module-link">
                <span className="status-dot status-dot-amber" /> <T>Proof Desk</T>
              </Link>
            </div>
          </div>
          <div className="card">
            <h3><T>All modules</T></h3>
            <div className="flex-col gap-10">
              <Link href="/dashboard/nodes" className="module-link">
                <span className="status-dot status-dot-green" /> <T>Node registry</T>
              </Link>
              <Link href="/dashboard/capital" className="module-link">
                <span className="status-dot status-dot-purple" /> <T>Capital pool</T>
                {isAdmin ? <span className="muted"> · {capitalCount} profiles</span> : null}
              </Link>
              <Link href="/dashboard/agents" className="module-link">
                <span className="status-dot status-dot-accent" /> <T>Agents</T>
              </Link>
              <Link href="/dashboard/settlement" className="module-link">
                <span className="status-dot status-dot-amber" /> <T>Settlement</T>
              </Link>
              <Link href="/dashboard/applications" className="module-link">
                <span className="status-dot" /> <T>Applications</T>
                {isAdmin ? <span className="muted"> · {applicationCount}</span> : <span className="muted"> · {myApplications}</span>}
              </Link>
            </div>
          </div>
        </div>

        {isAdmin && recentAudit.length > 0 ? (
          <div className="card mt-14">
            <div className="card-header">
              <h3><T>Recent activity</T></h3>
              <Link href="/dashboard/audit" className="card-header-link"><T>View all →</T></Link>
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
