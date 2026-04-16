import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";
import { Link } from "@/i18n/routing";

export const dynamic = "force-dynamic";
export const metadata = dashboardMeta("Evidence Quality", "Node scorecard dimension");

export default async function EvidenceQualityPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (!isAdminRole(session.user.role)) redirect("/dashboard");

  const prisma = getPrisma();

  const scorecards = await prisma.nodeScorecard.findMany({
    orderBy: { evidenceScore: "desc" },
    take: 200,
    include: {
      node: { select: { id: true, name: true } },
      reviewer: { select: { id: true, name: true, email: true } },
    },
  });

  const avgScore =
    scorecards.length > 0
      ? scorecards.reduce((sum, sc) => sum + sc.evidenceScore, 0) / scorecards.length
      : 0;

  return (
    <div className="dashboard-page section">
      <div className="container-wide">
        <span className="eyebrow"><T>Node System</T></span>
        <h1><T>Evidence Quality</T></h1>
        <p className="muted"><T>Proof of Business and evidence quality scores.</T></p>

        <div className="grid-2 mt-18">
          <div className="kpi card">
            <div className="kpi-label"><T>Records</T></div>
            <div className="kpi-value">{scorecards.length}</div>
          </div>
          <div className="kpi card">
            <div className="kpi-label"><T>Average Score</T></div>
            <div className="kpi-value">{avgScore.toFixed(1)}</div>
          </div>
        </div>

        <div className="card mt-14">
          {scorecards.length === 0 ? (
            <p className="muted text-center py-20"><T>No scorecard records found.</T></p>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th><T>Rank</T></th>
                    <th><T>Node</T></th>
                    <th><T>Evidence Score</T></th>
                    <th><T>Weighted Total</T></th>
                    <th><T>Period</T></th>
                    <th><T>Reviewer</T></th>
                  </tr>
                </thead>
                <tbody>
                  {scorecards.map((sc, idx) => (
                    <tr key={sc.id}>
                      <td className="font-bold">{idx + 1}</td>
                      <td className="font-medium">{sc.node?.name || "—"}</td>
                      <td className="font-bold">{sc.evidenceScore.toFixed(1)}</td>
                      <td>{sc.totalScore.toFixed(1)}</td>
                      <td className="text-sm">{sc.period}</td>
                      <td className="muted text-sm">{sc.reviewer?.name || sc.reviewer?.email || "—"}</td>
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
