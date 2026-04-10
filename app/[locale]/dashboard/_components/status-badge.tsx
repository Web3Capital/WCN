const COLORS: Record<string, string> = {
  ACTIVE: "badge-green", LIVE: "badge-green", APPROVED: "badge-green", PASSED: "badge-green",
  SIGNED: "badge-green", FUNDED: "badge-green", EFFECTIVE: "badge-green", CONFIRMED: "badge-green",
  COMPLETED: "badge-green", EXECUTED: "badge-green", SUCCESS: "badge-green", DONE: "badge-green",
  ACCEPTED: "badge-green",

  PENDING: "badge-amber", DRAFT: "badge-amber", REVIEWING: "badge-amber", GENERATED: "badge-amber",
  SUBMITTED: "badge-amber", RUNNING: "badge-amber", IN_PROGRESS: "badge-amber",
  WAITING_REVIEW: "badge-amber", OPEN: "badge-amber", PROSPECT: "badge-amber",
  PENDING_REVIEW: "badge-amber", CREATED: "badge-amber",

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

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const color = COLORS[status] ?? "";
  return <span className={`badge ${color} ${className ?? ""}`.trim()}>{status.replace(/_/g, " ")}</span>;
}
