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
  | "dispute";

export type Action =
  | "read"
  | "create"
  | "update"
  | "delete"
  | "review"
  | "export"
  | "freeze"
  | "override";

type PolicyMap = Partial<Record<Resource, Action[]>>;

const ALL_READ: PolicyMap = {
  node: ["read"],
  project: ["read"],
  task: ["read"],
  evidence: ["read"],
  pob: ["read"],
  notification: ["read"],
};

const FULL_ACCESS: Action[] = ["read", "create", "update", "delete", "review", "export", "freeze", "override"];

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
  USER: {
    ...ALL_READ,
    notification: ["read"],
    file: ["read"],
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
  "FOUNDER", "ADMIN", "FINANCE_ADMIN", "REVIEWER", "AGENT_OWNER"
]);

export function isAdminRole(role: Role): boolean {
  return ADMIN_ROLES.has(role);
}

export function requiresTwoFactor(role: Role): boolean {
  return HIGH_PRIV_ROLES.has(role);
}

export function getAllowedResources(role: Role): Resource[] {
  const policy = POLICIES[role];
  if (!policy) return [];
  return Object.keys(policy) as Resource[];
}
