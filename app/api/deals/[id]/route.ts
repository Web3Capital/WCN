import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requireSignedIn, requirePermission } from "@/lib/admin";
import { isAdminRole } from "@/lib/permissions";
import { apiOk, apiUnauthorized, apiNotFound, apiConflict, zodToApiError } from "@/lib/core/api-response";
import { TransitionError } from "@/lib/core/state-machine";
import { parseBody, updateDealSchema } from "@/lib/core/validation";
import { getDeal, updateDeal } from "@/lib/modules/deals/service";
import { getOwnedNodeIds } from "@/lib/member-data-scope";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const deal = await getDeal(params.id);
  if (!deal) return apiNotFound("Deal");

  const isAdmin = isAdminRole(auth.session.user?.role ?? "USER");
  if (!isAdmin) {
    const prisma = getPrisma();
    const userId = auth.session.user!.id;
    const ownedNodeIds = await getOwnedNodeIds(prisma, userId);
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
    if (!hasAccess) return apiUnauthorized();
  }

  return apiOk(deal);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requirePermission("update", "deal");
  if (!auth.ok) return apiUnauthorized();

  const isAdminUser = isAdminRole(auth.session.user?.role ?? "USER");
  if (!isAdminUser) {
    const prisma = getPrisma();
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
    if (!hasAccess) return apiUnauthorized();
  }

  const body = await req.json().catch(() => ({}));
  const parsed = parseBody(updateDealSchema, body);
  if (!parsed.ok) return zodToApiError(parsed.error);

  try {
    const deal = await updateDeal(params.id, parsed.data, auth.session.user!.id);
    if (!deal) return apiNotFound("Deal");
    return apiOk(deal);
  } catch (err) {
    if (err instanceof TransitionError) {
      return apiConflict(err.message, {
        code: err.code,
        from: err.from,
        to: err.to,
        validTransitions: err.validTransitions,
      });
    }
    throw err;
  }
}
