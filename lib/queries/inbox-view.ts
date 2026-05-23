/**
 * Inbox query — aggregates pending decisions that need the actor's attention.
 *
 * "Inbox" is the dashboard root's primary surface (replacing the old
 * KPI-cards-and-links layout). It answers "what should I do today?" for
 * the logged-in actor by collecting work that requires their decision
 * across the platform's review surfaces.
 *
 * v1 sources (3):
 *   1. Pending applications        — review roles
 *   2. Settlement lock approvals   — finance/admin roles, EXCLUDING the
 *                                     requester (maker-checker, doc §10)
 *   3. Open disputes               — review roles
 *
 * Out of scope for v1 (acknowledged):
 *   - PoB attribution flags / reviews
 *   - Risk alerts assigned to actor
 *   - Tasks assigned to actor (lives in "My active work")
 *   - Evidence packets pending review
 *   - SSE / live updates — page is server-rendered, refresh on nav
 *
 * Performance shape: each source is a bounded query (top 10–20 then
 * reduced to topN globally). No N+1 — settlement cycles are joined to
 * their pending ApprovalAction in a single follow-up batch.
 */
import type { PrismaClient, Role } from "@prisma/client";

export type InboxItemKind = "application" | "settlement_lock" | "dispute";

export interface InboxItem {
  id: string;
  kind: InboxItemKind;
  /** Short headline rendered as the card title. */
  title: string;
  /** Secondary line — actor / metadata / age. */
  context: string;
  /** Status string for the badge (uppercase enum value or readable label). */
  status: string;
  /** Deep link to the action surface. */
  href: string;
  /** ISO-ish timestamp the item became actionable. */
  createdAt: Date;
  /** Sort key — higher comes first; settlement > dispute > application. */
  priority: number;
}

export interface InboxView {
  items: InboxItem[];
  /** Count BEFORE topN slicing — used to render "→ N more" tail. */
  totalCount: number;
}

const PRIORITY: Record<InboxItemKind, number> = {
  settlement_lock: 90,
  dispute: 70,
  application: 50,
};

const REVIEW_ROLES: ReadonlyArray<Role> = ["FOUNDER", "ADMIN", "REVIEWER", "RISK_DESK"];
const FINANCE_ROLES: ReadonlyArray<Role> = ["FOUNDER", "ADMIN", "FINANCE_ADMIN"];

function ageFromNow(d: Date, now: Date = new Date()): string {
  const ms = Math.max(0, now.getTime() - d.getTime());
  const m = Math.floor(ms / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en", { month: "short", day: "numeric" });
}

function formatPeriod(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString("en", opts)}–${end.toLocaleDateString("en", opts)}`;
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

export async function buildInboxView(opts: {
  prisma: PrismaClient;
  userId: string;
  role: Role;
  /** Max items returned. Default 5 — fits the dashboard root surface. */
  topN?: number;
  /** Workspace filter; null/undefined means cross-workspace (admin). */
  workspaceId?: string | null;
  /** Injectable for tests. */
  now?: Date;
}): Promise<InboxView> {
  const { prisma, userId, role, topN = 5, workspaceId, now } = opts;
  const items: InboxItem[] = [];

  // ─── 1. Pending applications ─────────────────────────────────────
  if (REVIEW_ROLES.includes(role)) {
    const apps = await prisma.application.findMany({
      where: {
        status: { in: ["PENDING", "REVIEWING"] },
        ...(workspaceId ? { workspaceId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        applicantName: true,
        organization: true,
        status: true,
        createdAt: true,
      },
    });
    for (const a of apps) {
      const meta = [a.organization, a.status, ageFromNow(a.createdAt, now)]
        .filter((x): x is string => Boolean(x))
        .join(" · ");
      items.push({
        id: a.id,
        kind: "application",
        title: `Application from ${a.applicantName}`,
        context: meta,
        status: a.status,
        href: "/dashboard/applications",
        createdAt: a.createdAt,
        priority: PRIORITY.application,
      });
    }
  }

  // ─── 2. Settlement lock approvals (maker-checker) ────────────────
  if (FINANCE_ROLES.includes(role)) {
    const approvals = await prisma.approvalAction.findMany({
      where: {
        status: "PENDING",
        actionType: "LOCK",
        entityType: "SETTLEMENT_CYCLE",
        // Maker-checker independence: a finance admin cannot approve
        // their own lock request. doc §10 calls this out as
        // non-negotiable.
        requestedById: { not: userId },
        ...(workspaceId ? { workspaceId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    if (approvals.length > 0) {
      const cycleIds = approvals.map((a) => a.entityId);
      const cycles = await prisma.settlementCycle.findMany({
        where: { id: { in: cycleIds } },
        select: { id: true, kind: true, startAt: true, endAt: true, status: true },
      });
      const cycleMap = new Map(cycles.map((c) => [c.id, c]));
      for (const ap of approvals) {
        const cycle = cycleMap.get(ap.entityId);
        if (!cycle) continue;
        items.push({
          id: ap.id,
          kind: "settlement_lock",
          title: `Lock ${cycle.kind.toLowerCase()} settlement (${formatPeriod(cycle.startAt, cycle.endAt)})`,
          context: [
            `Requested ${ageFromNow(ap.createdAt, now)}`,
            ap.reason ? truncate(ap.reason, 60) : null,
          ]
            .filter((x): x is string => Boolean(x))
            .join(" · "),
          status: cycle.status,
          href: "/dashboard/approvals",
          createdAt: ap.createdAt,
          priority: PRIORITY.settlement_lock,
        });
      }
    }
  }

  // ─── 3. Open disputes ────────────────────────────────────────────
  if (REVIEW_ROLES.includes(role)) {
    const disputes = await prisma.dispute.findMany({
      where: {
        status: "OPEN",
        ...(workspaceId ? { workspaceId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        targetType: true,
        targetId: true,
        reason: true,
        status: true,
        createdAt: true,
      },
    });
    for (const d of disputes) {
      items.push({
        id: d.id,
        kind: "dispute",
        title: `Resolve ${d.targetType.toLowerCase()} dispute`,
        context: [
          truncate(d.reason, 80),
          ageFromNow(d.createdAt, now),
        ].join(" · "),
        status: d.status,
        href: "/dashboard/disputes",
        createdAt: d.createdAt,
        priority: PRIORITY.dispute,
      });
    }
  }

  // Sort: priority desc, then most recent first.
  items.sort(
    (a, b) =>
      b.priority - a.priority ||
      b.createdAt.getTime() - a.createdAt.getTime(),
  );

  return {
    items: items.slice(0, topN),
    totalCount: items.length,
  };
}
