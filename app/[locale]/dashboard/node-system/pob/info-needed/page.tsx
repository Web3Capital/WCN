import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";
import { AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = dashboardMeta("Info Needed", "PoB reviews needing more information");

export default async function InfoNeededPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  if (!isAdminRole(session.user.role)) redirect("/dashboard");

  const prisma = getPrisma();

  const reviews = await prisma.review.findMany({
    where: {
      targetType: "POB",
      status: "OPEN",
      decision: "NEEDS_CHANGES",
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
        <h1><T>Info Needed</T></h1>
        <p className="muted">
          <T>Proof of business records requiring additional information</T>
        </p>

        <div className="card mt-14">
          <div className="card-header">
            <h3><T>Waiting for more info</T></h3>
            <span className="badge badge-sm badge-amber">{reviews.length}</span>
          </div>
          {reviews.length === 0 ? (
            <div className="empty-state">
              <AlertCircle size={40} className="empty-state-icon" />
              <p className="text-sm"><T>No records needing info</T></p>
              <p className="muted text-xs mt-8"><T>Records will appear here when info is requested</T></p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th><T>Record ID</T></th>
                  <th><T>Reviewer</T></th>
                  <th><T>Info Requested</T></th>
                  <th><T>Requested Date</T></th>
                  <th><T>Days waiting</T></th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review: any) => {
                  const daysWaiting = Math.floor(
                    (Date.now() - new Date(review.createdAt).getTime()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <tr key={review.id}>
                      <td className="font-mono text-sm">{review.targetId.slice(0, 12)}</td>
                      <td className="text-sm">{review.reviewer?.name || review.reviewer?.email || "—"}</td>
                      <td className="text-sm muted truncate" style={{ maxWidth: 300 }}>
                        {review.notes || "See details"}
                      </td>
                      <td className="text-sm muted">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </td>
                      <td className="text-sm font-bold text-amber-600">{daysWaiting} days</td>
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
