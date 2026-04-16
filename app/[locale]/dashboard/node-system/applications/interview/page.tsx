import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";
import { Link } from "@/i18n/routing";
import { StatusBadge } from "@/app/[locale]/dashboard/_components";

export const dynamic = "force-dynamic";

export const metadata = dashboardMeta("Interview Stage", "Applications in interview phase");

function formatDate(date: Date): string {
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function InterviewApplicationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const isAdmin = isAdminRole(session.user.role);
  if (!isAdmin) {
    return (
      <div className="dashboard-page section">
        <div className="container-wide">
          <span className="eyebrow"><T>Admin</T></span>
          <h1><T>Interview Stage</T></h1>
          <div className="card" style={{ marginTop: 18, padding: "14px 16px" }}>
            <p className="muted" style={{ margin: 0 }}>
              <T>This page is only available to administrators.</T>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const prisma = getPrisma();

  // Interview stage applications are part of REVIEWING status
  const applications = await prisma.application.findMany({
    where: { status: "REVIEWING" },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="dashboard-page section">
      <div className="container-wide">
        <span className="eyebrow"><T>Node Operations</T></span>
        <h1><T>Interview Stage</T></h1>
        <p className="muted">
          <T>Applications scheduled for or in interview process</T>
        </p>

        <div className="card mt-18">
          {applications.length === 0 ? (
            <div style={{ padding: "24px 16px" }}>
              <p className="muted" style={{ margin: 0 }}>
                <T>No applications in this stage at this time.</T>
              </p>
              <p style={{ margin: "12px 0 0 0" }}>
                <Link href="/dashboard/node-system/applications"><T>Back to applications hub</T></Link>
              </p>
            </div>
          ) : (
            <>
              <div style={{ overflowX: "auto" }}>
                <table className="status-table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", paddingLeft: 16 }}>
                        <T>Applicant Name</T>
                      </th>
                      <th style={{ textAlign: "left", paddingLeft: 16 }}>
                        <T>Contact</T>
                      </th>
                      <th style={{ textAlign: "left", paddingLeft: 16 }}>
                        <T>Organization</T>
                      </th>
                      <th style={{ textAlign: "left", paddingLeft: 16 }}>
                        <T>Status</T>
                      </th>
                      <th style={{ textAlign: "left", paddingLeft: 16 }}>
                        <T>Submitted</T>
                      </th>
                      <th style={{ textAlign: "right", paddingRight: 16 }}>
                        <T>Action</T>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <tr key={app.id}>
                        <td style={{ paddingLeft: 16, fontWeight: 500 }}>
                          {app.applicantName}
                        </td>
                        <td style={{ paddingLeft: 16, fontSize: "0.875rem" }}>
                          {app.contact}
                        </td>
                        <td style={{ paddingLeft: 16, fontSize: "0.875rem" }}>
                          <span className="muted">{app.organization || "—"}</span>
                        </td>
                        <td style={{ paddingLeft: 16 }}>
                          <StatusBadge status={app.status} />
                        </td>
                        <td style={{ paddingLeft: 16, fontSize: "0.875rem" }}>
                          <span className="muted">{formatDate(app.createdAt)}</span>
                        </td>
                        <td style={{ paddingRight: 16, textAlign: "right" }}>
                          <Link
                            href={`/dashboard/applications/${app.id}`}
                            className="button-text"
                            style={{ fontSize: "0.875rem" }}
                          >
                            <T>Review</T> →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ padding: "16px", borderTop: "1px solid var(--border)" }}>
                <p className="muted text-xs" style={{ margin: 0 }}>
                  {applications.length} <T>applications shown</T>
                </p>
              </div>
            </>
          )}
        </div>

        <div style={{ marginTop: 18 }}>
          <Link href="/dashboard/node-system/applications" className="button-secondary">
            ← <T>Back to Applications Hub</T>
          </Link>
        </div>
      </div>
    </div>
  );
}
