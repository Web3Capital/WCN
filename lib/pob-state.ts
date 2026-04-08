/** PoB uses ApplicationStatus in schema; valid workflow states for records. */
const STATES = new Set<string>(["PENDING", "REVIEWING", "APPROVED", "REJECTED"]);

/**
 * Allowed status transitions. APPROVED/REJECTED are terminal unless reopened from REJECTED.
 */
const ALLOWED_FROM: Record<string, Set<string>> = {
  PENDING: new Set(["REVIEWING", "REJECTED"]),
  REVIEWING: new Set(["APPROVED", "REJECTED", "PENDING"]),
  APPROVED: new Set([]),
  REJECTED: new Set(["PENDING"])
};

export function assertPoBStatusValue(status: string): boolean {
  return STATES.has(status);
}

export function canTransitionPoBStatus(from: string, to: string): boolean {
  if (from === to) return true;
  const next = ALLOWED_FROM[from];
  return Boolean(next?.has(to));
}

export function pobTransitionErrorMessage(from: string, to: string): string {
  return `Invalid PoB status transition: ${from} → ${to}.`;
}
