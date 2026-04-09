import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { SettlementCycleDetailUI } from "./ui";

export const dynamic = "force-dynamic";

export default async function SettlementCycleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const prisma = getPrisma();
  const isAdmin = isAdminRole(session.user.role);
  const isFinance = session.user.role === "FINANCE_ADMIN";

  if (!isAdmin && !isFinance) redirect("/dashboard/settlement");

  const cycle = await prisma.settlementCycle.findUnique({
    where: { id },
    include: {
      lines: {
        include: { node: { select: { id: true, name: true } } },
        orderBy: { allocation: "desc" },
      },
    },
  });
  if (!cycle) redirect("/dashboard/settlement");

  const pendingApprovals = await prisma.approvalAction.findMany({
    where: { entityType: "SETTLEMENT_CYCLE", entityId: id, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="dashboard-page section">
      <div className="container">
        <SettlementCycleDetailUI
          cycle={JSON.parse(JSON.stringify(cycle))}
          pendingApprovals={JSON.parse(JSON.stringify(pendingApprovals))}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  );
}
