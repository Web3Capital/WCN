import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { DisputesUI } from "./ui";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";
import { dashboardMeta } from "@/app/[locale]/dashboard/_lib/metadata";

export const dynamic = "force-dynamic";


export const metadata = dashboardMeta("Disputes", "Dispute management");
export default async function DisputesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const prisma = getPrisma();
  const isAdmin = isAdminRole(session.user.role);
  const isReviewer = ["REVIEWER", "RISK_DESK"].includes(session.user.role);

  if (!isAdmin && !isReviewer) redirect("/dashboard");

  const disputes = await prisma.dispute.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      pob: { select: { id: true, businessType: true, loopType: true } },
    },
  });

  return (
    <div className="dashboard-page section">
      <div className="container-wide">
        <span className="eyebrow"><T>Verification</T></span>
        <h1><T>Disputes</T></h1>
        <DisputesUI disputes={JSON.parse(JSON.stringify(disputes))} />
      </div>
    </div>
  );
}
