/**
 * @wcn/agents — Event Handlers
 */
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";
import type { ProjectCreatedEvent, MatchGeneratedEvent, AgentOutputGeneratedEvent } from "@/lib/core/event-types";
import { notifyMany } from "@/lib/notifications";
import { getPrisma } from "@/lib/prisma";

let _initialized = false;

export function initAgentHandlers(): void {
  if (_initialized) return;
  _initialized = true;

  eventBus.on<ProjectCreatedEvent>(Events.PROJECT_CREATED, async (payload) => {
    try {
      const prisma = getPrisma();
      const researchAgent = await prisma.agent.findFirst({
        where: { type: "RESEARCH", status: "ACTIVE" },
        select: { id: true },
      });
      if (!researchAgent) return;

      const { runResearchAgent } = await import("@/lib/modules/agents/executor");
      await runResearchAgent(researchAgent.id, payload.projectId, "system:event");
    } catch (e) {
      console.error("[Agent] Research Agent auto-trigger failed:", e);
    }
  });

  eventBus.on<MatchGeneratedEvent>(Events.MATCH_GENERATED, async (payload) => {
    try {
      const prisma = getPrisma();
      const dealAgent = await prisma.agent.findFirst({
        where: { type: "DEAL", status: "ACTIVE" },
        select: { id: true },
      });
      if (!dealAgent) return;

      const { runDealAgent } = await import("@/lib/modules/agents/executor");
      await runDealAgent(dealAgent.id, payload.matchId, "system:event");
    } catch (e) {
      console.error("[Agent] Deal Agent auto-trigger failed:", e);
    }
  });

  eventBus.on<AgentOutputGeneratedEvent>(Events.AGENT_OUTPUT_GENERATED, async (payload) => {
    try {
      const prisma = getPrisma();
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN", accountStatus: "ACTIVE" },
        select: { id: true },
        take: 10,
      });
      if (admins.length === 0) return;
      await notifyMany(
        admins.map((a) => a.id),
        {
          type: "GENERAL",
          title: `Agent output ready for review (${payload.outputType})`,
          entityType: "AgentRun",
          entityId: payload.runId,
        },
      );
    } catch (e) {
      console.error("[Agent] Output notification failed:", e);
    }
  });

  eventBus.on(Events.AGENT_OUTPUT_REVIEWED, async (payload: any) => {
    if (payload.reviewStatus !== "APPROVED" && payload.reviewStatus !== "MODIFIED") return;
    try {
      const prisma = getPrisma();
      const run = await prisma.agentRun.findUnique({
        where: { id: payload.runId },
        select: { id: true, agentId: true, outputType: true, outputs: true, inputs: true, agent: { select: { type: true } } },
      });
      if (!run) return;

      const agentType = run.agent.type;
      const outputs = run.outputs as Record<string, any> | null;
      const inputs = run.inputs as Record<string, any> | null;

      if (agentType === "RESEARCH" && inputs?.projectId && outputs) {
        await prisma.project.update({
          where: { id: inputs.projectId },
          data: {
            ...(outputs.summary ? { description: outputs.summary } : {}),
            ...(outputs.riskTags ? { metadata: { riskTags: outputs.riskTags } } : {}),
          },
        }).catch(() => {});
      }

      if (agentType === "DEAL" && inputs?.matchId && outputs) {
        const match = await prisma.match.findUnique({ where: { id: inputs.matchId }, select: { convertedDealId: true } });
        if (match?.convertedDealId) {
          await prisma.dealNote.create({
            data: { dealId: match.convertedDealId, content: JSON.stringify(outputs), authorId: payload.reviewedBy },
          }).catch(() => {});
        }
      }

      if (agentType === "EXECUTION" && inputs?.dealId && outputs?.actionItems) {
        for (const item of outputs.actionItems as Array<{ title: string; assignee?: string }>) {
          await prisma.task.create({
            data: {
              title: item.title,
              dealId: inputs.dealId,
              status: "DRAFT",
              type: "EXECUTION",
            },
          }).catch(() => {});
        }
      }

      if (agentType === "GROWTH" && inputs?.projectId && outputs) {
        const agent = await prisma.agent.findUnique({ where: { id: run.agentId }, select: { ownerNodeId: true } });
        if (agent?.ownerNodeId) {
          await prisma.agentLog.create({
            data: {
              agentId: run.agentId,
              ownerNodeId: agent.ownerNodeId,
              actionType: "post_approval.growth_strategy",
              outputReference: JSON.stringify(outputs),
            },
          }).catch(() => {});
        }
      }
    } catch (e) {
      console.error("[Agent] Post-approval automation failed:", e);
    }
  });
}
