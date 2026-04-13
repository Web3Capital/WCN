import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { isAdminRole } from "@/lib/permissions";
import { apiCreated, apiUnauthorized, apiNotFound, zodToApiError } from "@/lib/core/api-response";
import { parseBody, addDealParticipantSchema } from "@/lib/core/validation";
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";
import { getOwnedNodeIds } from "@/lib/member-data-scope";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requirePermission("update", "deal");
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  if (!isAdminRole(auth.session.user?.role ?? "USER")) {
    const ownedNodeIds = await getOwnedNodeIds(prisma, auth.session.user!.id);
    const hasAccess = await prisma.deal.findFirst({
      where: {
        id: params.id,
        OR: [
          { project: { node: { id: { in: ownedNodeIds } } } },
          { participants: { some: { nodeId: { in: ownedNodeIds } } } },
        ],
      },
      select: { id: true },
    });
    if (!hasAccess) return apiNotFound("Deal");
  }

  const body = await req.json().catch(() => ({}));
  const parsed = parseBody(addDealParticipantSchema, body);
  if (!parsed.ok) return zodToApiError(parsed.error);

  const { nodeId, role } = parsed.data;

  const participant = await prisma.dealParticipant.upsert({
    where: { dealId_nodeId: { dealId: params.id, nodeId } },
    create: { dealId: params.id, nodeId, role, userId: body?.userId ?? null },
    update: { role },
    include: { node: { select: { id: true, name: true } } },
  });

  await eventBus.emit(Events.DEAL_PARTICIPANT_ADDED, {
    dealId: params.id,
    nodeId,
    userId: body?.userId ?? undefined,
    role,
  }, { actorId: auth.session.user?.id });

  return apiCreated(participant);
}
