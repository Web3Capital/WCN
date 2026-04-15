import "@/lib/core/init";
import { requireAdmin } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";
import {
  apiOk,
  apiUnauthorized,
  apiNotFound,
  apiBusinessError,
} from "@/lib/core/api-response";
import {
  updateTerritory,
  revokeTerritory,
} from "@/lib/modules/nodes/territory";
import { getPrisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { territoryId: string } }
) {
  const admin = await requireAdmin();
  if (!admin.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  // Verify territory exists
  const existing = await prisma.territory.findUnique({
    where: { id: params.territoryId },
    select: { id: true, nodeId: true },
  });

  if (!existing) return apiNotFound("Territory");

  try {
    const territory = await updateTerritory(params.territoryId, body);

    await writeAudit({
      actorUserId: admin.session.user?.id ?? null,
      action: AuditAction.TERRITORY_UPDATE,
      targetType: "TERRITORY",
      targetId: territory.id,
      metadata: {
        nodeId: territory.nodeId,
        region: territory.region,
        scope: territory.scope,
        changes: body,
      },
    });

    return apiOk(territory);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return apiBusinessError("TERRITORY_UPDATE_ERROR", message);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { territoryId: string } }
) {
  const admin = await requireAdmin();
  if (!admin.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  // Verify territory exists
  const existing = await prisma.territory.findUnique({
    where: { id: params.territoryId },
    select: { id: true, nodeId: true },
  });

  if (!existing) return apiNotFound("Territory");

  const reason = String(body?.reason ?? "").trim();
  if (!reason) {
    return apiBusinessError("TERRITORY_REVOKE_ERROR", "Reason is required");
  }

  try {
    const territory = await revokeTerritory(params.territoryId, reason);

    await writeAudit({
      actorUserId: admin.session.user?.id ?? null,
      action: AuditAction.TERRITORY_REVOKE,
      targetType: "TERRITORY",
      targetId: territory.id,
      metadata: {
        nodeId: territory.nodeId,
        region: territory.region,
        scope: territory.scope,
        reason,
      },
    });

    return apiOk(territory);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return apiBusinessError("TERRITORY_REVOKE_ERROR", message);
  }
}
