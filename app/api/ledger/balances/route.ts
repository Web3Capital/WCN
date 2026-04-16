import "@/lib/core/init";
import { requireSignedIn } from "@/lib/admin";
import { apiOk, apiUnauthorized } from "@/lib/core/api-response";
import { getBalances } from "@/lib/modules/ledger";

export async function GET(req: Request) {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const { searchParams } = new URL(req.url);
  const nodeId = searchParams.get("nodeId");

  if (!nodeId) {
    return apiOk({ error: "nodeId is required" });
  }

  const balances = await getBalances(nodeId);
  return apiOk(balances);
}
