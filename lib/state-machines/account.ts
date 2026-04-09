import type { AccountStatus } from "@prisma/client";

const TRANSITIONS: Record<AccountStatus, AccountStatus[]> = {
  INVITED:    ["ACTIVE", "PENDING_2FA", "OFFBOARDED"],
  ACTIVE:     ["SUSPENDED", "LOCKED", "OFFBOARDED"],
  PENDING_2FA:["ACTIVE", "SUSPENDED", "OFFBOARDED"],
  SUSPENDED:  ["ACTIVE", "LOCKED", "OFFBOARDED"],
  LOCKED:     ["ACTIVE", "SUSPENDED", "OFFBOARDED"],
  OFFBOARDED: [],
};

export function canTransitionAccount(from: AccountStatus, to: AccountStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function validNextAccountStatuses(from: AccountStatus): AccountStatus[] {
  return TRANSITIONS[from] ?? [];
}
