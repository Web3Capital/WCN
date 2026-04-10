import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { apiOk, apiUnauthorized, apiValidationError } from "@/lib/core/api-response";
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

export async function GET() {
  const auth = await requirePermission("read", "risk");
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const rules = await prisma.riskRule.findMany({ orderBy: { createdAt: "desc" } });
  return apiOk(rules);
}

export async function POST(req: Request) {
  const auth = await requirePermission("manage", "risk");
  if (!auth.ok) return apiUnauthorized();

  const body = await req.json().catch(() => ({}));
  const parsed = ruleSchema.safeParse(body);
  if (!parsed.success) {
    return apiValidationError(parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })));
  }

  const prisma = getPrisma();
  const rule = await prisma.riskRule.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      entityType: parsed.data.entityType,
      conditions: parsed.data.conditions as any,
      severity: parsed.data.severity ?? "MEDIUM",
      action: parsed.data.action ?? "CREATE_FLAG",
      enabled: parsed.data.enabled ?? true,
    },
  });

  return apiOk(rule);
}
