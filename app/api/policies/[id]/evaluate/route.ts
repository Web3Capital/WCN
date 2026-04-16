import "@/lib/core/init";
import { requireAdmin } from "@/lib/admin";
import { apiOk, apiUnauthorized } from "@/lib/core/api-response";
import { evaluatePolicy } from "@/lib/modules/policy";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin.ok) return apiUnauthorized();

  const { id } = await params;
  const body = await req.json();
  const { entityType, entityId, entity } = body;

  if (!entityType || !entityId || !entity) {
    return apiOk({ error: "entityType, entityId, and entity are required" });
  }

  const result = await evaluatePolicy(id, entityType, entityId, entity);
  return apiOk(result);
}
