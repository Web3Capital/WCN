import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";
import { apiOk, apiCreated, apiUnauthorized, zodToApiError } from "@/lib/core/api-response";
import { parseBody, createEntityFreezeSchema } from "@/lib/core/validation";
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";

export async function GET(req: Request) {
  const auth = await requirePermission("read", "risk");
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const url = new URL(req.url);
  const entityType = url.searchParams.get("entityType");
  const entityId = url.searchParams.get("entityId");
  const active = url.searchParams.get("active");

  const where: Record<string, unknown> = {};
  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = entityId;
  if (active === "true") where.liftedAt = null;

  const freezes = await prisma.entityFreeze.findMany({
    where,
    orderBy: { frozenAt: "desc" },
    take: 200,
  });

  return apiOk(freezes);
}

export async function POST(req: Request) {
  const auth = await requirePermission("freeze", "risk");
  if (!auth.ok) return apiUnauthorized();

  const body = await req.json().catch(() => ({}));
  const parsed = parseBody(createEntityFreezeSchema, body);
  if (!parsed.ok) return zodToApiError(parsed.error);

  const prisma = getPrisma();
  const { workspaceId, entityType, entityId, freezeLevel, reason, expiresAt } = parsed.data;

  const freeze = await prisma.entityFreeze.create({
    data: {
      workspaceId,
      entityType,
      entityId,
      freezeLevel,
      reason,
      frozenById: auth.session.user!.id,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  });

  await writeAudit({
    actorUserId: auth.session.user!.id,
    action: AuditAction.ENTITY_FREEZE,
    targetType: entityType,
    targetId: entityId,
    workspaceId,
    metadata: { freezeId: freeze.id, freezeLevel, reason },
  });

  await eventBus.emit(Events.ENTITY_FROZEN, {
    entityType,
    entityId,
    frozenBy: auth.session.user!.id,
    reason,
  }, { actorId: auth.session.user?.id });

  return apiCreated(freeze);
}
