import "@/lib/core/init";
import { requireSignedIn, requirePermission } from "@/lib/admin";
import { apiOk, apiUnauthorized, apiNotFound, apiConflict, zodToApiError } from "@/lib/core/api-response";
import { TransitionError } from "@/lib/core/state-machine";
import { parseBody, updateDealSchema } from "@/lib/core/validation";
import { getDeal, updateDeal } from "@/lib/modules/deals/service";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const deal = await getDeal(params.id);
  if (!deal) return apiNotFound("Deal");

  return apiOk(deal);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requirePermission("update", "deal");
  if (!auth.ok) return apiUnauthorized();

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
