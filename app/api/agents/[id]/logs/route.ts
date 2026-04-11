import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requireSignedIn } from "@/lib/admin";
import { isAdminRole } from "@/lib/permissions";
import { apiOk, apiCreated, apiUnauthorized, apiNotFound } from "@/lib/core/api-response";
import { getOwnedNodeIds } from "@/lib/member-data-scope";

async function assertAgentAccess(prisma: ReturnType<typeof getPrisma>, agentId: string, userId: string, role: string) {
  if (isAdminRole(role)) return true;
  const ownedNodeIds = await getOwnedNodeIds(prisma, userId);
  const scoped = await prisma.agent.findFirst({
    where: { id: agentId, ownerNodeId: { in: ownedNodeIds } },
    select: { id: true },
  });
  return !!scoped;
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const hasAccess = await assertAgentAccess(prisma, params.id, auth.session.user!.id, auth.session.user?.role ?? "USER");
  if (!hasAccess) return apiUnauthorized();

  const logs = await prisma.agentLog.findMany({
    where: { agentId: params.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return apiOk(logs);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const hasAccess = await assertAgentAccess(prisma, params.id, auth.session.user!.id, auth.session.user?.role ?? "USER");
  if (!hasAccess) return apiUnauthorized();

  const body = await req.json().catch(() => ({}));

  const agent = await prisma.agent.findUnique({ where: { id: params.id }, select: { ownerNodeId: true } });
  if (!agent) return apiNotFound("Agent");

  const log = await prisma.agentLog.create({
    data: {
      agentId: params.id,
      ownerNodeId: agent.ownerNodeId,
      taskId: body?.taskId ? String(body.taskId) : null,
      caseId: body?.caseId ? String(body.caseId) : null,
      modelVersion: body?.modelVersion ? String(body.modelVersion) : null,
      actionType: String(body?.actionType ?? "unknown"),
      inputReference: body?.inputReference ? String(body.inputReference) : null,
      outputReference: body?.outputReference ? String(body.outputReference) : null,
      humanApprovalId: body?.humanApprovalId ? String(body.humanApprovalId) : null,
      exceptionFlag: !!body?.exceptionFlag,
    },
  });

  return apiCreated(log);
}
