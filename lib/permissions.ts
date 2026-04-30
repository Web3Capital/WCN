import type { Role } from "@prisma/client";

export type Resource =
  | "node"
  | "project"
  | "capital"
  | "deal"
  | "task"
  | "evidence"
  | "pob"
  | "settlement"
  | "agent"
  | "user"
  | "invite"
  | "audit"
  | "risk"
  | "notification"
  | "file"
  | "review"
  | "dispute"
  | "workspace"
  | "approval"
  | "access_grant"
  | "entity_freeze"
  | "terms"
  | "search"
  | "policy";

export type Action =
  | "read"
  | "create"
  | "update"
  | "delete"
  | "review"
  | "export"
  | "freeze"
  | "override"
  | "manage";

type PolicyMap = Partial<Record<Resource, Action[]>>;

const ALL_READ: PolicyMap = {
  node: ["read"],
  project: ["read"],
  task: ["read"],
  evidence: ["read"],
  pob: ["read"],
  notification: ["read"],
  // Everyone can read the policy catalog — they need to know what governs them.
  policy: ["read"],
};

const FULL_ACCESS: Action[] = ["read", "create", "update", "delete", "review", "export", "freeze", "override", "manage"];

const POLICIES: Record<string, PolicyMap> = {
  FOUNDER: {
    node: FULL_ACCESS,
    project: FULL_ACCESS,
    capital: FULL_ACCESS,
    deal: FULL_ACCESS,
    task: FULL_ACCESS,
    evidence: FULL_ACCESS,
    pob: FULL_ACCESS,
    settlement: FULL_ACCESS,
    agent: FULL_ACCESS,
    user: FULL_ACCESS,
    invite: FULL_ACCESS,
    audit: ["read", "export"],
    risk: FULL_ACCESS,
    notification: ["read", "create"],
    file: FULL_ACCESS,
    review: FULL_ACCESS,
    dispute: FULL_ACCESS,
    workspace: FULL_ACCESS,
    approval: FULL_ACCESS,
    access_grant: FULL_ACCESS,
    entity_freeze: FULL_ACCESS,
    terms: FULL_ACCESS,
    search: ["read"],
    policy: FULL_ACCESS,
  },
  ADMIN: {
    node: FULL_ACCESS,
    project: FULL_ACCESS,
    capital: FULL_ACCESS,
    deal: FULL_ACCESS,
    task: FULL_ACCESS,
    evidence: FULL_ACCESS,
    pob: FULL_ACCESS,
    settlement: FULL_ACCESS,
    agent: FULL_ACCESS,
    user: FULL_ACCESS,
    invite: FULL_ACCESS,
    audit: ["read", "export"],
    risk: FULL_ACCESS,
    notification: ["read", "create"],
    file: FULL_ACCESS,
    review: FULL_ACCESS,
    dispute: FULL_ACCESS,
    workspace: FULL_ACCESS,
    approval: FULL_ACCESS,
    access_grant: FULL_ACCESS,
    entity_freeze: FULL_ACCESS,
    terms: FULL_ACCESS,
    search: ["read"],
    policy: FULL_ACCESS,
  },
  FINANCE_ADMIN: {
    ...ALL_READ,
    settlement: ["read", "create", "update", "export"],
    audit: ["read"],
    risk: ["read"],
    user: ["read"],
    file: ["read", "export"],
    notification: ["read"],
  },
  NODE_OWNER: {
    ...ALL_READ,
    node: ["read", "update"],
    project: ["read", "create", "update"],
    capital: ["read"],
    deal: ["read", "create", "update"],
    task: ["read", "create", "update"],
    evidence: ["read", "create"],
    pob: ["read"],
    agent: ["read", "create", "update"],
    settlement: ["read"],
    file: ["read", "create"],
    notification: ["read"],
    dispute: ["read", "create"],
  },
  PROJECT_OWNER: {
    ...ALL_READ,
    project: ["read", "update"],
    deal: ["read"],
    file: ["read", "create"],
    notification: ["read"],
  },
  CAPITAL_NODE: {
    ...ALL_READ,
    capital: ["read", "update"],
    deal: ["read"],
    file: ["read"],
    notification: ["read"],
  },
  SERVICE_NODE: {
    ...ALL_READ,
    task: ["read", "update"],
    evidence: ["read", "create"],
    file: ["read", "create"],
    notification: ["read"],
  },
  REVIEWER: {
    ...ALL_READ,
    evidence: ["read", "review"],
    pob: ["read", "review"],
    review: ["read", "create"],
    dispute: ["read", "create", "update"],
    risk: ["read", "create"],
    audit: ["read"],
    notification: ["read"],
    deal: ["read"],
    approval: ["read", "create", "update"],
    entity_freeze: ["read", "create"],
    // Reviewers run policy evaluations as part of their workflow.
    policy: ["read", "review"],
  },
  RISK_DESK: {
    ...ALL_READ,
    evidence: ["read", "review"],
    pob: ["read", "review"],
    review: ["read", "create"],
    dispute: ["read", "create", "update"],
    risk: FULL_ACCESS,
    audit: ["read", "export"],
    notification: ["read"],
    deal: ["read"],
    capital: ["read"],
    settlement: ["read"],
    agent: ["read", "freeze"],
    entity_freeze: FULL_ACCESS,
    approval: ["read", "create", "update"],
    file: ["read"],
    policy: ["read", "review"],
  },
  AGENT_OWNER: {
    ...ALL_READ,
    agent: ["read", "create", "update"],
    task: ["read"],
    file: ["read"],
    notification: ["read"],
  },
  OBSERVER: {
    ...ALL_READ,
    capital: ["read"],
    deal: ["read"],
    settlement: ["read"],
    audit: ["read"],
    notification: ["read"],
  },
  SYSTEM: {
    node: FULL_ACCESS,
    project: FULL_ACCESS,
    capital: FULL_ACCESS,
    deal: FULL_ACCESS,
    task: FULL_ACCESS,
    evidence: FULL_ACCESS,
    pob: FULL_ACCESS,
    settlement: FULL_ACCESS,
    agent: FULL_ACCESS,
    user: FULL_ACCESS,
    invite: FULL_ACCESS,
    audit: FULL_ACCESS,
    risk: FULL_ACCESS,
    notification: FULL_ACCESS,
    file: FULL_ACCESS,
    review: FULL_ACCESS,
    dispute: FULL_ACCESS,
    workspace: FULL_ACCESS,
    approval: FULL_ACCESS,
    access_grant: FULL_ACCESS,
    entity_freeze: FULL_ACCESS,
    terms: FULL_ACCESS,
    search: FULL_ACCESS,
    policy: FULL_ACCESS,
  },
  USER: {
    ...ALL_READ,
    notification: ["read"],
    file: ["read"],
    search: ["read"],
    terms: ["read", "create"],
  },
};

export function can(role: Role, action: Action, resource: Resource): boolean {
  const policy = POLICIES[role];
  if (!policy) return false;
  const allowed = policy[resource];
  if (!allowed) return false;
  return allowed.includes(action);
}

export function canAny(role: Role, actions: Action[], resource: Resource): boolean {
  return actions.some((a) => can(role, a, resource));
}

const ADMIN_ROLES: Set<string> = new Set(["FOUNDER", "ADMIN"]);
const HIGH_PRIV_ROLES: Set<string> = new Set([
  "FOUNDER", "ADMIN", "FINANCE_ADMIN", "REVIEWER", "RISK_DESK", "AGENT_OWNER"
]);

export function isAdminRole(role: Role): boolean {
  return ADMIN_ROLES.has(role);
}

/** Node Review Queue (`/dashboard/nodes/review-queue`) — ops + risk + reviewer. */
export function canAccessNodeReviewQueue(role: Role): boolean {
  return role === "FOUNDER" || role === "ADMIN" || role === "REVIEWER" || role === "RISK_DESK";
}

export function requiresTwoFactor(role: Role): boolean {
  return HIGH_PRIV_ROLES.has(role);
}

export function getAllowedResources(role: Role): Resource[] {
  const policy = POLICIES[role];
  if (!policy) return [];
  return Object.keys(policy) as Resource[];
}
