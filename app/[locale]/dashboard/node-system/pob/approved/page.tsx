import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";
import { CheckCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = dashboardMeta("Approved PoB", "Approved proof of business records");

export default async function ApprovedPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  if (!isAdminRole(session.user.role)) redirect("/dashboard");

  const prisma = getPrisma();

  const reviews = await prisma.review.findMany({
    where: {
      targetType: "POB",
      decision: "APPROVE",
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
        <h1><T>Approved PoB</T></h1>
        <p className="muted">
          <T>Verified and approved proof of business records</T>
        </p>

        <div className="card mt-14">
          <div className="card-header">
            <h3><T>Approved records</T></h3>
            <span className="badge badge-sm badge-green">{reviews.length}</span>
          </div>
          {reviews.length === 0 ? (
            <div className="empty-state">
              <CheckCircle size={40} className="empty-state-icon" />
              <p className="text-sm"><T>No approved records</T></p>
              <p className="muted text-xs mt-8"><T>Approved records will appear here</T></p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th><T>Record ID</T></th>
                  <th><T>Reviewer</T></th>
                  <th><T>Approval Date</T></th>
                  <th><T>Notes</T></th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review: any) => (
                  <tr key={review.id}>
                    <td className="font-mono text-sm">{review.targetId.slice(0, 12)}</td>
                    <td className="text-sm">{review.reviewer?.name || review.reviewer?.email || "—"}</td>
                    <td className="text-sm muted">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </td>
                    <td className="text-sm muted truncate" style={{ maxWidth: 300 }}>
                      {review.notes || "Approved"}
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
