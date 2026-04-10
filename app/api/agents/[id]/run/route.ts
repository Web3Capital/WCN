import "@/lib/core/init";
import { requireSignedIn } from "@/lib/admin";
import { isAdminRole } from "@/lib/permissions";
import { getPrisma } from "@/lib/prisma";
import { AuditAction, writeAudit } from "@/lib/audit";
import { apiOk, apiUnauthorized, apiNotFound, apiValidationError, apiError } from "@/lib/core/api-response";
import {
  runResearchAgent,
  runDealAgent,
  runExecutionAgent,
  runGrowthAgent,
} from "@/lib/modules/agents/executor";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const userId = auth.session.user?.id ?? "system";
  const prisma = getPrisma();

  const agent = await prisma.agent.findUnique({
    where: { id: params.id },
    select: { id: true, type: true, status: true, ownerNodeId: true, ownerNode: { select: { ownerUserId: true } } },
  });
  if (!agent) return apiNotFound("Agent");
  if (agent.status !== "ACTIVE") {
    return apiValidationError([{ path: "status", message: `Agent is ${agent.status}, cannot run.` }]);
  }

  const isAdmin = isAdminRole(auth.session.user?.role ?? "USER");
  if (!isAdmin && agent.ownerNode.ownerUserId !== userId) {
    return apiUnauthorized();
  }

  const body = await req.json().catch(() => ({}));

  try {
    let result;

    switch (agent.type) {
      case "RESEARCH": {
        if (!body.projectId) return apiValidationError([{ path: "projectId", message: "Required for Research Agent" }]);
        result = await runResearchAgent(agent.id, body.projectId, userId);
        break;
      }
      case "DEAL": {
        if (!body.matchId) return apiValidationError([{ path: "matchId", message: "Required for Deal Agent" }]);
        result = await runDealAgent(agent.id, body.matchId, userId);
        break;
      }
      case "EXECUTION": {
        if (!body.dealId || !body.transcript) {
          return apiValidationError([{ path: "dealId,transcript", message: "Required for Execution Agent" }]);
        }
        result = await runExecutionAgent(agent.id, body.dealId, body.transcript, userId);
        break;
      }
      case "GROWTH": {
        if (!body.projectId) return apiValidationError([{ path: "projectId", message: "Required for Growth Agent" }]);
        result = await runGrowthAgent(agent.id, body.projectId, userId, body.targetAudience);
        break;
      }
      default:
        return apiValidationError([{ path: "type", message: `Agent type ${agent.type} has no executor` }]);
    }

    await writeAudit({
      actorUserId: userId,
      action: AuditAction.AGENT_RUN_CREATE,
      targetType: "AGENT",
      targetId: agent.id,
      metadata: { runId: result.runId, outputType: result.outputType, tokenCount: result.tokenCount },
    });

    return apiOk(result);
  } catch (error) {
    console.error("[Agent Run] Execution failed:", error);
    return apiError(
      "AGENT_EXECUTION_FAILED",
      error instanceof Error ? error.message : "Agent execution failed",
      500,
    );
  }
}
