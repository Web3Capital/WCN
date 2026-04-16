import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";
import { Link } from "@/i18n/routing";

export const dynamic = "force-dynamic";
export const metadata = dashboardMeta("KPI Deep-Dive", "Key performance indicators");

export default async function KPIPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (!isAdminRole(session.user.role)) redirect("/dashboard");

  const prisma = getPrisma();

  const [nodeCount, projectCount, taskCount, activeDeals, scorecardCount] = await Promise.all([
    prisma.node.count(),
    prisma.project.count(),
    prisma.task.count(),
    prisma.deal.count({ where: { stage: { in: ["MATCHED", "MEETING_DONE", "DD", "TERM_SHEET", "SIGNED"] } } }),
    prisma.nodeScorecard.count(),
  ]);

  return (
    <div className="dashboard-page section">
      <div className="container-wide">
        <span className="eyebrow"><T>Node System</T></span>
        <h1><T>KPI Deep-Dive</T></h1>
        <p className="muted"><T>Key performance indicators for the node system.</T></p>

        <div className="kpi-grid mt-18">
          <div className="kpi card">
            <div className="kpi-label"><T>Total Nodes</T></div>
            <div className="kpi-value">{nodeCount}</div>
          </div>
          <div className="kpi card">
            <div className="kpi-label"><T>Projects</T></div>
            <div className="kpi-value">{projectCount}</div>
          </div>
          <div className="kpi card">
            <div className="kpi-label"><T>Tasks</T></div>
            <div className="kpi-value">{taskCount}</div>
          </div>
          <div className="kpi card">
            <div className="kpi-label"><T>Active Deals</T></div>
            <div className="kpi-value">{activeDeals}</div>
          </div>
          <div className="kpi card">
            <div className="kpi-label"><T>Scorecards</T></div>
            <div className="kpi-value">{scorecardCount}</div>
          </div>
        </div>

        <div className="grid-2 mt-14">
          <Link href="/dashboard/node-system/status-board" className="card quick-action">
            <div className="quick-action-title"><T>Status Board</T></div>
            <div className="quick-action-desc"><T>Nodes by status</T></div>
          </Link>
          <Link href="/dashboard/node-system/scorecard" className="card quick-action">
            <div className="quick-action-title"><T>Scorecard</T></div>
            <div className="quick-action-desc"><T>Performance evaluation</T></div>
          </Link>
        </div>

        <div className="mt-14 flex gap-10">
          <Link href="/dashboard/node-system" className="button button-secondary">
            <T>Back to Overview</T>
          </Link>
        </div>
      </div>
    </div>
  );
}
