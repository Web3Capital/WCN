import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { HttpError, route } from "@/lib/core/api/route";
import { z } from "zod";
import { getWeeklyTimeSeries, getFunnelData, detectAnomalies } from "@/lib/modules/cockpit/weekly-report";

export const GET = route.session({
  input: z.object({}),
  rateLimit: "expensive",
  handler: async ({ session }) => {
    const isAdmin = isAdminRole(session.user.role ?? "USER");
    if (!isAdmin) throw new HttpError(403, "FORBIDDEN", "Admin only.");

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

    return {
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
    };
  },
});
