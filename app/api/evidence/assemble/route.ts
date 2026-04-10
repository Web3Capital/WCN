import "@/lib/core/init";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { apiOk, apiUnauthorized, apiValidationError, apiNotFound } from "@/lib/core/api-response";
import { assembleEvidencePacket, checkCompleteness } from "@/lib/modules/evidence/assembly";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return apiUnauthorized();

  const body = await req.json().catch(() => ({}));
  const dealId = String(body?.dealId ?? "").trim();
  if (!dealId) {
    return apiValidationError([{ path: "dealId", message: "dealId is required" }]);
  }

  try {
    const result = await assembleEvidencePacket(dealId, body?.projectId);
    return apiOk(result);
  } catch (e: any) {
    return apiNotFound("Deal");
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return apiUnauthorized();

  const url = new URL(req.url);
  const dealId = url.searchParams.get("dealId");
  if (!dealId) {
    return apiValidationError([{ path: "dealId", message: "dealId query param required" }]);
  }

  const result = await checkCompleteness(dealId);
  return apiOk(result);
}
