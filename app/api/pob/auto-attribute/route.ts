import "@/lib/core/init";
import { requireAdmin } from "@/lib/admin";
import { apiOk, apiUnauthorized, apiValidationError, apiNotFound } from "@/lib/core/api-response";
import { calculateAttribution, getAttributionBreakdown } from "@/lib/modules/pob/attribution";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return apiUnauthorized();

  const body = await req.json().catch(() => ({}));
  const dealId = String(body?.dealId ?? "").trim();
  if (!dealId) {
    return apiValidationError([{ path: "dealId", message: "dealId is required" }]);
  }

  const result = await calculateAttribution(dealId);
  if (!result) return apiNotFound("Deal");

  return apiOk(result);
}

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return apiUnauthorized();

  const url = new URL(req.url);
  const pobId = url.searchParams.get("pobId");
  if (!pobId) {
    return apiValidationError([{ path: "pobId", message: "pobId query param required" }]);
  }

  const breakdown = await getAttributionBreakdown(pobId);
  return apiOk(breakdown);
}
