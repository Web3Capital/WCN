import { Link } from "@/i18n/routing";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { getOwnedNodeIds, scopedSummaryCounts } from "@/lib/member-data-scope";
import { isAdminRole } from "@/lib/permissions";
import { buildInboxView, type InboxItem } from "@/lib/queries/inbox-view";
import {
  Network,
  FolderKanban,
  ShieldCheck,
  Plus,
  Scale,
  Inbox,
  Handshake,
  Landmark,
  Gavel,
  ArrowRight,
} from "lucide-react";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";
import { StatusBadge } from "@/app/[locale]/dashboard/_components/status-badge";
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

function inboxIcon(kind: InboxItem["kind"]) {
  switch (kind) {
    case "application": return <Inbox size={18} aria-hidden />;
    case "settlement_lock": return <Scale size={18} aria-hidden />;
    case "dispute": return <Gavel size={18} aria-hidden />;
  }
}

export const metadata = dashboardMeta("Dashboard", "WCN console overview");

export default async function DashboardIndex() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const isAdmin = isAdminRole(session.user.role);
  const userId = session.user.id;
  const role = session.user.role;
  const workspaceId = session.user.activeWorkspaceId ?? null;
  const prisma = getPrisma();

  // Inbox is the headline — always fetched. Pulse + recent are
  // secondary. Member-scoped queries fall back when the actor isn't
  // an admin.
  const [
    inbox,
    nodeCount, projectCount, pobPending, dealCount,
    memberCounts, recentAudit,
  ] = await Promise.all([
    buildInboxView({ prisma, userId, role, workspaceId, topN: 5 }),
    isAdmin ? prisma.node.count() : Promise.resolve(0),
    isAdmin ? prisma.project.count() : Promise.resolve(0),
    isAdmin ? prisma.poBRecord.count({ where: { status: "PENDING" } }) : Promise.resolve(0),
    isAdmin ? prisma.deal.count() : Promise.resolve(0),
    isAdmin
      ? Promise.resolve(null)
      : getOwnedNodeIds(prisma, userId).then((ids) => scopedSummaryCounts(prisma, userId, ids)),
    isAdmin
      ? prisma.auditLog.findMany({
          orderBy: { createdAt: "desc" },
          take: 8,
          include: { actor: { select: { name: true, email: true } } },
        })
      : Promise.resolve([]),
  ]);

  const remaining = Math.max(0, inbox.totalCount - inbox.items.length);

  return (
    <div className="dashboard-page section">
      <div className="container-wide">
        <span className="eyebrow"><T>Overview</T></span>
        <h1><T>Welcome back</T></h1>
        <p className="muted">{roleLabel(role)} · WCN Operating Console</p>

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

        {/* ─── Inbox + Pulse row ────────────────────────────────────── */}
        <div className="dashboard-inbox-row mt-18">
          <section className="card dashboard-inbox" aria-labelledby="inbox-heading">
            <header className="dashboard-inbox-header">
              <h2 id="inbox-heading" className="dashboard-inbox-title">
                <T>Inbox</T>
              </h2>
              <span className="muted dashboard-inbox-subtitle">
                {inbox.totalCount === 0 ? (
                  <T>Nothing waiting on you right now</T>
                ) : (
                  <>
                    {inbox.totalCount} <T>things need your attention</T>
                  </>
                )}
              </span>
            </header>

            {inbox.items.length === 0 ? (
              <div className="dashboard-inbox-empty muted">
                <T>You are caught up. Decisions assigned to you will appear here.</T>
              </div>
            ) : (
              <ul className="dashboard-inbox-list">
                {inbox.items.map((item) => (
                  <li key={`${item.kind}-${item.id}`} className="dashboard-inbox-item">
                    <span className="dashboard-inbox-icon" aria-hidden>{inboxIcon(item.kind)}</span>
                    <div className="dashboard-inbox-body">
                      <div className="dashboard-inbox-row-1">
                        <span className="dashboard-inbox-item-title">{item.title}</span>
                        <StatusBadge status={item.status} className="dashboard-inbox-status" />
                      </div>
                      <div className="dashboard-inbox-row-2 muted">{item.context}</div>
                    </div>
                    <Link
                      href={item.href as "/dashboard"}
                      className="dashboard-inbox-action"
                      aria-label={`Review: ${item.title}`}
                    >
                      <T>Review</T>
                      <ArrowRight size={14} aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {remaining > 0 ? (
              <Link href="/dashboard/approvals" className="dashboard-inbox-more muted">
                → {remaining} <T>more in queue</T>
              </Link>
            ) : null}
          </section>

          <aside className="card dashboard-pulse" aria-labelledby="pulse-heading">
            <header className="dashboard-pulse-header">
              <h2 id="pulse-heading" className="dashboard-pulse-title"><T>Pulse</T></h2>
            </header>
            <ul className="dashboard-pulse-list">
              <li className="dashboard-pulse-item">
                <Network size={14} aria-hidden />
                <span className="dashboard-pulse-label"><T>Nodes</T></span>
                <span className="dashboard-pulse-value">
                  {isAdmin ? nodeCount : (memberCounts?.ownedNodes ?? 0)}
                </span>
              </li>
              <li className="dashboard-pulse-item">
                <FolderKanban size={14} aria-hidden />
                <span className="dashboard-pulse-label"><T>Projects</T></span>
                <span className="dashboard-pulse-value">
                  {isAdmin ? projectCount : (memberCounts?.scopedProjects ?? 0)}
                </span>
              </li>
              <li className="dashboard-pulse-item">
                <Handshake size={14} aria-hidden />
                <span className="dashboard-pulse-label"><T>Active deals</T></span>
                <span className="dashboard-pulse-value">{isAdmin ? dealCount : 0}</span>
              </li>
              <li className="dashboard-pulse-item">
                <ShieldCheck size={14} aria-hidden />
                <span className="dashboard-pulse-label"><T>PoB pending</T></span>
                <span className="dashboard-pulse-value">
                  {isAdmin ? pobPending : (memberCounts?.scopedPoB ?? 0)}
                </span>
              </li>
            </ul>
          </aside>
        </div>

        {/* ─── Quick actions (admin) ───────────────────────────────── */}
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

        {/* ─── Recent activity (admin) ─────────────────────────────── */}
        {isAdmin && recentAudit.length > 0 ? (
          <div className="card mt-14">
            <div className="dashboard-recent-header">
              <h2 className="dashboard-recent-title"><T>Recent activity</T></h2>
              <Link href="/dashboard/audit" className="muted dashboard-recent-viewall">
                <T>View all</T> <ArrowRight size={14} aria-hidden />
              </Link>
            </div>
            <ul className="dashboard-recent-list">
              {recentAudit.map((entry) => (
                <li key={entry.id} className="dashboard-recent-item">
                  <span className="dashboard-recent-dot" aria-hidden />
                  <div>
                    <div className="dashboard-recent-action">{entry.action}</div>
                    <div className="muted dashboard-recent-meta">
                      {entry.actor?.name || entry.actor?.email || "system"} ·{" "}
                      {entry.targetType} · {new Date(entry.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
