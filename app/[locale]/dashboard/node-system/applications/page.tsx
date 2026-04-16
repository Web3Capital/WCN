import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";
import { Link } from "@/i18n/routing";
import { CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = dashboardMeta("Node Applications", "Application review and management");

export default async function NodeApplicationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const isAdmin = isAdminRole(session.user.role);
  if (!isAdmin) {
    return (
      <div className="dashboard-page section">
        <div className="container-wide">
          <span className="eyebrow"><T>Admin</T></span>
          <h1><T>Node Applications</T></h1>
          <div className="card" style={{ marginTop: 18, padding: "14px 16px" }}>
            <p className="muted" style={{ margin: 0 }}>
              <T>Node applications hub is only available to administrators.</T>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const prisma = getPrisma();

  // Fetch application status counts
  const statusCounts = await prisma.application.groupBy({
    by: ["status"],
    _count: true,
  });

  // Calculate counts for each status
  const countByStatus: Record<string, number> = {};
  for (const item of statusCounts) {
    countByStatus[item.status] = item._count;
  }

  const pendingCount = countByStatus["PENDING"] || 0;
  const reviewingCount = countByStatus["REVIEWING"] || 0;
  const approvedCount = countByStatus["APPROVED"] || 0;
  const rejectedCount = countByStatus["REJECTED"] || 0;
  const totalCount = pendingCount + reviewingCount + approvedCount + rejectedCount;

  return (
    <div className="dashboard-page section">
      <div className="container-wide">
        <span className="eyebrow"><T>Node Operations</T></span>
        <h1><T>Node Applications</T></h1>
        <p className="muted"><T>Review and manage node application submissions (02 节点申请)</T></p>

        {/* KPI Cards by Status */}
        <div className="kpi-grid mt-18">
          <div className="card kpi">
            <div className="kpi-header">
              <span className="badge badge-amber"><T>Pending</T></span>
              <Clock size={18} className="kpi-icon" />
            </div>
            <div className="stat-number">{pendingCount}</div>
            <div className="stat-label"><T>Pending Applications</T></div>
          </div>

          <div className="card kpi">
            <div className="kpi-header">
              <span className="badge badge-purple"><T>Reviewing</T></span>
              <AlertCircle size={18} className="kpi-icon" />
            </div>
            <div className="stat-number">{reviewingCount}</div>
            <div className="stat-label"><T>Under Review</T></div>
          </div>

          <div className="card kpi">
            <div className="kpi-header">
              <span className="badge badge-green"><T>Approved</T></span>
              <CheckCircle2 size={18} className="kpi-icon" />
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
        </div>

        {/* Navigation Links */}
        <div className="grid-3 mt-18">
          <Link
            href="/dashboard/node-system/applications/pending"
            className="card"
            style={{ textDecoration: "none", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 140 }}
          >
            <div>
              <div className="badge badge-amber" style={{ display: "inline-block", marginBottom: 12 }}><T>Pending</T></div>
              <h4 style={{ margin: "0 0 8px 0", color: "var(--text)" }}><T>Pending Applications</T></h4>
              <p className="muted" style={{ margin: 0, fontSize: "0.875rem" }}><T>New submissions awaiting review</T></p>
            </div>
            <div style={{ marginTop: 12 }}>
              <span style={{ fontWeight: 600, fontSize: "1.5rem", color: "var(--text)" }}>{pendingCount}</span>
            </div>
          </Link>

          <Link
            href="/dashboard/node-system/applications/info-needed"
            className="card"
            style={{ textDecoration: "none", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 140 }}
          >
            <div>
              <div className="badge badge-orange" style={{ display: "inline-block", marginBottom: 12 }}><T>Info Needed</T></div>
              <h4 style={{ margin: "0 0 8px 0", color: "var(--text)" }}><T>Info Needed</T></h4>
              <p className="muted" style={{ margin: 0, fontSize: "0.875rem" }}><T>Applications requiring more information</T></p>
            </div>
            <div style={{ marginTop: 12 }}>
              <span style={{ fontWeight: 600, fontSize: "1.5rem", color: "var(--text)" }}>{reviewingCount}</span>
            </div>
          </Link>

          <Link
            href="/dashboard/node-system/applications/interview"
            className="card"
            style={{ textDecoration: "none", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 140 }}
          >
            <div>
              <div className="badge badge-purple" style={{ display: "inline-block", marginBottom: 12 }}><T>Interview</T></div>
              <h4 style={{ margin: "0 0 8px 0", color: "var(--text)" }}><T>Interview Stage</T></h4>
              <p className="muted" style={{ margin: 0, fontSize: "0.875rem" }}><T>Applications in interview phase</T></p>
            </div>
            <div style={{ marginTop: 12 }}>
              <span style={{ fontWeight: 600, fontSize: "1.5rem", color: "var(--text)" }}>0</span>
            </div>
          </Link>

          <Link
            href="/dashboard/node-system/applications/risk-review"
            className="card"
            style={{ textDecoration: "none", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 140 }}
          >
            <div>
              <div className="badge badge-accent" style={{ display: "inline-block", marginBottom: 12 }}><T>Risk Review</T></div>
              <h4 style={{ margin: "0 0 8px 0", color: "var(--text)" }}><T>Risk Review</T></h4>
              <p className="muted" style={{ margin: 0, fontSize: "0.875rem" }}><T>Applications under risk assessment</T></p>
            </div>
            <div style={{ marginTop: 12 }}>
              <span style={{ fontWeight: 600, fontSize: "1.5rem", color: "var(--text)" }}>0</span>
            </div>
          </Link>

          <Link
            href="/dashboard/node-system/applications/approved"
            className="card"
            style={{ textDecoration: "none", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 140 }}
          >
            <div>
              <div className="badge badge-green" style={{ display: "inline-block", marginBottom: 12 }}><T>Approved</T></div>
              <h4 style={{ margin: "0 0 8px 0", color: "var(--text)" }}><T>Approved Applications</T></h4>
              <p className="muted" style={{ margin: 0, fontSize: "0.875rem" }}><T>Applications approved for onboarding</T></p>
            </div>
            <div style={{ marginTop: 12 }}>
              <span style={{ fontWeight: 600, fontSize: "1.5rem", color: "var(--text)" }}>{approvedCount}</span>
            </div>
          </Link>

          <Link
            href="/dashboard/node-system/applications/rejected"
            className="card"
            style={{ textDecoration: "none", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 140 }}
          >
            <div>
              <div className="badge badge-red" style={{ display: "inline-block", marginBottom: 12 }}><T>Rejected</T></div>
              <h4 style={{ margin: "0 0 8px 0", color: "var(--text)" }}><T>Rejected Applications</T></h4>
              <p className="muted" style={{ margin: 0, fontSize: "0.875rem" }}><T>Applications that did not meet criteria</T></p>
            </div>
            <div style={{ marginTop: 12 }}>
              <span style={{ fontWeight: 600, fontSize: "1.5rem", color: "var(--text)" }}>{rejectedCount}</span>
            </div>
          </Link>
        </div>

        {/* Summary */}
        <div className="card mt-18">
          <h3><T>Pipeline Summary</T></h3>
          <div className="grid-2 mt-12">
            <div>
              <div className="label"><T>Total Applications</T></div>
              <div style={{ fontSize: "1.75rem", fontWeight: 600, marginTop: 6, color: "var(--text)" }}>{totalCount}</div>
            </div>
            <div>
              <div className="label"><T>Completion Rate</T></div>
              <div style={{ fontSize: "1.75rem", fontWeight: 600, marginTop: 6, color: "var(--text)" }}>
                {totalCount > 0 ? ((approvedCount / totalCount) * 100).toFixed(0) : 0}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
