import type { PrismaClient } from "@prisma/client";

export type RuleCondition = {
  field: string;
  operator: "eq" | "neq" | "gt" | "lt" | "gte" | "lte" | "contains" | "in";
  threshold: string | number | string[];
};

export type RuleAction = "CREATE_FLAG" | "FREEZE_ENTITY" | "NOTIFY_RISK_DESK";

export type RuleDefinition = {
  id: string;
  name: string;
  entityType: string;
  conditions: RuleCondition[];
  severity: string;
  action: RuleAction;
  enabled: boolean;
};

function evaluateCondition(value: unknown, condition: RuleCondition): boolean {
  const v = value as any;
  const t = condition.threshold;

  switch (condition.operator) {
    case "eq": return v === t;
    case "neq": return v !== t;
    case "gt": return typeof v === "number" && v > (t as number);
    case "lt": return typeof v === "number" && v < (t as number);
    case "gte": return typeof v === "number" && v >= (t as number);
    case "lte": return typeof v === "number" && v <= (t as number);
    case "contains": return typeof v === "string" && v.includes(t as string);
    case "in": return Array.isArray(t) && t.includes(v);
    default: return false;
  }
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce((acc: any, key) => acc?.[key], obj);
}

export function evaluateRules(
  entity: Record<string, unknown>,
  rules: RuleDefinition[],
): RuleDefinition[] {
  return rules.filter((rule) => {
    if (!rule.enabled) return false;
    return rule.conditions.every((cond) => {
      const value = getNestedValue(entity, cond.field);
      return evaluateCondition(value, cond);
    });
  });
}

export async function loadRulesForEntity(
  prisma: PrismaClient,
  entityType: string,
): Promise<RuleDefinition[]> {
  const rules = await prisma.riskRule.findMany({
    where: { entityType, enabled: true },
  });

  return rules.map((r) => ({
    id: r.id,
    name: r.name,
    entityType: r.entityType,
    conditions: r.conditions as RuleCondition[],
    severity: r.severity,
    action: r.action as RuleAction,
    enabled: r.enabled,
  }));
}

export async function autoEvaluateEntity(
  prisma: PrismaClient,
  entityType: string,
  entityId: string,
  entityData: Record<string, unknown>,
): Promise<{ triggered: number; flags: string[] }> {
  const rules = await loadRulesForEntity(prisma, entityType);
  const triggered = evaluateRules(entityData, rules);
  const flagIds: string[] = [];

  for (const rule of triggered) {
    if (rule.action === "CREATE_FLAG") {
      const flag = await prisma.riskFlag.create({
        data: {
          entityType,
          entityId,
          severity: rule.severity as any,
          reason: `Auto-flagged by rule: ${rule.name}`,
        },
      });
      flagIds.push(flag.id);
    }
  }

  return { triggered: triggered.length, flags: flagIds };
}
