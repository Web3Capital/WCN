import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { DisputeDetail } from "./ui";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";

export const dynamic = "force-dynamic";


export const metadata = dashboardMeta("Dispute Details", "View dispute details");
export default async function DisputeDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const isAdmin = isAdminRole(session.user.role);
  const isReviewer = ["REVIEWER", "RISK_DESK"].includes(session.user.role);
  if (!isAdmin && !isReviewer) redirect("/dashboard");

  const prisma = getPrisma();

  const dispute = await prisma.dispute.findUnique({
    where: { id: params.id },
    include: {
      pob: {
        include: {
          node: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } },
          deal: { select: { id: true, title: true } },
          attributions: { include: { node: { select: { id: true, name: true } } } },
        },
      },
    },
  });

  if (!dispute) redirect("/dashboard/disputes");

  const auditLogs = await prisma.auditLog.findMany({
    where: { targetType: "DISPUTE", targetId: params.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="dashboard-page section">
      <div className="container-wide">
        <DisputeDetail
          dispute={JSON.parse(JSON.stringify(dispute))}
          auditLogs={JSON.parse(JSON.stringify(auditLogs))}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  );
}
