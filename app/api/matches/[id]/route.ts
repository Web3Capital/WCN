import "@/lib/core/init";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  apiOk,
  apiUnauthorized,
  apiNotFound,
  apiBusinessError,
  zodToApiError,
} from "@/lib/core/api-response";
import { matchActionSchema, parseBody } from "@/lib/core/validation";
import { getMatch, expressInterest, declineMatch, convertMatchToDeal } from "@/lib/modules/matching/engine";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return apiUnauthorized();

  const { id } = await params;
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
