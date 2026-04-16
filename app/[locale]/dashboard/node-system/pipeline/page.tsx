import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";
import { Link } from "@/i18n/routing";
import { TrendingUp, Lock, CheckCircle, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = dashboardMeta("Deal Pipeline", "Node-associated deal tracking");

export default async function PipelinePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  if (!isAdminRole(session.user.role)) redirect("/dashboard");

  const prisma = getPrisma();

  const [deals, totalCount, activeCount, closedCount, blockedCount] = await Promise.all([
    prisma.deal.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        leadNode: { select: { id: true, name: true } },
      },
    }),
    prisma.deal.count(),
    prisma.deal.count({ where: { stage: { in: ["SOURCED", "MATCHED", "INTRO_SENT", "MEETING_DONE", "DD", "TERM_SHEET"] } } }),
    prisma.deal.count({ where: { stage: { in: ["SIGNED", "FUNDED"] } } }),
    prisma.deal.count({ where: { stage: { in: ["PASSED", "PAUSED"] } } }),
  ]);

  const stageBadgeClass = (stage: string) => {
    if (["SIGNED", "FUNDED"].includes(stage)) return "badge badge-green";
    if (["PASSED", "PAUSED"].includes(stage)) return "badge badge-red";
    return "badge badge-accent";
  };

  const stageLabel = (stage: string) => {
    return stage.replace(/_/g, " ");
  };

  return (
    <div className="dashboard-page section">
      <div className="container-wide">
        <span className="eyebrow"><T>Node System</T></span>
        <h1><T>Deal Pipeline</T></h1>
        <p className="muted">
          <T>Deals led and participated in by nodes</T>
        </p>

        <div className="kpi-grid mt-18">
          <div className="card kpi">
            <div className="kpi-header">
              <span className="badge badge-accent"><T>Total</T></span>
              <TrendingUp size={18} className="kpi-icon" />
            </div>
            <div className="stat-number">{totalCount}</div>
            <div className="stat-label"><T>Deals</T></div>
          </div>

          <div className="card kpi">
            <div className="kpi-header">
              <span className="badge badge-blue"><T>Active</T></span>
              <AlertCircle size={18} className="kpi-icon" />
            </div>
            <div className="stat-number">{activeCount}</div>
            <div className="stat-label"><T>In progress</T></div>
          </div>

          <div className="card kpi">
            <div className="kpi-header">
              <span className="badge badge-green"><T>Closed</T></span>
              <CheckCircle size={18} className="kpi-icon" />
            </div>
            <div className="stat-number">{closedCount}</div>
            <div className="stat-label"><T>Signed or funded</T></div>
          </div>

          <div className="card kpi">
            <div className="kpi-header">
              <span className="badge badge-red"><T>Blocked</T></span>
              <Lock size={18} className="kpi-icon" />
            </div>
            <div className="stat-number">{blockedCount}</div>
            <div className="stat-label"><T>Passed or paused</T></div>
          </div>
        </div>

        <div className="grid-3 mt-14">
          <Link href="/dashboard/node-system/pipeline/projects" className="quick-action">
            <div className="quick-action-icon"><TrendingUp size={18} /></div>
            <div>
              <div className="quick-action-title"><T>Projects</T></div>
              <div className="quick-action-desc"><T>Project type deals</T></div>
            </div>
          </Link>
          <Link href="/dashboard/node-system/pipeline/capital" className="quick-action">
            <div className="quick-action-icon"><TrendingUp size={18} /></div>
            <div>
              <div className="quick-action-title"><T>Capital</T></div>
              <div className="quick-action-desc"><T>Capital type deals</T></div>
            </div>
          </Link>
          <Link href="/dashboard/node-system/pipeline/services" className="quick-action">
            <div className="quick-action-icon"><TrendingUp size={18} /></div>
            <div>
              <div className="quick-action-title"><T>Services</T></div>
              <div className="quick-action-desc"><T>Service type deals</T></div>
            </div>
          </Link>
        </div>

        <div className="card mt-14">
          <div className="card-header">
            <h3><T>All deals</T></h3>
            <span className="badge badge-sm">{totalCount}</span>
          </div>
          {deals.length === 0 ? (
            <div className="empty-state">
              <p className="muted"><T>No deals found</T></p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th><T>Title</T></th>
                  <th><T>Lead Node</T></th>
                  <th><T>Stage</T></th>
                  <th><T>Value</T></th>
                  <th><T>Created</T></th>
                </tr>
              </thead>
              <tbody>
                {deals.map((deal: any) => (
                  <tr key={deal.id}>
                    <td>
                      <Link href={`/dashboard/deals/${deal.id}`} className="link">
                        {deal.title}
                      </Link>
                    </td>
                    <td className="text-sm">
                      <Link href={`/dashboard/nodes/${deal.leadNode.id}`} className="link">
                        {deal.leadNode.name}
                      </Link>
                    </td>
                    <td>
                      <span className={stageBadgeClass(deal.stage)}>
                        {stageLabel(deal.stage)}
                      </span>
                    </td>
                    <td className="text-sm font-mono">
                      {deal.value || "—"}
                    </td>
                    <td className="text-sm muted">
                      {new Date(deal.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
