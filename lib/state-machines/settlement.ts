import type { SettlementCycleStatus } from "@prisma/client";

const TRANSITIONS: Record<SettlementCycleStatus, SettlementCycleStatus[]> = {
  DRAFT:       ["RECONCILED"],
  RECONCILED:  ["LOCKED", "DRAFT"],
  LOCKED:      ["EXPORTED", "REOPENED", "FINALIZED"],
  EXPORTED:    ["FINALIZED", "REOPENED"],
  REOPENED:    ["RECONCILED"],
  FINALIZED:   [],
};

export function canTransitionSettlement(from: SettlementCycleStatus, to: SettlementCycleStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function validNextSettlementStatuses(from: SettlementCycleStatus): SettlementCycleStatus[] {
  return TRANSITIONS[from] ?? [];
}
