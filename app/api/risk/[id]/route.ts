import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";
import { apiOk, apiUnauthorized, apiNotFound, zodToApiError } from "@/lib/core/api-response";
import { parseBody, updateRiskFlagSchema } from "@/lib/core/validation";
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requirePermission("update", "risk");
  if (!auth.ok) return apiUnauthorized();

  const body = await req.json().catch(() => ({}));
  const parsed = parseBody(updateRiskFlagSchema, body);
  if (!parsed.ok) return zodToApiError(parsed.error);

  const prisma = getPrisma();
  const existing = await prisma.riskFlag.findUnique({ where: { id } });
  if (!existing) return apiNotFound("RiskFlag");

  const data: Record<string, unknown> = {};
  if (parsed.data.resolution !== undefined) data.resolution = parsed.data.resolution;
  if (parsed.data.resolve === true) {
    data.resolvedAt = new Date();
    data.resolution = parsed.data.resolution ?? "Resolved";
  }
  if (parsed.data.severity !== undefined) data.severity = parsed.data.severity;

  const flag = await prisma.riskFlag.update({ where: { id }, data });

  if (parsed.data.freeze === true) {
    await prisma.entityFreeze.create({
      data: {
        workspaceId: existing.workspaceId ?? "",
        entityType: existing.entityType,
        entityId: existing.entityId,
        freezeLevel: parsed.data.freezeLevel ?? "SOFT",
        reason: `Risk flag #${id}: ${existing.reason}`,
        frozenById: auth.session.user!.id,
      },
    });

    await writeAudit({
      actorUserId: auth.session.user?.id ?? null,
      action: AuditAction.ENTITY_FREEZE,
      targetType: existing.entityType,
      targetId: existing.entityId,
      metadata: { riskFlagId: id, freezeLevel: parsed.data.freezeLevel ?? "SOFT" },
    });

    await eventBus.emit(Events.ENTITY_FROZEN, {
      entityType: existing.entityType,
      entityId: existing.entityId,
      frozenBy: auth.session.user!.id,
      reason: `Risk flag #${id}: ${existing.reason}`,
    }, { actorId: auth.session.user?.id });
  }

  if (data.resolvedAt) {
    await writeAudit({
      actorUserId: auth.session.user?.id ?? null,
      action: AuditAction.RISK_FLAG_RESOLVE,
      targetType: existing.entityType,
      targetId: existing.entityId,
      metadata: { riskFlagId: id, resolution: data.resolution },
    });
  }

  return apiOk(flag);
}
