import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";
import { Link } from "@/i18n/routing";
import { CheckCircle, AlertCircle, Clock, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = dashboardMeta("Proof of Business", "Review and verification records");

export default async function PoBPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  if (!isAdminRole(session.user.role)) redirect("/dashboard");

  const prisma = getPrisma();

  const [reviews, totalCount, approvedCount, rejectedCount, pendingCount] = await Promise.all([
    prisma.review.findMany({
      where: { targetType: "POB" },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        reviewer: { select: { name: true, email: true } },
      },
    }),
    prisma.review.count({ where: { targetType: "POB" } }),
    prisma.review.count({
      where: { targetType: "POB", decision: "APPROVE" },
    }),
    prisma.review.count({
      where: { targetType: "POB", decision: "REJECT" },
    }),
    prisma.review.count({
      where: { targetType: "POB", status: "OPEN" },
    }),
  ]);

  const decisionBadgeClass = (decision: string) => {
    switch (decision) {
      case "APPROVE":
        return "badge badge-green";
      case "REJECT":
        return "badge badge-red";
      case "NEEDS_CHANGES":
        return "badge badge-amber";
      default:
        return "badge";
    }
  };

  const statusBadgeClass = (status: string) => {
    switch (status) {
      case "OPEN":
        return "badge badge-accent";
      default:
        return "badge badge-gray";
    }
  };

  return (
    <div className="dashboard-page section">
      <div className="container-wide">
        <span className="eyebrow"><T>Node System</T></span>
        <h1><T>Proof of Business</T></h1>
        <p className="muted">
          <T>PoB submissions, reviews, and verification status</T>
        </p>

        <div className="kpi-grid mt-18">
          <div className="card kpi">
            <div className="kpi-header">
              <span className="badge badge-accent"><T>Total</T></span>
              <AlertCircle size={18} className="kpi-icon" />
            </div>
            <div className="stat-number">{totalCount}</div>
            <div className="stat-label"><T>Reviews</T></div>
          </div>

          <div className="card kpi">
            <div className="kpi-header">
              <span className="badge badge-green"><T>Approved</T></span>
              <CheckCircle size={18} className="kpi-icon" />
            </div>
            <div className="stat-number">{approvedCount}</div>
            <div className="stat-label"><T>Approved</T></div>
          </div>

          <div className="card kpi">
            <div className="kpi-header">
              <span className="badge badge-red"><T>Rejected</T></span>
              <XCircle size={18} className="kpi-icon" />
            </div>
            <div className="stat-number">{rejectedCount}</div>
            <div className="stat-label"><T>Rejected</T></div>
          </div>

          <div className="card kpi">
            <div className="kpi-header">
              <span className="badge badge-amber"><T>Pending</T></span>
              <Clock size={18} className="kpi-icon" />
            </div>
            <div className="stat-number">{pendingCount}</div>
            <div className="stat-label"><T>Awaiting review</T></div>
          </div>
        </div>

        <div className="grid-3 mt-14">
          <Link href="/dashboard/node-system/pob/submitted" className="quick-action">
            <div className="quick-action-icon"><Clock size={18} /></div>
            <div>
              <div className="quick-action-title"><T>Submitted</T></div>
              <div className="quick-action-desc"><T>Pending action</T></div>
            </div>
          </Link>
          <Link href="/dashboard/node-system/pob/reviewing" className="quick-action">
            <div className="quick-action-icon"><AlertCircle size={18} /></div>
            <div>
              <div className="quick-action-title"><T>In Review</T></div>
              <div className="quick-action-desc"><T>Under evaluation</T></div>
            </div>
          </Link>
          <Link href="/dashboard/node-system/pob/approved" className="quick-action">
            <div className="quick-action-icon"><CheckCircle size={18} /></div>
            <div>
              <div className="quick-action-title"><T>Approved</T></div>
              <div className="quick-action-desc">
                {approvedCount} <T>records</T>
              </div>
            </div>
          </Link>
        </div>

        <div className="card mt-14">
          <div className="card-header">
            <h3><T>All PoB reviews</T></h3>
            <span className="badge badge-sm">{totalCount}</span>
          </div>
          {reviews.length === 0 ? (
            <div className="empty-state">
              <p className="muted"><T>No PoB reviews found</T></p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th><T>Target ID</T></th>
                  <th><T>Status</T></th>
                  <th><T>Decision</T></th>
                  <th><T>Reviewer</T></th>
                  <th><T>Notes</T></th>
                  <th><T>Created</T></th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review: any) => (
                  <tr key={review.id}>
                    <td className="font-mono text-sm">{review.targetId.slice(0, 8)}...</td>
                    <td>
                      <span className={statusBadgeClass(review.status)}>
                        {review.status}
                      </span>
                    </td>
                    <td>
                      <span className={decisionBadgeClass(review.decision)}>
                        {review.decision}
                      </span>
                    </td>
                    <td className="text-sm">{review.reviewer?.name || review.reviewer?.email || "—"}</td>
                    <td className="text-sm muted truncate" style={{ maxWidth: 200 }}>
                      {review.notes ? review.notes.slice(0, 50) : "—"}
                    </td>
                    <td className="text-sm muted">
                      {new Date(review.createdAt).toLocaleDateString()}
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
