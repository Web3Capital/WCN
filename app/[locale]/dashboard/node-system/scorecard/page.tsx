import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";
import { Link } from "@/i18n/routing";

export const dynamic = "force-dynamic";
export const metadata = dashboardMeta("Node Scorecard", "10-node evaluation framework");

function getActionBadgeColor(action: string): string {
  const colors: Record<string, string> = {
    UPGRADE: "badge-green",
    MAINTAIN: "badge-accent",
    WATCHLIST: "badge-amber",
    DOWNGRADE: "badge-red",
    REMOVE: "badge-gray",
  };
  return colors[action] || "badge-gray";
}

export default async function ScorecardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (!isAdminRole(session.user.role)) redirect("/dashboard");

  const prisma = getPrisma();

  const scorecards = await prisma.nodeScorecard.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      node: { select: { id: true, name: true } },
      reviewer: { select: { id: true, name: true, email: true } },
    },
  });

  const totalScorecards = scorecards.length;
  const avgWeightedScore =
    scorecards.length > 0
      ? scorecards.reduce((sum, sc) => sum + sc.totalScore, 0) / scorecards.length
      : 0;
  const upgradeCount = scorecards.filter((sc) => sc.action === "UPGRADE").length;
  const watchlistCount = scorecards.filter((sc) => sc.action === "WATCHLIST").length;
  const downgradeCount = scorecards.filter((sc) => sc.action === "DOWNGRADE").length;

  return (
    <div className="dashboard-page section">
      <div className="container-wide">
        <span className="eyebrow"><T>Node System</T></span>
        <h1><T>10-Node Scorecard</T></h1>
        <p className="muted"><T>Performance evaluation framework for node operators.</T></p>

        <div className="kpi-grid mt-18">
          <div className="kpi card">
            <div className="kpi-label"><T>Total Scorecards</T></div>
            <div className="kpi-value">{totalScorecards}</div>
          </div>
          <div className="kpi card">
            <div className="kpi-label"><T>Avg Weighted Score</T></div>
            <div className="kpi-value">{avgWeightedScore.toFixed(1)}</div>
          </div>
          <div className="kpi card">
            <div className="kpi-label"><T>Upgrade</T></div>
            <div className="kpi-value">{upgradeCount}</div>
          </div>
          <div className="kpi card">
            <div className="kpi-label"><T>Watchlist</T></div>
            <div className="kpi-value">{watchlistCount}</div>
          </div>
          <div className="kpi card">
            <div className="kpi-label"><T>Downgrade</T></div>
            <div className="kpi-value">{downgradeCount}</div>
          </div>
        </div>

        <div className="card mt-14">
          <div className="card-header">
            <h3><T>Scorecard Records</T></h3>
            <div className="card-header-links">
              <Link href="/dashboard/node-system/scorecard/pipeline-quality" className="card-header-link">
                <T>Pipeline Quality</T> →
              </Link>
              <Link href="/dashboard/node-system/scorecard/closure-rate" className="card-header-link">
                <T>Closure Rate</T> →
              </Link>
              <Link href="/dashboard/node-system/scorecard/evidence-quality" className="card-header-link">
                <T>Evidence Quality</T> →
              </Link>
            </div>
          </div>

          {scorecards.length === 0 ? (
            <p className="muted text-center py-20"><T>No scorecard records found.</T></p>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th><T>Node</T></th>
                    <th><T>Period</T></th>
                    <th><T>Weighted Score</T></th>
                    <th><T>Action</T></th>
                    <th><T>Reviewer</T></th>
                    <th><T>Date</T></th>
                  </tr>
                </thead>
                <tbody>
                  {scorecards.map((sc) => (
                    <tr key={sc.id}>
                      <td className="font-medium">{sc.node?.name || "—"}</td>
                      <td>{sc.period}</td>
                      <td className="font-bold">{sc.totalScore.toFixed(1)}</td>
                      <td>
                        <span className={`badge ${getActionBadgeColor(sc.action)}`}>
                          {sc.action}
                        </span>
                      </td>
                      <td>{sc.reviewer?.name || sc.reviewer?.email || "—"}</td>
                      <td className="muted text-sm">
                        {new Date(sc.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="grid-3 mt-14">
          <Link href="/dashboard/node-system/scorecard/collaboration" className="card quick-action">
            <div className="quick-action-title"><T>Collaboration</T></div>
            <div className="quick-action-desc"><T>Response & reliability scores</T></div>
          </Link>
          <Link href="/dashboard/node-system/scorecard/risk-record" className="card quick-action">
            <div className="quick-action-title"><T>Risk Record</T></div>
            <div className="quick-action-desc"><T>Compliance & risk scores</T></div>
          </Link>
          <Link href="/dashboard/node-system/scorecard/monthly" className="card quick-action">
            <div className="quick-action-title"><T>Monthly</T></div>
            <div className="quick-action-desc"><T>Month-filtered scores</T></div>
          </Link>
        </div>
      </div>
    </div>
  );
}
