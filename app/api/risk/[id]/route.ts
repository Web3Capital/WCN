import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import type { FreezeLevel, Prisma } from "@prisma/client";
import { AuditAction, writeAudit } from "@/lib/audit";
import { HttpError, route } from "@/lib/core/api/route";
import { updateRiskFlagSchema } from "@/lib/core/validation";
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";
import { z } from "zod";

const updateRiskFlagInputSchema = z.object(updateRiskFlagSchema.shape);

export const PATCH = route.permission<z.infer<typeof updateRiskFlagInputSchema>, unknown, { id: string }>({
  input: updateRiskFlagInputSchema,
  rateLimit: "write",
  permission: { action: "update", resource: "risk" },
  handler: async ({ input, params, session }) => {
    const { id } = params;
    const prisma = getPrisma();
    const existing = await prisma.riskFlag.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "NOT_FOUND", "RiskFlag not found.");

    const data: Prisma.RiskFlagUpdateInput = {};
    if (input.resolution !== undefined) data.resolution = input.resolution;
    if (input.resolve === true) {
      data.resolvedAt = new Date();
      data.resolution = input.resolution ?? "Resolved";
    }
    if (input.severity !== undefined) data.severity = input.severity;

    const flag = await prisma.riskFlag.update({ where: { id }, data });

    if (input.freeze === true) {
      const freezeLevel = (input.freezeLevel ?? "SOFT") as FreezeLevel;
      await prisma.entityFreeze.create({
        data: {
          workspaceId: existing.workspaceId ?? "",
          entityType: existing.entityType,
          entityId: existing.entityId,
          freezeLevel,
          reason: `Risk flag #${id}: ${existing.reason}`,
          frozenById: session.user.id,
        },
      });

      await writeAudit({
        actorUserId: session.user.id ?? null,
        action: AuditAction.ENTITY_FREEZE,
        targetType: existing.entityType,
        targetId: existing.entityId,
        metadata: { riskFlagId: id, freezeLevel },
      });

      await eventBus.emit(Events.ENTITY_FROZEN, {
        entityType: existing.entityType,
        entityId: existing.entityId,
        frozenBy: session.user.id,
        reason: `Risk flag #${id}: ${existing.reason}`,
      }, { actorId: session.user.id });
    }

    if (data.resolvedAt) {
      await writeAudit({
        actorUserId: session.user.id ?? null,
        action: AuditAction.RISK_FLAG_RESOLVE,
        targetType: existing.entityType,
        targetId: existing.entityId,
        metadata: { riskFlagId: id, resolution: data.resolution },
      });
    }

    return flag;
  },
});
