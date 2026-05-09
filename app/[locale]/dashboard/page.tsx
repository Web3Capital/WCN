import { Link } from "@/i18n/routing";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { getOwnedNodeIds, scopedSummaryCounts } from "@/lib/member-data-scope";
import { isAdminRole } from "@/lib/permissions";
import { Network, FolderKanban, ShieldCheck, Plus, Scale, Handshake, Landmark } from "lucide-react";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";

export const dynamic = "force-dynamic";

export const metadata = dashboardMeta("Dashboard", "WCN console overview");
export default async function DashboardIndex() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const isAdmin = isAdminRole(session.user.role);
  const userId = session.user.id;
  const role = session.user.role;
  const prisma = getPrisma();
  const t = await getTranslations("dashboard.overview");
  const tRoles = await getTranslations("dashboard.roles");

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
        <span className="eyebrow">{t("eyebrow")}</span>
        <h1>{t("welcome")}</h1>
        <p className="muted">
          {t("subtitle", { role: tRoles(role) })}
        </p>

        {!isAdmin && memberCounts ? (
          <div className="card profile-bar mt-18">
            <div className="user-avatar" style={{ width: 40, height: 40, fontSize: 16, flexShrink: 0 }}>
              {(session.user.name || session.user.email || "?").charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="profile-name mt-0 mb-0">{session.user.name || session.user.email}</p>
              <p className="muted profile-meta mt-0 mb-0">
                {t("profileMeta", {
                  nodes: memberCounts.ownedNodes,
                  projects: memberCounts.scopedProjects,
                  tasks: memberCounts.scopedTasks,
                  pob: memberCounts.scopedPoB,
                })}
              </p>
            </div>
          </div>
        ) : null}

        <div className="grid-4 card-grid-animated mt-18">
          <div className="card kpi-card">
            <div className="kpi-header">
              <span className="badge badge-accent">{t("stats.registry")}</span>
              <Network size={18} className="kpi-icon" />
            </div>
            <div className="stat-number">{isAdmin ? nodeCount : (memberCounts?.ownedNodes ?? 0)}</div>
            <div className="stat-label">{isAdmin ? t("stats.nodes") : t("stats.yourNodes")}</div>
          </div>

          <div className="card kpi-card">
            <div className="kpi-header">
              <span className="badge badge-green">{t("stats.projects")}</span>
              <FolderKanban size={18} className="kpi-icon" />
            </div>
            <div className="stat-number">{isAdmin ? projectCount : (memberCounts?.scopedProjects ?? 0)}</div>
            <div className="stat-label">{isAdmin ? t("stats.totalProjects") : t("stats.yourProjects")}</div>
          </div>

          <div className="card kpi-card">
            <div className="kpi-header">
              <span className="badge badge-amber">{t("stats.verification")}</span>
              <ShieldCheck size={18} className="kpi-icon" />
            </div>
            <div className="stat-number">{isAdmin ? pobPending : (memberCounts?.scopedPoB ?? 0)}</div>
            <div className="stat-label">{isAdmin ? t("stats.pobPending") : t("stats.yourPob")}</div>
          </div>

          <div className="card kpi-card">
            <div className="kpi-header">
              <span className="badge badge-purple">{t("stats.deals")}</span>
              <Handshake size={18} className="kpi-icon" />
            </div>
            <div className="stat-number">{isAdmin ? dealCount : 0}</div>
            <div className="stat-label">{isAdmin ? t("stats.activeDeals") : t("stats.yourDeals")}</div>
          </div>
        </div>

        {isAdmin ? (
          <div className="grid-4 mt-14">
            <Link href="/dashboard/nodes" className="quick-action">
              <div className="quick-action-icon"><Plus size={18} /></div>
              <div>
                <div className="quick-action-title">{t("actions.createNode")}</div>
                <div className="quick-action-desc">{t("actions.createNodeDesc")}</div>
              </div>
            </Link>
            <Link href="/dashboard/projects" className="quick-action">
              <div className="quick-action-icon"><FolderKanban size={18} /></div>
              <div>
                <div className="quick-action-title">{t("actions.newProject")}</div>
                <div className="quick-action-desc">{t("actions.newProjectDesc")}</div>
              </div>
            </Link>
            <Link href="/dashboard/capital" className="quick-action">
              <div className="quick-action-icon"><Landmark size={18} /></div>
              <div>
                <div className="quick-action-title">{t("actions.addCapital")}</div>
                <div className="quick-action-desc">{t("actions.addCapitalDesc")}</div>
              </div>
            </Link>
            <Link href="/dashboard/settlement" className="quick-action">
              <div className="quick-action-icon"><Scale size={18} /></div>
              <div>
                <div className="quick-action-title">{t("actions.settlement")}</div>
                <div className="quick-action-desc">{t("actions.settlementDesc")}</div>
              </div>
            </Link>
          </div>
        ) : null}

        <div className="grid-2 mt-14">
          <div className="card">
            <h3>{t("myWork.title")}</h3>
            <div className="flex-col gap-10">
              <Link href="/dashboard/tasks" className="module-link">
                <span className="status-dot status-dot-accent" /> {t("myWork.tasks")}
                {isAdmin
                  ? <span className="muted"> {t("myWork.tasksTotal", { count: taskCount })}</span>
                  : <span className="muted"> {t("myWork.scopedHint")}</span>}
              </Link>
              <Link href="/dashboard/projects" className="module-link">
                <span className="status-dot status-dot-green" /> {t("myWork.projects")}
              </Link>
              <Link href="/dashboard/deals" className="module-link">
                <span className="status-dot status-dot-purple" /> {t("myWork.dealRoom")}
              </Link>
              <Link href="/dashboard/proof-desk" className="module-link">
                <span className="status-dot status-dot-amber" /> {t("myWork.proofDesk")}
              </Link>
            </div>
          </div>
          <div className="card">
            <h3>{t("modules.title")}</h3>
            <div className="flex-col gap-10">
              <Link href="/dashboard/nodes" className="module-link">
                <span className="status-dot status-dot-green" /> {t("modules.nodeRegistry")}
              </Link>
              <Link href="/dashboard/capital" className="module-link">
                <span className="status-dot status-dot-purple" /> {t("modules.capitalPool")}
                {isAdmin ? <span className="muted"> {t("modules.capitalProfiles", { count: capitalCount })}</span> : null}
              </Link>
              <Link href="/dashboard/agents" className="module-link">
                <span className="status-dot status-dot-accent" /> {t("modules.agents")}
              </Link>
              <Link href="/dashboard/settlement" className="module-link">
                <span className="status-dot status-dot-amber" /> {t("modules.settlement")}
              </Link>
              <Link href="/dashboard/node-system/applications" className="module-link">
                <span className="status-dot" /> {t("modules.applications")}
                <span className="muted"> {t("modules.appCount", { count: isAdmin ? applicationCount : myApplications })}</span>
              </Link>
            </div>
          </div>
        </div>

        {isAdmin && recentAudit.length > 0 ? (
          <div className="card mt-14">
            <div className="card-header">
              <h3>{t("recent.title")}</h3>
              <Link href="/dashboard/audit" className="card-header-link">{t("recent.viewAll")}</Link>
            </div>
            <div className="timeline">
              {(recentAudit as any[]).map((log: any) => (
                <div key={log.id} className="timeline-item">
                  <span className="timeline-dot" />
                  <div className="timeline-content">
                    <div className="timeline-action">{log.action.replace(/_/g, " ")}</div>
                    <div className="timeline-meta">
                      {log.actor?.name || log.actor?.email || t("recent.system")} · {log.targetType} · {new Date(log.createdAt).toLocaleDateString()}
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
