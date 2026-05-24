import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { isAdminRole } from "@/lib/permissions";
import { AuditAction, writeAudit } from "@/lib/audit";
import { HttpError, route } from "@/lib/core/api/route";
import { createRiskFlagSchema } from "@/lib/core/validation";
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";
import { z } from "zod";

const riskQuerySchema = z.object({
  severity: z.string().optional(),
  resolved: z.string().optional(),
});

export const GET = route.session({
  input: riskQuerySchema,
  rateLimit: "auth",
  handler: async ({ input, session }) => {
    const isAdmin = isAdminRole(session.user.role ?? "USER");
    if (!isAdmin) throw new HttpError(403, "FORBIDDEN", "Admin only.");

    const prisma = getPrisma();
    const { severity, resolved } = input;

    const where: Prisma.RiskFlagWhereInput = {};
    if (severity) where.severity = severity;
    if (resolved === "true") where.resolvedAt = { not: null };
    if (resolved === "false") where.resolvedAt = null;

    const flags = await prisma.riskFlag.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return flags;
  },
});

export const POST = route.permission({
  input: createRiskFlagSchema,
  rateLimit: "write",
  permission: { action: "create", resource: "risk" },
  successStatus: 201,
  handler: async ({ input, session }) => {
    const prisma = getPrisma();
    const { entityType, entityId, severity, reason } = input;

    const flag = await prisma.riskFlag.create({
      data: { entityType, entityId, severity, reason, raisedById: session.user.id ?? null },
    });

    await writeAudit({
      actorUserId: session.user.id ?? null,
      action: AuditAction.RISK_FLAG_CREATE,
      targetType: entityType,
      targetId: entityId,
      metadata: { severity, reason, riskFlagId: flag.id },
    });

    await eventBus.emit(Events.RISK_ALERT_CREATED, {
      alertId: flag.id,
      entityType,
      entityId,
      severity,
    }, { actorId: session.user.id });

    return flag;
  },
});
