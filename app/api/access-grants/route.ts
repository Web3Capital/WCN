import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";
import { apiOk, apiCreated, apiUnauthorized, zodToApiError } from "@/lib/core/api-response";
import { parseBody, createAccessGrantSchema } from "@/lib/core/validation";

export async function GET(req: Request) {
  const auth = await requirePermission("read", "file");
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const url = new URL(req.url);
  const entityType = url.searchParams.get("entityType");
  const entityId = url.searchParams.get("entityId");
  const workspaceId = url.searchParams.get("workspaceId");

  const where: Record<string, unknown> = {};
  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = entityId;
  if (workspaceId) where.workspaceId = workspaceId;

  const grants = await prisma.accessGrant.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return apiOk(grants);
}

export async function POST(req: Request) {
  const auth = await requirePermission("create", "file");
  if (!auth.ok) return apiUnauthorized();

  const body = await req.json().catch(() => ({}));
  const parsed = parseBody(createAccessGrantSchema, body);
  if (!parsed.ok) return zodToApiError(parsed.error);

  const prisma = getPrisma();
  const { workspaceId, entityType, entityId, grantedToType, grantedToId, grantType, scope, expiresAt } = parsed.data;

  const grant = await prisma.accessGrant.create({
    data: {
      workspaceId,
      entityType,
      entityId,
      grantedToType: grantedToType as any,
      grantedToId,
      grantType: grantType as any,
      scope: scope as any,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      grantedById: auth.session.user!.id,
    },
  });

  await writeAudit({
    actorUserId: auth.session.user!.id,
    action: AuditAction.ACCESS_GRANT_CREATE,
    targetType: "ACCESS_GRANT",
    targetId: grant.id,
    workspaceId,
    metadata: { entityType, entityId, grantedToType, grantedToId, grantType },
  });

  return apiCreated(grant);
}
