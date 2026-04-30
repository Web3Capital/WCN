import "@/lib/core/init";
import { requirePermission } from "@/lib/admin";
import { isAdminRole } from "@/lib/permissions";
import { ownsPoB } from "@/lib/auth/resource-scope";
import { getPrisma } from "@/lib/prisma";
import { getOwnedNodeIds } from "@/lib/member-data-scope";
import { apiOk, apiUnauthorized, apiValidationError, apiNotFound } from "@/lib/core/api-response";
import { calculateAttribution, getAttributionBreakdown } from "@/lib/modules/pob/attribution";

export async function POST(req: Request) {
  const auth = await requirePermission("update", "pob");
  if (!auth.ok) return apiUnauthorized();

  const body = await req.json().catch(() => ({}));
  const dealId = String(body?.dealId ?? "").trim();
  if (!dealId) {
    return apiValidationError([{ path: "dealId", message: "dealId is required" }]);
  }

  // Row-level: non-admin can only auto-attribute deals where at least one
  // PoB is linked to a node they own.
  const isAdmin = isAdminRole(auth.session.user?.role ?? "USER");
  if (!isAdmin) {
    const prisma = getPrisma();
    const ownedNodeIds = await getOwnedNodeIds(prisma, auth.session.user!.id);
    if (ownedNodeIds.length === 0) return apiUnauthorized();
    const linked = await prisma.poBRecord.findFirst({
      where: { dealId, nodeId: { in: ownedNodeIds } },
      select: { id: true },
    });
    if (!linked) return apiUnauthorized();
  }

  const result = await calculateAttribution(dealId);
  if (!result) return apiNotFound("Deal");

  return apiOk(result);
}

export async function GET(req: Request) {
  const auth = await requirePermission("read", "pob");
  if (!auth.ok) return apiUnauthorized();

  const url = new URL(req.url);
  const pobId = url.searchParams.get("pobId");
  if (!pobId) {
    return apiValidationError([{ path: "pobId", message: "pobId query param required" }]);
  }

  // Row-level: non-admin must own this PoB.
  const isAdmin = isAdminRole(auth.session.user?.role ?? "USER");
  if (!isAdmin && !(await ownsPoB(getPrisma(), auth.session.user!.id, pobId))) {
    return apiUnauthorized();
  }

  const breakdown = await getAttributionBreakdown(pobId);
  return apiOk(breakdown);
}
