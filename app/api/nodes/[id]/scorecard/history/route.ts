import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requireSignedIn } from "@/lib/admin";
import { isAdminRole } from "@/lib/permissions";
import { apiOk, apiUnauthorized, apiForbidden, apiNotFound } from "@/lib/core/api-response";
import { getScorecardHistory } from "@/lib/modules/nodes/scorecard";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const isAdmin = isAdminRole(auth.session.user?.role ?? "USER");

  // Check node exists and verify ownership or admin
  const node = await prisma.node.findUnique({
    where: { id: params.id },
    select: { id: true, ownerUserId: true },
  });

  if (!node) return apiNotFound("Node");

  // Only node owner or admin can access scorecard history
  if (!isAdmin && node.ownerUserId !== auth.session.user?.id) {
    return apiForbidden();
  }

  // Get scorecard history with optional limit from query params
  const url = new URL(_req.url);
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Math.min(Math.max(1, parseInt(limitParam, 10)), 100) : 12;

  const history = await getScorecardHistory(params.id, limit);

  return apiOk(history);
}
