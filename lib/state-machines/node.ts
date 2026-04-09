import type { NodeStatus } from "@prisma/client";

const TRANSITIONS: Record<NodeStatus, NodeStatus[]> = {
  DRAFT:          ["SUBMITTED"],
  SUBMITTED:      ["UNDER_REVIEW", "REJECTED"],
  UNDER_REVIEW:   ["NEED_MORE_INFO", "APPROVED", "REJECTED"],
  NEED_MORE_INFO: ["UNDER_REVIEW", "REJECTED"],
  APPROVED:       ["CONTRACTING", "REJECTED"],
  REJECTED:       [],
  CONTRACTING:    ["LIVE", "SUSPENDED"],
  LIVE:           ["PROBATION", "SUSPENDED", "OFFBOARDED"],
  PROBATION:      ["LIVE", "SUSPENDED", "OFFBOARDED"],
  SUSPENDED:      ["LIVE", "OFFBOARDED"],
  OFFBOARDED:     [],
  // legacy compat
  ACTIVE:         ["PROBATION", "SUSPENDED", "OFFBOARDED"],
};

export function canTransitionNode(from: NodeStatus, to: NodeStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function validNextNodeStatuses(from: NodeStatus): NodeStatus[] {
  return TRANSITIONS[from] ?? [];
}
