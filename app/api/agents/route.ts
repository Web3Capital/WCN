import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requirePermission, requireSignedIn } from "@/lib/admin";
import { getOwnedNodeIds, memberAgentsWhere } from "@/lib/member-data-scope";
import { redactAgentForMember } from "@/lib/member-redact";
import { AuditAction, writeAudit } from "@/lib/audit";
import { isAdminRole } from "@/lib/permissions";
import { apiOk, apiCreated, apiUnauthorized, apiValidationError } from "@/lib/core/api-response";

export async function GET() {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const isAdmin = isAdminRole(auth.session.user?.role ?? "USER");
  const userId = auth.session.user!.id;

  const where = isAdmin ? {} : memberAgentsWhere(await getOwnedNodeIds(prisma, userId));

  const agents = await prisma.agent.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { ownerNode: true, permissions: true },
  });

  return apiOk(isAdmin ? agents : agents.map(redactAgentForMember));
}

export async function POST(req: Request) {
  const auth = await requirePermission("create", "agent");
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const name = String(body?.name ?? "").trim();
  const type = String(body?.type ?? "").trim();
  const ownerNodeId = String(body?.ownerNodeId ?? "").trim();
  if (!name || !type || !ownerNodeId) {
    return apiValidationError([{ path: "name", message: "Missing name/type/ownerNodeId." }]);
  }

  // Row-level: non-admin must own the target ownerNode (NODE_OWNER /
  // AGENT_OWNER both create agents only on their own nodes per matrix intent).
  const isAdmin = isAdminRole(auth.session.user?.role ?? "USER");
  if (!isAdmin) {
    const ownedNodeIds = await getOwnedNodeIds(prisma, auth.session.user!.id);
    if (!ownedNodeIds.includes(ownerNodeId)) {
      return apiUnauthorized();
    }
  }

  const allowedTypes = new Set(["DEAL", "RESEARCH", "GROWTH", "EXECUTION", "LIQUIDITY"]);
  if (!allowedTypes.has(type)) {
    return apiValidationError([{ path: "type", message: "Invalid agent type." }]);
  }

  const agent = await prisma.agent.create({
    data: {
      name,
      type: type as any,
      endpoint: body?.endpoint ? String(body.endpoint) : null,
      ownerNodeId,
    },
    include: { ownerNode: true, permissions: true },
  });

  await writeAudit({
    actorUserId: auth.session.user?.id ?? null,
    action: AuditAction.AGENT_CREATE,
    targetType: "AGENT",
    targetId: agent.id,
    metadata: { name, type, ownerNodeId },
  });

  return apiCreated(agent);
}
