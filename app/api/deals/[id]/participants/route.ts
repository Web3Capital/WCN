import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { apiCreated, apiUnauthorized, zodToApiError } from "@/lib/core/api-response";
import { parseBody, addDealParticipantSchema } from "@/lib/core/validation";
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requirePermission("update", "deal");
  if (!auth.ok) return apiUnauthorized();

  const body = await req.json().catch(() => ({}));
  const parsed = parseBody(addDealParticipantSchema, body);
  if (!parsed.ok) return zodToApiError(parsed.error);

  const prisma = getPrisma();
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
