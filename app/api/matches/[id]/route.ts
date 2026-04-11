import "@/lib/core/init";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import {
  apiOk,
  apiUnauthorized,
  apiNotFound,
  apiBusinessError,
  zodToApiError,
} from "@/lib/core/api-response";
import { matchActionSchema, parseBody } from "@/lib/core/validation";
import { getMatch, expressInterest, declineMatch, convertMatchToDeal } from "@/lib/modules/matching/engine";
import { getOwnedNodeIds } from "@/lib/member-data-scope";

async function assertMatchAccess(userId: string, role: string, matchId: string): Promise<boolean> {
  if (isAdminRole(role)) return true;
  const prisma = getPrisma();
  const ownedNodeIds = await getOwnedNodeIds(prisma, userId);
  const match = await prisma.match.findFirst({
    where: {
      id: matchId,
      OR: [
        { capitalNodeId: { in: ownedNodeIds } },
        { project: { node: { id: { in: ownedNodeIds } } } },
      ],
    },
    select: { id: true },
  });
  return !!match;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return apiUnauthorized();

  const { id } = await params;

  const hasAccess = await assertMatchAccess(session.user.id, session.user.role ?? "USER", id);
  if (!hasAccess) return apiUnauthorized();

  const match = await getMatch(id);
  if (!match) return apiNotFound("Match");

  return apiOk(match);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return apiUnauthorized();

  const { id } = await params;

  const hasAccess = await assertMatchAccess(session.user.id, session.user.role ?? "USER", id);
  if (!hasAccess) return apiUnauthorized();

  const body = await req.json().catch(() => ({}));
  const parsed = parseBody(matchActionSchema, body);
  if (!parsed.ok) return zodToApiError(parsed.error);

  const { action, dealId } = parsed.data;
  let result;

  switch (action) {
    case "interest":
      result = await expressInterest(id, session.user.id);
      break;
    case "decline":
      result = await declineMatch(id, session.user.id);
      break;
    case "convert":
      result = await convertMatchToDeal(id, dealId!, session.user.id);
      break;
  }

  if (!result) {
    return apiBusinessError("INVALID_TRANSITION", "Cannot perform this action on the match in its current state.");
  }

  return apiOk(result);
}
