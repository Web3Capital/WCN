import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin, requireSignedIn } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";
import { isAdminRole } from "@/lib/permissions";
import {
  apiOk,
  apiCreated,
  apiUnauthorized,
  apiForbidden,
  apiBusinessError,
} from "@/lib/core/api-response";
import {
  claimTerritory,
  getNodeTerritories,
} from "@/lib/modules/nodes/territory";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const isAdmin = isAdminRole(auth.session.user?.role ?? "USER");

  if (!isAdmin) {
    const node = await prisma.node.findUnique({
      where: { id: params.id },
      select: { ownerUserId: true },
    });
    if (node?.ownerUserId !== auth.session.user!.id) return apiForbidden();
  }

  const territories = await getNodeTerritories(params.id);
  return apiOk(territories);
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin.ok) return apiUnauthorized();

  const body = await req.json().catch(() => ({}));

  try {
    const territory = await claimTerritory({
      nodeId: params.id,
      region: body.region,
      scope: body.scope,
      exclusivity: body.exclusivity,
      protectedAccounts: body.protectedAccounts,
      kpiTarget: body.kpiTarget,
      notes: body.notes,
    });

    await writeAudit({
      actorUserId: admin.session.user?.id ?? null,
      action: AuditAction.TERRITORY_CLAIM,
      targetType: "TERRITORY",
      targetId: territory.id,
      metadata: {
        nodeId: params.id,
        region: territory.region,
        scope: territory.scope,
        exclusivity: territory.exclusivity,
      },
    });

    return apiCreated(territory);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return apiBusinessError("TERRITORY_CLAIM_ERROR", message);
  }
}
