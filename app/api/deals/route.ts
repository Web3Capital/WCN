import "@/lib/core/init";
import { requireSignedIn, requirePermission } from "@/lib/admin";
import { isAdminRole } from "@/lib/permissions";
import { apiOk, apiCreated, apiUnauthorized, zodToApiError } from "@/lib/core/api-response";
import { parseBody, createDealSchema } from "@/lib/core/validation";
import { listDeals, createDeal } from "@/lib/modules/deals/service";

export async function GET(req: Request) {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const { searchParams } = new URL(req.url);
  const stage = searchParams.get("stage") ?? undefined;
  const isAdmin = isAdminRole(auth.session.user?.role ?? "USER");

  const deals = await listDeals({
    stage,
    isAdmin,
    userId: auth.session.user!.id,
  });

  return apiOk(deals);
}

export async function POST(req: Request) {
  const auth = await requirePermission("create", "deal");
  if (!auth.ok) return apiUnauthorized();

  const body = await req.json().catch(() => ({}));
  const parsed = parseBody(createDealSchema, body);
  if (!parsed.ok) return zodToApiError(parsed.error);

  const deal = await createDeal(parsed.data, auth.session.user!.id);
  return apiCreated(deal);
}
