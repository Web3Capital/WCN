import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";
import { Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = dashboardMeta("Submitted PoB", "Submitted proof of business records");

export default async function SubmittedPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  if (!isAdminRole(session.user.role)) redirect("/dashboard");

  const prisma = getPrisma();

  const reviews = await prisma.review.findMany({
    where: {
      targetType: "POB",
      status: "OPEN",
      reviewerId: null,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      reviewer: { select: { name: true, email: true } },
    },
  });

  return (
    <div className="dashboard-page section">
      <div className="container-wide">
        <span className="eyebrow"><T>Node System</T></span>
        <h1><T>Submitted PoB</T></h1>
        <p className="muted">
          <T>Proof of business submissions awaiting action</T>
        </p>

        <div className="card mt-14">
          <div className="card-header">
            <h3><T>Pending submissions</T></h3>
            <span className="badge badge-sm">{reviews.length}</span>
          </div>
          {reviews.length === 0 ? (
            <div className="empty-state">
              <Clock size={40} className="empty-state-icon" />
              <p className="text-sm"><T>No pending PoB submissions</T></p>
              <p className="muted text-xs mt-8"><T>All submissions have been reviewed</T></p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th><T>Record ID</T></th>
                  <th><T>Reviewer</T></th>
                  <th><T>Notes</T></th>
                  <th><T>Submitted</T></th>
                  <th><T>Days pending</T></th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review: any) => {
                  const daysPending = Math.floor(
                    (Date.now() - new Date(review.createdAt).getTime()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <tr key={review.id}>
                      <td className="font-mono text-sm">{review.targetId.slice(0, 12)}</td>
                      <td className="text-sm">{review.reviewer?.name || review.reviewer?.email || "Unassigned"}</td>
                      <td className="text-sm muted truncate" style={{ maxWidth: 250 }}>
                        {review.notes || "—"}
                      </td>
                      <td className="text-sm muted">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </td>
                      <td className="text-sm font-bold">{daysPending} days</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
