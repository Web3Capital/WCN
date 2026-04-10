import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { DisputesUI } from "./ui";

export const dynamic = "force-dynamic";

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
      <div className="container">
        <span className="eyebrow">Verification</span>
        <h1>Disputes</h1>
        <DisputesUI disputes={JSON.parse(JSON.stringify(disputes))} />
      </div>
    </div>
  );
}
