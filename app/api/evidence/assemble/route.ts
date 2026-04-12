import "@/lib/core/init";
import { requireSignedIn } from "@/lib/admin";
import { getPrisma } from "@/lib/prisma";
import { apiOk, apiUnauthorized, apiValidationError, apiNotFound, apiForbidden } from "@/lib/core/api-response";
import { assembleEvidencePacket, checkCompleteness } from "@/lib/modules/evidence/assembly";

async function assertDealAccess(dealId: string, userId: string): Promise<boolean> {
  const prisma = getPrisma();
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: { leadNodeId: true },
  });
  if (!deal) return false;

  const ownsLeadNode = await prisma.node.findFirst({
    where: { id: deal.leadNodeId, ownerUserId: userId },
    select: { id: true },
  });
  if (ownsLeadNode) return true;

  const isParticipant = await prisma.dealParticipant.findFirst({
    where: { dealId, userId },
    select: { id: true },
  });
  return !!isParticipant;
}

export async function POST(req: Request) {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const body = await req.json().catch(() => ({}));
  const dealId = String(body?.dealId ?? "").trim();
  if (!dealId) {
    return apiValidationError([{ path: "dealId", message: "dealId is required" }]);
  }

  const hasAccess = await assertDealAccess(dealId, auth.session.user!.id);
  if (!hasAccess) return apiForbidden("No access to this deal");

  try {
    const result = await assembleEvidencePacket(dealId, body?.projectId);
    return apiOk(result);
  } catch (e: any) {
    return apiNotFound("Deal");
  }
}

export async function GET(req: Request) {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const url = new URL(req.url);
  const dealId = url.searchParams.get("dealId");
  if (!dealId) {
    return apiValidationError([{ path: "dealId", message: "dealId query param required" }]);
  }

  const hasAccess = await assertDealAccess(dealId, auth.session.user!.id);
  if (!hasAccess) return apiForbidden("No access to this deal");

  const result = await checkCompleteness(dealId);
  return apiOk(result);
}
