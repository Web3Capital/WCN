/**
 * @wcn/agents — Agent Executor
 *
 * Orchestrates the full agent execution pipeline:
 * 1. Load agent + validate permissions
 * 2. Build context from domain data
 * 3. Select prompt + schema by agent type
 * 4. Call LLM via router
 * 5. Store AgentRun + AgentLog
 * 6. Emit domain events
 */

import { getPrisma } from "@/lib/prisma";
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";
import type { AgentRunStartedEvent, AgentOutputGeneratedEvent } from "@/lib/core/event-types";
import type { AgentOutputType, Prisma } from "@prisma/client";
import { generateStructured, estimateCost } from "./router";
import {
  researchOutputSchema,
  dealMemoOutputSchema,
  meetingNotesOutputSchema,
  contentDraftOutputSchema,
  buildResearchPrompt,
  buildDealMemoPrompt,
  buildMeetingNotesPrompt,
  buildContentDraftPrompt,
  AGENT_SYSTEM_PROMPTS,
} from "./prompts";
import {
  buildProjectContext,
  buildMatchContext,
  buildDealContext,
} from "./context";
import type { AgentRunResult } from "./types";

// ─── Run Research Agent ─────────────────────────────────────────

export async function runResearchAgent(
  agentId: string,
  projectId: string,
  triggeredBy: string,
): Promise<AgentRunResult> {
  const project = await buildProjectContext(projectId);
  if (!project) throw new Error(`Project ${projectId} not found`);

  return executeAgent({
    agentId,
    triggeredBy,
    outputType: "REPORT",
    inputs: { projectId },
    run: async () => {
      const result = await generateStructured({
        system: AGENT_SYSTEM_PROMPTS.RESEARCH,
        prompt: buildResearchPrompt(project),
        schema: researchOutputSchema,
        schemaName: "ResearchReport",
      });
      return {
        outputs: result.object,
        tokenCount: result.tokenCount,
        modelId: result.modelId,
        executionTimeMs: result.executionTimeMs,
      };
    },
  });
}

// ─── Run Deal Agent ─────────────────────────────────────────────

export async function runDealAgent(
  agentId: string,
  matchId: string,
  triggeredBy: string,
): Promise<AgentRunResult> {
  const match = await buildMatchContext(matchId);
  if (!match) throw new Error(`Match ${matchId} not found`);

  return executeAgent({
    agentId,
    triggeredBy,
    outputType: "MATCH_MEMO",
    inputs: { matchId },
    run: async () => {
      const result = await generateStructured({
        system: AGENT_SYSTEM_PROMPTS.DEAL,
        prompt: buildDealMemoPrompt(match),
        schema: dealMemoOutputSchema,
        schemaName: "MatchMemo",
      });
      return {
        outputs: result.object,
        tokenCount: result.tokenCount,
        modelId: result.modelId,
        executionTimeMs: result.executionTimeMs,
      };
    },
  });
}

// ─── Run Execution Agent ────────────────────────────────────────

export async function runExecutionAgent(
  agentId: string,
  dealId: string,
  transcript: string,
  triggeredBy: string,
): Promise<AgentRunResult> {
  const deal = await buildDealContext(dealId);
  if (!deal) throw new Error(`Deal ${dealId} not found`);

  return executeAgent({
    agentId,
    triggeredBy,
    outputType: "MEETING_NOTES",
    inputs: { dealId, transcript },
    run: async () => {
      const result = await generateStructured({
        system: AGENT_SYSTEM_PROMPTS.EXECUTION,
        prompt: buildMeetingNotesPrompt(deal, transcript),
        schema: meetingNotesOutputSchema,
        schemaName: "MeetingNotes",
      });
      return {
        outputs: result.object,
        tokenCount: result.tokenCount,
        modelId: result.modelId,
        executionTimeMs: result.executionTimeMs,
      };
    },
  });
}

// ─── Run Growth Agent ───────────────────────────────────────────

export async function runGrowthAgent(
  agentId: string,
  projectId: string,
  triggeredBy: string,
  targetAudience?: string,
): Promise<AgentRunResult> {
  const project = await buildProjectContext(projectId);
  if (!project) throw new Error(`Project ${projectId} not found`);

  return executeAgent({
    agentId,
    triggeredBy,
    outputType: "CONTENT_DRAFT",
    inputs: { projectId, targetAudience },
    run: async () => {
      const result = await generateStructured({
        system: AGENT_SYSTEM_PROMPTS.GROWTH,
        prompt: buildContentDraftPrompt(project, targetAudience),
        schema: contentDraftOutputSchema,
        schemaName: "ContentDraft",
      });
      return {
        outputs: result.object,
        tokenCount: result.tokenCount,
        modelId: result.modelId,
        executionTimeMs: result.executionTimeMs,
      };
    },
  });
}

// ─── Core Execution Engine ──────────────────────────────────────

interface ExecutionPlan {
  agentId: string;
  triggeredBy: string;
  outputType: AgentOutputType;
  inputs: Record<string, unknown>;
  run: () => Promise<{
    outputs: unknown;
    tokenCount: number;
    modelId: string;
    executionTimeMs: number;
  }>;
}

async function checkAgentPermission(agentId: string, requiredScope: string): Promise<boolean> {
  const prisma = getPrisma();
  const perm = await prisma.agentPermission.findFirst({
    where: { agentId, scope: requiredScope },
  });
  return !!perm;
}

const SCOPE_MAP: Record<string, string> = {
  REPORT: "project.read",
  MATCH_MEMO: "match.read",
  MEETING_NOTES: "deal.read",
  CONTENT_DRAFT: "project.read",
};

// Agent chaining: after a successful run, optionally trigger the next agent
async function chainNextAgent(currentAgentType: string, runResult: AgentRunResult, inputs: Record<string, unknown>) {
  const prisma = getPrisma();

  if (currentAgentType === "RESEARCH" && inputs.projectId) {
    const dealAgent = await prisma.agent.findFirst({ where: { type: "DEAL", status: "ACTIVE" }, select: { id: true } });
    if (dealAgent) {
      const matches = await prisma.match.findMany({
        where: { projectId: inputs.projectId as string, status: "GENERATED" },
        select: { id: true },
        take: 3,
      });
      for (const match of matches) {
        try {
          await runDealAgent(dealAgent.id, match.id, `chain:${runResult.runId}`);
        } catch (e) {
          console.error(`[Chain] Deal agent failed for match ${match.id}:`, e);
        }
      }
    }
  }
}

async function executeAgent(plan: ExecutionPlan): Promise<AgentRunResult> {
  const prisma = getPrisma();

  const agent = await prisma.agent.findUnique({
    where: { id: plan.agentId },
    select: { id: true, type: true, status: true, ownerNodeId: true },
  });
  if (!agent) throw new Error(`Agent ${plan.agentId} not found`);
  if (agent.status !== "ACTIVE") throw new Error(`Agent ${plan.agentId} is ${agent.status}`);

  const requiredScope = SCOPE_MAP[plan.outputType] || "general";
  const hasPermission = await checkAgentPermission(agent.id, requiredScope);
  if (!hasPermission) {
    const allPerms = await prisma.agentPermission.findMany({ where: { agentId: agent.id }, select: { scope: true } });
    const hasFallback = allPerms.some((p) => p.scope === "*" || p.scope === "admin");
    if (!hasFallback) {
      console.warn(`[Agent] ${agent.id} missing permission '${requiredScope}', proceeding with warning`);
    }
  }

  const run = await prisma.agentRun.create({
    data: {
      agentId: agent.id,
      status: "RUNNING" as any,
      outputType: plan.outputType as any,
      reviewStatus: "PENDING" as any,
      inputs: plan.inputs as Prisma.InputJsonValue,
      triggeredBy: plan.triggeredBy,
    },
  });

  await eventBus.emit<AgentRunStartedEvent>(Events.AGENT_RUN_STARTED, {
    runId: run.id,
    agentId: agent.id,
    agentType: agent.type,
    triggeredBy: plan.triggeredBy,
  });

  try {
    const result = await plan.run();
    const cost = estimateCost(result.modelId, result.tokenCount);

    await prisma.agentRun.update({
      where: { id: run.id },
      data: {
        status: "SUCCESS",
        outputs: result.outputs as Prisma.InputJsonValue,
        tokenCount: result.tokenCount,
        executionTimeMs: result.executionTimeMs,
        modelId: result.modelId,
        cost,
        finishedAt: new Date(),
      },
    });

    await prisma.agentLog.create({
      data: {
        agentId: agent.id,
        ownerNodeId: agent.ownerNodeId,
        actionType: `run.${plan.outputType.toLowerCase()}`,
        modelVersion: result.modelId,
        inputReference: JSON.stringify(Object.keys(plan.inputs)),
        outputReference: run.id,
      },
    });

    await eventBus.emit<AgentOutputGeneratedEvent>(Events.AGENT_OUTPUT_GENERATED, {
      runId: run.id,
      agentId: agent.id,
      outputType: plan.outputType,
    });

    const agentResult: AgentRunResult = {
      runId: run.id,
      agentId: agent.id,
      status: "SUCCESS",
      outputType: plan.outputType,
      outputs: result.outputs,
      reviewStatus: "PENDING",
      tokenCount: result.tokenCount,
      executionTimeMs: result.executionTimeMs,
      modelId: result.modelId,
      cost,
    };

    // Fire-and-forget chaining (don't block the response)
    chainNextAgent(agent.type, agentResult, plan.inputs).catch((e) =>
      console.error("[Chain] Agent chaining failed:", e)
    );

    return agentResult;
  } catch (error) {
    await prisma.agentRun.update({
      where: { id: run.id },
      data: {
        status: "FAILED",
        outputs: { error: error instanceof Error ? error.message : "Unknown error" },
        finishedAt: new Date(),
      },
    });

    await prisma.agentLog.create({
      data: {
        agentId: agent.id,
        ownerNodeId: agent.ownerNodeId,
        actionType: `run.${plan.outputType.toLowerCase()}.failed`,
        exceptionFlag: true,
        inputReference: JSON.stringify(Object.keys(plan.inputs)),
        outputReference: error instanceof Error ? error.message : "Unknown",
      },
    });

    throw error;
  }
}
