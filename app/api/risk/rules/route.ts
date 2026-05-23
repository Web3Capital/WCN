import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { AuditAction, writeAudit } from "@/lib/audit";
import { route } from "@/lib/core/api/route";
import type { Prisma } from "@prisma/client";
import { z } from "zod";

const ruleSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  entityType: z.string().min(1),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.enum(["eq", "neq", "gt", "lt", "gte", "lte", "contains", "in"]),
    threshold: z.union([z.string(), z.number(), z.array(z.string())]),
  })),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  action: z.enum(["CREATE_FLAG", "FREEZE_ENTITY", "NOTIFY_RISK_DESK"]).optional(),
  enabled: z.boolean().optional(),
});

export const GET = route.permission({
  input: z.object({}),
  rateLimit: "auth",
  permission: { action: "read", resource: "risk" },
  handler: async () => {
    const prisma = getPrisma();
    return prisma.riskRule.findMany({ orderBy: { createdAt: "desc" } });
  },
});

export const POST = route.permission({
  input: ruleSchema,
  rateLimit: "write",
  permission: { action: "manage", resource: "risk" },
  handler: async ({ input, session }) => {
    const prisma = getPrisma();
    const rule = await prisma.riskRule.create({
      data: {
        name: input.name,
        description: input.description,
        entityType: input.entityType,
        conditions: input.conditions as Prisma.InputJsonValue,
        severity: input.severity ?? "MEDIUM",
        action: input.action ?? "CREATE_FLAG",
        enabled: input.enabled ?? true,
      },
    });

    await writeAudit({
      actorUserId: session.user.id,
      action: AuditAction.RISK_RULE_CREATE,
      targetType: "RISK_RULE",
      targetId: rule.id,
      metadata: { name: rule.name, entityType: rule.entityType, severity: rule.severity, action: rule.action },
    });

    return rule;
  },
});
