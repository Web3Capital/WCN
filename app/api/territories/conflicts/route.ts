import "@/lib/core/init";
import { requireAdmin } from "@/lib/admin";
import {
  apiOk,
  apiUnauthorized,
  apiValidationError,
} from "@/lib/core/api-response";
import { getTerritoryConflicts } from "@/lib/modules/nodes/territory";

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return apiUnauthorized();

  const { searchParams } = new URL(req.url);
  const region = searchParams.get("region");
  const scope = searchParams.get("scope");

  if (!region || !scope) {
    return apiValidationError([
      { path: "query", message: "region and scope query parameters are required" },
    ]);
  }

  const conflicts = await getTerritoryConflicts(region, scope);
  return apiOk(conflicts);
}
