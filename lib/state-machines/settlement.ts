import type { SettlementCycleStatus } from "@prisma/client";

const TRANSITIONS: Record<SettlementCycleStatus, SettlementCycleStatus[]> = {
  DRAFT:                    ["RECONCILED"],
  RECONCILED:               ["LOCK_PENDING_APPROVAL", "LOCKED", "DRAFT"],
  LOCK_PENDING_APPROVAL:    ["LOCKED", "RECONCILED"],
  LOCKED:                   ["EXPORTED", "REOPEN_PENDING_APPROVAL", "REOPENED", "FINALIZED"],
  EXPORTED:                 ["FINALIZED", "REOPEN_PENDING_APPROVAL", "REOPENED"],
  REOPEN_PENDING_APPROVAL:  ["REOPENED", "LOCKED", "EXPORTED"],
  REOPENED:                 ["RECONCILED"],
  FINALIZED:                [],
};

export function canTransitionSettlement(from: SettlementCycleStatus, to: SettlementCycleStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function validNextSettlementStatuses(from: SettlementCycleStatus): SettlementCycleStatus[] {
  return TRANSITIONS[from] ?? [];
}
