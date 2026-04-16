import "@/lib/core/init";
import { requireSignedIn } from "@/lib/admin";
import { apiOk, apiUnauthorized, apiNotFound } from "@/lib/core/api-response";
import { resolveAugmentedNode } from "@/lib/modules/augmented-node";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const { id } = await params;
  const view = await resolveAugmentedNode(id);
  if (!view) return apiNotFound("Node");

  return apiOk(view);
}
