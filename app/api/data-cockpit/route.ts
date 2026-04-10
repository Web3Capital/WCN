import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requireSignedIn } from "@/lib/admin";
import { isAdminRole } from "@/lib/permissions";
import { apiOk, apiUnauthorized, apiForbidden } from "@/lib/core/api-response";
import { getWeeklyTimeSeries, getFunnelData, detectAnomalies } from "@/lib/modules/cockpit/weekly-report";

export async function GET() {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const isAdmin = isAdminRole(auth.session.user?.role ?? "USER");
  if (!isAdmin) return apiForbidden("Admin only.");

  const prisma = getPrisma();

  const [
    nodesByStatus, projectsByStatus, dealsByStage,
    tasksByStatus, evidenceByStatus, pobByStatus,
    activeNodes, activeProjects, activeDeals,
    totalTasks, totalEvidence, totalPoB,
    totalCapital, totalAgents, totalDisputes,
    openDisputes, settledCycles,
    timeSeries, funnel,
  ] = await Promise.all([
    prisma.node.groupBy({ by: ["status"], _count: true }),
    prisma.project.groupBy({ by: ["status"], _count: true }),
    prisma.deal.groupBy({ by: ["stage"], _count: true }),
    prisma.task.groupBy({ by: ["status"], _count: true }),
    prisma.evidence.groupBy({ by: ["reviewStatus"], _count: true }),
    prisma.poBRecord.groupBy({ by: ["pobEventStatus"], _count: true }),
    prisma.node.count({ where: { status: "LIVE" } }),
    prisma.project.count({ where: { status: { in: ["ACTIVE", "IN_DEAL_ROOM", "CURATED"] } } }),
    prisma.deal.count({ where: { stage: { notIn: ["PASSED", "PAUSED"] } } }),
    prisma.task.count(),
    prisma.evidence.count(),
    prisma.poBRecord.count(),
    prisma.capitalProfile.count(),
    prisma.agent.count(),
    prisma.dispute.count(),
    prisma.dispute.count({ where: { status: "OPEN" } }),
    prisma.settlementCycle.count({ where: { status: { in: ["LOCKED", "EXPORTED", "FINALIZED"] } } }),
    getWeeklyTimeSeries(prisma),
    getFunnelData(prisma),
  ]);

  const anomalies = [
    detectAnomalies(timeSeries.deals, "Deals"),
    detectAnomalies(timeSeries.pob, "PoB Records"),
    detectAnomalies(timeSeries.evidence, "Evidence"),
    detectAnomalies(timeSeries.tasks, "Tasks"),
  ].filter(Boolean);

  return apiOk({
    summary: { activeNodes, activeProjects, activeDeals, totalTasks, totalEvidence, totalPoB, totalCapital, totalAgents, totalDisputes, openDisputes, settledCycles },
    distributions: {
      nodesByStatus: nodesByStatus.map((g) => ({ label: g.status, count: g._count })),
      projectsByStatus: projectsByStatus.map((g) => ({ label: g.status, count: g._count })),
      dealsByStage: dealsByStage.map((g) => ({ label: g.stage, count: g._count })),
      tasksByStatus: tasksByStatus.map((g) => ({ label: g.status, count: g._count })),
      evidenceByStatus: evidenceByStatus.map((g) => ({ label: g.reviewStatus, count: g._count })),
      pobByStatus: pobByStatus.map((g) => ({ label: g.pobEventStatus, count: g._count })),
    },
    timeSeries,
    funnel,
    anomalies,
  });
}
