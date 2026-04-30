/**
 * Pure redaction functions for member (non-admin) payloads.
 * Each function returns a shallow-cloned object with sensitive fields nulled.
 */

// ── Node ────────────────────────────────────────────────────────────────────

export function redactNodeForMember<T extends Record<string, any>>(node: T): T {
  const n = { ...node } as Record<string, unknown>;
  n.ownerUserId = null;
  const owner = n.owner as { id?: string; name?: string | null; email?: string | null } | null | undefined;
  if (owner && typeof owner === "object") {
    n.owner = { id: owner.id, name: owner.name ?? null, email: null };
  }
  return n as T;
}

// ── Project ─────────────────────────────────────────────────────────────────

const PROJECT_PII_KEYS = [
  "contactName",
  "contactEmail",
  "contactTelegram",
  "fundraisingNeed",
  "pitchUrl"
] as const;

/**
 * If the viewer owns the project's node, return the full project.
 * Otherwise null out PII fields and redact the nested node.
 */
export function redactProjectForMember<T extends Record<string, any>>(
  project: T,
  viewerUserId: string
): T {
  const isOwner = project.node?.ownerUserId === viewerUserId;
  if (isOwner) return project;

  const cleaned: any = { ...project };
  for (const key of PROJECT_PII_KEYS) cleaned[key] = null;
  if (cleaned.node) cleaned.node = redactNodeForMember(cleaned.node);
  return cleaned;
}

// ── Task ────────────────────────────────────────────────────────────────────

/** Redact nested project if present; redact nested ownerNode. */
export function redactTaskForMember<T extends Record<string, any>>(
  task: T,
  viewerUserId: string
): T {
  const cleaned: any = { ...task };
  if (cleaned.project) cleaned.project = redactProjectForMember(cleaned.project, viewerUserId);
  if (cleaned.ownerNode) cleaned.ownerNode = redactNodeForMember(cleaned.ownerNode);
  return cleaned;
}

// ── Agent ───────────────────────────────────────────────────────────────────

export function redactAgentForMember<T extends Record<string, any>>(agent: T): T {
  return { ...agent, endpoint: null };
}

// ── Settlement cycle ────────────────────────────────────────────────────────

export function redactSettlementCycleForMember<T extends Record<string, any>>(cycle: T): T {
  return { ...cycle, pool: null };
}

// ── Evidence ────────────────────────────────────────────────────────────────

/** Keep evidence visible but redact on-chain/URL details for non-owners. */
export function redactEvidenceForMember<T extends Record<string, any>>(
  evidence: T,
  viewerNodeIds: string[]
): T {
  const isOwner = evidence.nodeId && viewerNodeIds.includes(evidence.nodeId);
  if (isOwner) return evidence;
  return { ...evidence, url: null, onchainTx: null };
}
