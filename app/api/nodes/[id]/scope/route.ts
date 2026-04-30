import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";
import { apiOk, apiUnauthorized, apiNotFound, zodToApiError } from "@/lib/core/api-response";
import { parseBody, updateNodeScopeSchema } from "@/lib/core/validation";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission("manage", "node");
  if (!auth.ok) return apiUnauthorized();

  const { id } = await params;
  const body = await req.json();
  const parsed = parseBody(updateNodeScopeSchema, body);
  if (!parsed.ok) return zodToApiError(parsed.error);

  const prisma = getPrisma();
  const node = await prisma.node.findUnique({ where: { id }, select: { id: true, scope: true } });
  if (!node) return apiNotFound("Node");

  const updated = await prisma.node.update({
    where: { id },
    data: { scope: parsed.data.scope as any, version: { increment: 1 } },
  });

  await writeAudit({
    actorUserId: auth.session.user?.id ?? "system",
    action: AuditAction.NODE_UPDATE,
    targetType: "NODE",
    targetId: id,
    metadata: { field: "scope", oldValue: node.scope, newValue: parsed.data.scope },
  });

  return apiOk({ id, scope: updated.scope });
}
