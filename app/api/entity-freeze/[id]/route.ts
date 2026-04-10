import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";
import { apiOk, apiUnauthorized, apiNotFound, apiValidationError } from "@/lib/core/api-response";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requirePermission("freeze", "risk");
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const freeze = await prisma.entityFreeze.findUnique({ where: { id } });
  if (!freeze) return apiNotFound("EntityFreeze");
  if (freeze.liftedAt) return apiValidationError([{ path: "id", message: "Already lifted." }]);

  const updated = await prisma.entityFreeze.update({
    where: { id },
    data: {
      liftedAt: new Date(),
      liftedById: auth.session.user!.id,
    },
  });

  await writeAudit({
    actorUserId: auth.session.user!.id,
    action: AuditAction.ENTITY_UNFREEZE,
    targetType: freeze.entityType,
    targetId: freeze.entityId,
    workspaceId: freeze.workspaceId,
    metadata: { freezeId: id, reason: body?.reason },
  });

  return apiOk(updated);
}
