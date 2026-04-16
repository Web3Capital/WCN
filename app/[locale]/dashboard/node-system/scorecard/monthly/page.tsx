import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";
import { Link } from "@/i18n/routing";

export const dynamic = "force-dynamic";
export const metadata = dashboardMeta("Monthly Scorecards", "Current period evaluation");

export default async function MonthlyPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (!isAdminRole(session.user.role)) redirect("/dashboard");

  const prisma = getPrisma();

  // Get current month pattern (e.g., "2026-03" for March 2026)
  const now = new Date();
  const currentMonthPattern = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const scorecards = await prisma.nodeScorecard.findMany({
    where: {
      period: { startsWith: currentMonthPattern },
    },
    orderBy: { totalScore: "desc" },
    take: 200,
    include: {
      node: { select: { id: true, name: true } },
      reviewer: { select: { id: true, name: true, email: true } },
    },
  });

  const avgScore =
    scorecards.length > 0
      ? scorecards.reduce((sum, sc) => sum + sc.totalScore, 0) / scorecards.length
      : 0;

  return (
    <div className="dashboard-page section">
      <div className="container-wide">
        <span className="eyebrow"><T>Node System</T></span>
        <h1><T>Monthly Evaluation</T></h1>
        <p className="muted">
          <T>Current month scorecard records</T> ({currentMonthPattern}).
        </p>

        <div className="grid-2 mt-18">
          <div className="kpi card">
            <div className="kpi-label"><T>Records This Month</T></div>
            <div className="kpi-value">{scorecards.length}</div>
          </div>
          <div className="kpi card">
            <div className="kpi-label"><T>Average Total Score</T></div>
            <div className="kpi-value">{avgScore.toFixed(1)}</div>
          </div>
        </div>

        <div className="card mt-14">
          {scorecards.length === 0 ? (
            <p className="muted text-center py-20"><T>No monthly scorecard records found.</T></p>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th><T>Node</T></th>
                    <th><T>Total Score</T></th>
                    <th><T>Pipeline</T></th>
                    <th><T>Closure</T></th>
                    <th><T>Evidence</T></th>
                    <th><T>Collaboration</T></th>
                    <th><T>Risk</T></th>
                  </tr>
                </thead>
                <tbody>
                  {scorecards.map((sc) => (
                    <tr key={sc.id}>
                      <td className="font-medium">{sc.node?.name || "—"}</td>
                      <td className="font-bold">{sc.totalScore.toFixed(1)}</td>
                      <td className="text-sm">{sc.pipelineScore.toFixed(0)}</td>
                      <td className="text-sm">{sc.closureScore.toFixed(0)}</td>
                      <td className="text-sm">{sc.evidenceScore.toFixed(0)}</td>
                      <td className="text-sm">{sc.collaborationScore.toFixed(0)}</td>
                      <td className="text-sm">{sc.riskScore.toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-14 flex gap-10">
          <Link href="/dashboard/node-system/scorecard" className="button button-secondary">
            <T>Back to Scorecard</T>
          </Link>
        </div>
      </div>
    </div>
  );
}
