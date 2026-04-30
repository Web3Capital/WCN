import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";
import { Eye } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = dashboardMeta("Reviewing", "PoB records under active review");

export default async function ReviewingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  if (!isAdminRole(session.user.role)) redirect("/dashboard");

  const prisma = getPrisma();

  const reviews = await prisma.review.findMany({
    where: {
      targetType: "POB",
      status: "OPEN",
      reviewerId: { not: null },
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
        <h1><T>In Review</T></h1>
        <p className="muted">
          <T>Proof of business records currently under evaluation</T>
        </p>

        <div className="card mt-14">
          <div className="card-header">
            <h3><T>Records in review</T></h3>
            <span className="badge badge-sm badge-blue">{reviews.length}</span>
          </div>
          {reviews.length === 0 ? (
            <div className="empty-state">
              <Eye size={40} className="empty-state-icon" />
              <p className="text-sm"><T>No records in review</T></p>
              <p className="muted text-xs mt-8"><T>Records will appear here when review begins</T></p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th><T>Record ID</T></th>
                  <th><T>Reviewer</T></th>
                  <th><T>Review Started</T></th>
                  <th><T>Days in review</T></th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review: any) => {
                  const daysInReview = Math.floor(
                    // Server component runs once per request — Date.now() is per-request, not per-render
                    // eslint-disable-next-line react-hooks/purity
                    (Date.now() - new Date(review.createdAt).getTime()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <tr key={review.id}>
                      <td className="font-mono text-sm">{review.targetId.slice(0, 12)}</td>
                      <td className="text-sm">{review.reviewer?.name || review.reviewer?.email || "—"}</td>
                      <td className="text-sm muted">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </td>
                      <td className="text-sm">{daysInReview} days</td>
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
