import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { getWeeklyTimeSeries, getFunnelData, detectAnomalies } from "@/lib/modules/cockpit/weekly-report";
import { T } from "@/app/[locale]/dashboard/_components/translated-text";
import { DataCockpit } from "./ui";

export const dynamic = "force-dynamic";

export default async function DataCockpitPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const isAdmin = isAdminRole(session.user.role);
  if (!isAdmin) redirect("/dashboard");

  const prisma = getPrisma();

  const [
    activeNodes, activeProjects, activeDeals, totalTasks, totalEvidence, totalPoB,
    totalCapital, totalAgents, openDisputes, settledCycles,
    nodesByStatus, dealsByStage, pobByStatus,
    timeSeries, funnel,
  ] = await Promise.all([
    prisma.node.count({ where: { status: "LIVE" } }),
    prisma.project.count({ where: { status: { in: ["ACTIVE", "IN_DEAL_ROOM", "CURATED"] } } }),
    prisma.deal.count({ where: { stage: { notIn: ["PASSED", "PAUSED"] } } }),
    prisma.task.count(),
    prisma.evidence.count(),
    prisma.poBRecord.count(),
    prisma.capitalProfile.count(),
    prisma.agent.count(),
    prisma.dispute.count({ where: { status: "OPEN" } }),
    prisma.settlementCycle.count({ where: { status: { in: ["LOCKED", "EXPORTED", "FINALIZED"] } } }),
    prisma.node.groupBy({ by: ["status"], _count: true }),
    prisma.deal.groupBy({ by: ["stage"], _count: true }),
    prisma.poBRecord.groupBy({ by: ["pobEventStatus"], _count: true }),
    getWeeklyTimeSeries(prisma),
    getFunnelData(prisma),
  ]);

  const anomalies = [
    detectAnomalies(timeSeries.deals, "Deals"),
    detectAnomalies(timeSeries.pob, "PoB Records"),
    detectAnomalies(timeSeries.evidence, "Evidence"),
    detectAnomalies(timeSeries.tasks, "Tasks"),
  ].filter(Boolean) as NonNullable<ReturnType<typeof detectAnomalies>>[];

  const data = {
    summary: { activeNodes, activeProjects, activeDeals, totalTasks, totalEvidence, totalPoB, totalCapital, totalAgents, openDisputes, settledCycles },
    distributions: {
      nodesByStatus: nodesByStatus.map((g) => ({ label: g.status, count: g._count })),
      dealsByStage: dealsByStage.map((g) => ({ label: g.stage, count: g._count })),
      pobByStatus: pobByStatus.map((g) => ({ label: g.pobEventStatus, count: g._count })),
    },
    timeSeries,
    funnel,
    anomalies,
  };

  return (
    <div className="dashboard-page section">
      <div className="container">
        <span className="eyebrow"><T>Intelligence</T></span>
        <h1><T>Network Health</T></h1>
        <p className="muted"><T>Network-wide metrics for operational intelligence — not vanity metrics.</T></p>
        <DataCockpit data={data} />
      </div>
    </div>
  );
}
