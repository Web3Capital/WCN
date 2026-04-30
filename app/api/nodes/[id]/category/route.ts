import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";
import { apiOk, apiUnauthorized, apiNotFound, zodToApiError } from "@/lib/core/api-response";
import { parseBody, updateNodeCategorySchema } from "@/lib/core/validation";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission("manage", "node");
  if (!auth.ok) return apiUnauthorized();

  const { id } = await params;
  const body = await req.json();
  const parsed = parseBody(updateNodeCategorySchema, body);
  if (!parsed.ok) return zodToApiError(parsed.error);

  const prisma = getPrisma();
  const node = await prisma.node.findUnique({ where: { id }, select: { id: true, category: true } });
  if (!node) return apiNotFound("Node");

  const updated = await prisma.node.update({
    where: { id },
    data: { category: parsed.data.category as any, version: { increment: 1 } },
  });

  await writeAudit({
    actorUserId: auth.session.user?.id ?? "system",
    action: AuditAction.NODE_UPDATE,
    targetType: "NODE",
    targetId: id,
    metadata: { field: "category", oldValue: node.category, newValue: parsed.data.category },
  });

  return apiOk({ id, category: updated.category });
}
