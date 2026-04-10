import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";
import { apiOk, apiUnauthorized, apiNotFound } from "@/lib/core/api-response";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requirePermission("delete", "file");
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const grant = await prisma.accessGrant.findUnique({ where: { id } });
  if (!grant) return apiNotFound("AccessGrant");

  await prisma.accessGrant.delete({ where: { id } });

  await writeAudit({
    actorUserId: auth.session.user!.id,
    action: AuditAction.ACCESS_GRANT_REVOKE,
    targetType: "ACCESS_GRANT",
    targetId: id,
    workspaceId: grant.workspaceId,
  });

  return apiOk({ deleted: true });
}
