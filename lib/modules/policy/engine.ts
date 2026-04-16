/**
 * @wcn/policy — Policy Evaluation Engine
 *
 * White Paper §13: Governance Layer
 * Generalized policy engine with condition evaluation, action dispatch,
 * and audit trail. Evolved from the risk/rule-engine.ts pattern.
 *
 * White Paper Appendix D built-in policies:
 * 1. NO_SELF_VALIDATION — proof.actor_ref != validator.id
 * 2. HIGH_VALUE_SETTLEMENT_APPROVAL — settlement.net_value > threshold
 * 3. AGENT_TOOL_BOUNDARY — agent tool in whitelist
 * 4. CONFLICT_OF_INTEREST — reviewer not in deal.participants
 * 5. REWARD_ELIGIBILITY — proof.state == verified
 */

import { getPrisma } from "@/lib/prisma";
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";
import { PolicyMachine } from "@/lib/core/state-machine";
import type { PolicyCondition, PolicyAction } from "./ports";
import type { PolicyStatus } from "@prisma/client";

// ─── Condition Evaluation ──────────────────────────────────────

function resolveField(entity: Record<string, unknown>, field: string): unknown {
  const parts = field.split(".");
  let current: unknown = entity;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function evaluateCondition(entity: Record<string, unknown>, condition: PolicyCondition): boolean {
  const value = resolveField(entity, condition.field);
  const threshold = condition.threshold;

  switch (condition.operator) {
    case "eq": return value === threshold;
    case "neq": return value !== threshold;
    case "gt": return typeof value === "number" && typeof threshold === "number" && value > threshold;
    case "lt": return typeof value === "number" && typeof threshold === "number" && value < threshold;
    case "gte": return typeof value === "number" && typeof threshold === "number" && value >= threshold;
    case "lte": return typeof value === "number" && typeof threshold === "number" && value <= threshold;
    case "contains":
      if (typeof value === "string" && typeof threshold === "string") return value.includes(threshold);
      if (Array.isArray(value)) return value.includes(threshold);
      return false;
    case "in":
      return Array.isArray(threshold) && threshold.includes(String(value));
    default:
      return false;
  }
}

// ─── Core Functions ────────────────────────────────────────────

export async function createPolicy(data: {
  workspaceId?: string;
  name: string;
  description?: string;
  scope: string;
  scopeRef?: string;
  conditions: PolicyCondition[];
  actions: PolicyAction[];
  approvers?: string[];
  rollbackLogic?: Record<string, unknown>;
  priority?: number;
  createdBy?: string;
}) {
  const prisma = getPrisma();

  const policy = await prisma.policy.create({
    data: {
      workspaceId: data.workspaceId ?? null,
      name: data.name,
      description: data.description ?? null,
      scope: data.scope as any,
      scopeRef: data.scopeRef ?? null,
      conditions: data.conditions as unknown as any,
      actions: data.actions as unknown as any,
      approvers: data.approvers ?? [],
      rollbackLogic: (data.rollbackLogic ?? undefined) as any,
      priority: data.priority ?? 0,
      createdBy: data.createdBy ?? null,
      status: "DRAFT",
    },
  });

  await eventBus.emit(Events.POLICY_CREATED, {
    policyId: policy.id,
    scope: policy.scope,
    name: policy.name,
    createdBy: data.createdBy ?? "system",
  });

  return policy;
}

export async function activatePolicy(policyId: string, changedBy: string) {
  const prisma = getPrisma();
  const policy = await prisma.policy.findUnique({ where: { id: policyId } });
  if (!policy) throw new Error(`Policy ${policyId} not found`);

  await PolicyMachine.transition(policyId, policy.status as PolicyStatus, "ACTIVE", { actorId: changedBy });

  await prisma.policy.update({
    where: { id: policyId },
    data: { status: "ACTIVE", activatedAt: new Date(), version: { increment: 1 } },
  });

  await eventBus.emit(Events.POLICY_STATUS_CHANGED, {
    policyId,
    oldStatus: policy.status,
    newStatus: "ACTIVE",
    changedBy,
  });
}

export async function suspendPolicy(policyId: string, changedBy: string) {
  const prisma = getPrisma();
  const policy = await prisma.policy.findUnique({ where: { id: policyId } });
  if (!policy) throw new Error(`Policy ${policyId} not found`);

  await PolicyMachine.transition(policyId, policy.status as PolicyStatus, "SUSPENDED", { actorId: changedBy });

  await prisma.policy.update({
    where: { id: policyId },
    data: { status: "SUSPENDED", version: { increment: 1 } },
  });
}

export async function retirePolicy(policyId: string, changedBy: string) {
  const prisma = getPrisma();
  const policy = await prisma.policy.findUnique({ where: { id: policyId } });
  if (!policy) throw new Error(`Policy ${policyId} not found`);

  await PolicyMachine.transition(policyId, policy.status as PolicyStatus, "RETIRED", { actorId: changedBy });

  await prisma.policy.update({
    where: { id: policyId },
    data: { status: "RETIRED", retiredAt: new Date(), version: { increment: 1 } },
  });
}

/**
 * Evaluate a single policy against an entity.
 * All conditions must pass (AND logic) for result = "PASS".
 */
export async function evaluatePolicy(
  policyId: string,
  entityType: string,
  entityId: string,
  entity: Record<string, unknown>,
): Promise<{ result: "PASS" | "FAIL" | "WARN"; details: unknown }> {
  const prisma = getPrisma();
  const policy = await prisma.policy.findUnique({ where: { id: policyId } });
  if (!policy || policy.status !== "ACTIVE") {
    return { result: "PASS", details: { reason: "Policy not active" } };
  }

  const conditions = policy.conditions as unknown as PolicyCondition[];
  const failedConditions: PolicyCondition[] = [];

  for (const condition of conditions) {
    if (!evaluateCondition(entity, condition)) {
      failedConditions.push(condition);
    }
  }

  const result = failedConditions.length === 0 ? "PASS" : "FAIL";
  const details = {
    conditionsChecked: conditions.length,
    conditionsFailed: failedConditions.length,
    failedConditions: failedConditions.length > 0 ? failedConditions : undefined,
    actions: result === "FAIL" ? policy.actions : undefined,
  };

  await prisma.policyEvaluation.create({
    data: { policyId, entityType, entityId, result, details: details as any },
  });

  await eventBus.emit(Events.POLICY_EVALUATED, { policyId, entityType, entityId, result });

  return { result, details };
}

/**
 * Evaluate all active policies for a given scope against an entity.
 * Returns aggregated results.
 */
export async function evaluateAllPolicies(
  scope: string,
  entityType: string,
  entityId: string,
  entity: Record<string, unknown>,
  scopeRef?: string,
) {
  const prisma = getPrisma();
  const where: any = { scope: scope as any, status: "ACTIVE" };
  if (scopeRef) where.scopeRef = scopeRef;

  const policies = await prisma.policy.findMany({
    where,
    orderBy: { priority: "desc" },
  });

  const results: Array<{ policyId: string; name: string; result: string; details: unknown }> = [];
  let blocked = false;

  for (const policy of policies) {
    const { result, details } = await evaluatePolicy(policy.id, entityType, entityId, entity);
    results.push({ policyId: policy.id, name: policy.name, result, details });
    if (result === "FAIL") blocked = true;
  }

  return { blocked, evaluated: results.length, results };
}

// ─── Built-in Policy Definitions (White Paper Appendix D) ──────

export const BUILTIN_POLICIES = [
  {
    name: "NO_SELF_VALIDATION",
    description: "Executor cannot validate their own Proof (White Paper Invariant)",
    scope: "GLOBAL",
    conditions: [{ field: "proof.actorRef", operator: "eq" as const, threshold: "__VALIDATOR_ID__" }],
    actions: [{ type: "REJECT_VALIDATION", params: { reason: "Self-validation prohibited" } }],
    priority: 100,
  },
  {
    name: "HIGH_VALUE_SETTLEMENT_APPROVAL",
    description: "High-value settlements require 2+ approvals",
    scope: "SETTLEMENT",
    conditions: [{ field: "settlement.netValue", operator: "gt" as const, threshold: 10000 }],
    actions: [{ type: "REQUIRE_APPROVAL", params: { minApprovals: 2 } }],
    priority: 90,
  },
  {
    name: "AGENT_TOOL_BOUNDARY",
    description: "Agent cannot use tools outside its whitelist",
    scope: "AGENT_POLICY",
    conditions: [{ field: "requestedTool", operator: "in" as const, threshold: ["__TOOLS_WHITELIST__"] }],
    actions: [{ type: "DENY_ACTION", params: { reason: "Tool not in agent whitelist" } }],
    priority: 95,
  },
  {
    name: "CONFLICT_OF_INTEREST",
    description: "Reviewer cannot be a deal participant",
    scope: "GLOBAL",
    conditions: [{ field: "reviewer.isParticipant", operator: "eq" as const, threshold: "true" }],
    actions: [{ type: "REQUIRE_RECUSAL", params: { reason: "Conflict of interest" } }],
    priority: 85,
  },
  {
    name: "REWARD_ELIGIBILITY",
    description: "Only verified proofs can enter reward pool",
    scope: "SETTLEMENT",
    conditions: [{ field: "proof.state", operator: "neq" as const, threshold: "EFFECTIVE" }],
    actions: [{ type: "EXCLUDE_FROM_POOL", params: { reason: "Proof not verified" } }],
    priority: 80,
  },
] as const;
