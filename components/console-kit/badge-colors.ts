/**
 * Centralized status → CSS class mapping for badge surfaces.
 *
 * Owned by `components/console-kit/` (the canonical L4 UI primitive layer
 * per `docs/architecture/12-console-system-design.md`). Both
 * `app/[locale]/dashboard/_components/status-badge.tsx` and
 * `components/console-kit/status-pill.tsx` import from here so the
 * platform speaks a single visual language for status.
 *
 * The classes themselves (`badge-green`, `badge-amber`, etc.) are
 * defined in the global stylesheet — keep that as the source of truth
 * for colors; this file is just the status → class mapping.
 */

export const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "badge-green", LIVE: "badge-green", APPROVED: "badge-green", PASSED: "badge-green",
  SIGNED: "badge-green", FUNDED: "badge-green", EFFECTIVE: "badge-green", CONFIRMED: "badge-green",
  COMPLETED: "badge-green", EXECUTED: "badge-green", SUCCESS: "badge-green", DONE: "badge-green",
  ACCEPTED: "badge-green",

  PENDING: "badge-amber", DRAFT: "badge-amber", REVIEWING: "badge-amber", GENERATED: "badge-amber",
  SUBMITTED: "badge-amber", RUNNING: "badge-amber", IN_PROGRESS: "badge-amber", WATCHLIST: "badge-amber",
  UNDER_REVIEW: "badge-purple", NEED_MORE_INFO: "badge-accent",
  WAITING_REVIEW: "badge-amber", OPEN: "badge-amber", PROSPECT: "badge-amber",
  PENDING_REVIEW: "badge-amber", CREATED: "badge-amber",
  // Node lifecycle gaps closed (PROBATION/CONTRACTING) — both are
  // in-flight states with reduced privileges, amber matches WATCHLIST.
  CONTRACTING: "badge-amber", PROBATION: "badge-amber",
  // Settlement lifecycle (8 statuses). RECONCILED + EXPORTED are
  // forward-progress milestones; the *_PENDING_APPROVAL gates wait on
  // a second FINANCE_ADMIN; FINALIZED is terminal success; REOPENED
  // is a transient corrective state.
  RECONCILED: "badge-accent",
  LOCK_PENDING_APPROVAL: "badge-amber",
  EXPORTED: "badge-accent",
  REOPEN_PENDING_APPROVAL: "badge-amber",
  REOPENED: "badge-amber",
  FINALIZED: "badge-green",

  DD: "badge-purple", TERM_SHEET: "badge-purple", CURATED: "badge-purple",
  IN_DEAL_ROOM: "badge-purple", INTEREST_EXPRESSED: "badge-accent",
  MATCHED: "badge-accent", MEETING_DONE: "badge-accent", QUALIFIED: "badge-accent",
  WARM: "badge-accent", SCREENED: "badge-accent", INTRO_SENT: "badge-accent",

  REJECTED: "badge-red", FAILED: "badge-red", CANCELLED: "badge-red",
  LOCKED: "badge-red", SUSPENDED: "badge-red", OFFBOARDED: "badge-red",
  DECLINED: "badge-red", FROZEN: "badge-red", DISMISSED: "badge-red",

  HIGH: "badge-red", CRITICAL: "badge-red",
  MEDIUM: "badge-amber",
  LOW: "badge-green",
};

/** Look up the badge class for a status; returns "" when unmapped. */
export function colorForStatus(status: string): string {
  return STATUS_COLORS[status] ?? "";
}
