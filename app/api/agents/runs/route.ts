import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requirePermission, requireSignedIn } from "@/lib/admin";
import { ownsAgent } from "@/lib/auth/resource-scope";
import { AgentRunStatus } from "@prisma/client";
import { getOwnedNodeIds, memberAgentRunsWhere } from "@/lib/member-data-scope";
import { redactAgentForMember } from "@/lib/member-redact";
import { isAdminRole } from "@/lib/permissions";
import { apiOk, apiCreated, apiUnauthorized, apiValidationError } from "@/lib/core/api-response";
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";

export async function GET() {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const isAdmin = isAdminRole(auth.session.user?.role ?? "USER");
  const userId = auth.session.user!.id;

  const where = isAdmin ? {} : memberAgentRunsWhere(await getOwnedNodeIds(prisma, userId));

  const runs = await prisma.agentRun.findMany({
    where,
    orderBy: { startedAt: "desc" },
    take: 200,
    include: { agent: true, task: true },
  });

  return apiOk(isAdmin ? runs : runs.map((r) => ({ ...r, agent: r.agent ? redactAgentForMember(r.agent) : r.agent })));
}

export async function POST(req: Request) {
  // Triggering an agent run is an "update" of the agent — AGENT_OWNER /
  // NODE_OWNER on their own agents, plus admins. Matrix grants `update+agent`
  // accordingly.
  const auth = await requirePermission("update", "agent");
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const agentId = String(body?.agentId ?? "").trim();
  if (!agentId) return apiValidationError([{ path: "agentId", message: "Missing agentId." }]);

  // Row-level: non-admin must own the agent.
  const isAdmin = isAdminRole(auth.session.user?.role ?? "USER");
  if (!isAdmin && !(await ownsAgent(prisma, auth.session.user!.id, agentId))) {
    return apiUnauthorized();
  }

  const run = await prisma.agentRun.create({
    data: {
      agentId,
      taskId: body?.taskId ? String(body.taskId) : null,
      status: body?.status ? (String(body.status) as AgentRunStatus) : undefined,
      inputs: body?.inputs ?? null,
      outputs: body?.outputs ?? null,
      cost: body?.cost !== undefined ? Number(body.cost) : null,
      finishedAt: body?.finishedAt ? new Date(String(body.finishedAt)) : null,
    },
    include: { agent: true, task: true },
  });

  await eventBus.emit(Events.AGENT_RUN_STARTED, {
    runId: run.id,
    agentId,
    agentType: run.agent?.type ?? "",
    triggeredBy: auth.session.user?.id ?? "system",
  }, { actorId: auth.session.user?.id });

  return apiCreated(run);
}
