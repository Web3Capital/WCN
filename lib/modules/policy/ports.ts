/**
 * @wcn/policy — Hexagonal Port Interfaces
 *
 * White Paper §13: Governance Layer — Policy Engine
 * Policy is a first-class object: id, scope, conditions, approvers,
 * actions, rollback_logic, version, state.
 */

export interface PolicyRecord {
  id: string;
  workspaceId: string | null;
  name: string;
  description: string | null;
  scope: string;
  scopeRef: string | null;
  conditions: unknown;
  actions: unknown;
  approvers: string[];
  rollbackLogic: unknown | null;
  priority: number;
  version: number;
  status: string;
  createdBy: string | null;
  activatedAt: Date | null;
  retiredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PolicyEvaluationRecord {
  id: string;
  policyId: string;
  entityType: string;
  entityId: string;
  result: "PASS" | "FAIL" | "WARN";
  details: unknown | null;
  evaluatedAt: Date;
}

export interface PolicyCondition {
  field: string;
  operator: "eq" | "neq" | "gt" | "lt" | "gte" | "lte" | "contains" | "in";
  threshold: string | number | string[];
}

export interface PolicyAction {
  type: string;
  params?: Record<string, unknown>;
}

export interface PolicyPort {
  createPolicy(data: Omit<PolicyRecord, "id" | "createdAt" | "updatedAt" | "version">): Promise<PolicyRecord>;
  findPolicyById(id: string): Promise<PolicyRecord | null>;
  findActivePolicies(scope: string, scopeRef?: string): Promise<PolicyRecord[]>;
  updatePolicy(id: string, data: Partial<PolicyRecord>): Promise<void>;
  createEvaluation(data: Omit<PolicyEvaluationRecord, "id" | "evaluatedAt">): Promise<PolicyEvaluationRecord>;
}
