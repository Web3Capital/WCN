"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Bot,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Database,
  DollarSign,
  FileText,
  FolderKanban,
  Gavel,
  GitCompareArrows,
  Handshake,
  Home,
  Inbox,
  Key,
  Landmark,
  LayoutDashboard,
  ListChecks,
  ListFilter,
  ListTodo,
  Bell,
  LogOut,
  Mail,
  Map,
  Megaphone,
  Menu,
  Network,
  Rocket,
  Search,
  Scale,
  Settings,
  ShieldCheck,
  Trophy,
  User,
  UserCircle,
  Users,
  Vote,
  Zap,
  X,
} from "lucide-react";
import type { Role } from "@prisma/client";
import { signOut } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";

type GroupTitleKey = "overview" | "nodeSystem" | "network" | "work" | "verification" | "intelligence" | "admin" | "ecosystem" | "platform";
type ItemLabelKey = "myWorkspace" | "nodes" | "nodeReviewQueue" | "projects" | "capital" | "dealRoom" | "matches" | "tasks" | "agents" | "evidenceDesk" | "pobRecords" | "disputes" | "settlement" | "dataCockpit" | "riskConsole" | "reputation" | "approvals" | "applications" | "users" | "invites" | "auditLog" | "proposals" | "campaigns" | "apiKeys" | "ingestion";

type NavSection = {
  sectionKey: string;
  items: { href: string; labelKey: string; icon?: ReactNode }[];
};

type NavDef = {
  titleKey: GroupTitleKey;
  items: { href: string; labelKey: ItemLabelKey; icon: ReactNode; roles?: Role[]; sections?: NavSection[] }[];
};

// ── Node System: 15 sections, 5 layers ──────────────────────────────────────
// Layer 1: 准入层 (01-06)  Layer 2: 经营层 (07-09)
// Layer 3: 管理层 (10-13)  Layer 4: 风控层 (14)  Layer 5: 系统层 (15)

const NODE_SYSTEM_SECTIONS: NavSection[] = [
  // ── 01 节点总览 ────────────────────────────────────────────────
  {
    sectionKey: "nsOverview",
    items: [
      { href: "/dashboard/node-system", labelKey: "nsOverview", icon: <LayoutDashboard size={16} /> },
      { href: "/dashboard/node-system/status-board", labelKey: "nsStatusBoard" },
      { href: "/dashboard/node-system/kpi", labelKey: "nsKpi" },
    ],
  },
  // ── 02 节点申请 ────────────────────────────────────────────────
  {
    sectionKey: "nsApplications",
    items: [
      { href: "/dashboard/node-system/applications", labelKey: "nsApplications", icon: <Inbox size={16} /> },
      { href: "/dashboard/node-system/applications/pending", labelKey: "nsAppPending" },
      { href: "/dashboard/node-system/applications/info-needed", labelKey: "nsAppInfoNeeded" },
      { href: "/dashboard/node-system/applications/interview", labelKey: "nsAppInterview" },
      { href: "/dashboard/node-system/applications/risk-review", labelKey: "nsAppRiskReview" },
      { href: "/dashboard/node-system/applications/approved", labelKey: "nsAppApproved" },
      { href: "/dashboard/node-system/applications/rejected", labelKey: "nsAppRejected" },
    ],
  },
  // ── 03 节点档案 ────────────────────────────────────────────────
  {
    sectionKey: "nsRegistry",
    items: [
      { href: "/dashboard/node-system/registry", labelKey: "nsRegistry", icon: <Network size={16} /> },
      { href: "/dashboard/node-system/registry/genesis", labelKey: "nsGenesis" },
      { href: "/dashboard/node-system/registry/regional", labelKey: "nsRegional" },
      { href: "/dashboard/node-system/registry/city", labelKey: "nsCity" },
      { href: "/dashboard/node-system/registry/vertical", labelKey: "nsVertical" },
      { href: "/dashboard/node-system/registry/functional", labelKey: "nsFunctional" },
      { href: "/dashboard/node-system/registry/agent", labelKey: "nsAgent" },
    ],
  },
  // ── 04 Territory管理 ──────────────────────────────────────────
  {
    sectionKey: "nsTerritory",
    items: [
      { href: "/dashboard/node-system/territory", labelKey: "nsTerritory", icon: <Map size={16} /> },
      { href: "/dashboard/node-system/territory/region-claims", labelKey: "nsRegionClaims" },
      { href: "/dashboard/node-system/territory/vertical-claims", labelKey: "nsVerticalClaims" },
      { href: "/dashboard/node-system/territory/protected", labelKey: "nsProtected" },
      { href: "/dashboard/node-system/territory/conflicts", labelKey: "nsConflicts" },
      { href: "/dashboard/node-system/territory/exclusivity", labelKey: "nsExclusivity" },
    ],
  },
  // ── 05 节点成员 ────────────────────────────────────────────────
  {
    sectionKey: "nsMembers",
    items: [
      { href: "/dashboard/node-system/members", labelKey: "nsMembers", icon: <Users size={16} /> },
      { href: "/dashboard/node-system/members/owners", labelKey: "nsOwners" },
      { href: "/dashboard/node-system/members/list", labelKey: "nsMemberList" },
      { href: "/dashboard/node-system/members/roles", labelKey: "nsRoles" },
      { href: "/dashboard/node-system/members/invites", labelKey: "nsInvites" },
      { href: "/dashboard/node-system/members/changelog", labelKey: "nsMemberChangelog" },
    ],
  },
  // ── 06 Onboarding ─────────────────────────────────────────────
  {
    sectionKey: "nsOnboarding",
    items: [
      { href: "/dashboard/node-system/onboarding", labelKey: "nsOnboarding", icon: <Rocket size={16} /> },
      { href: "/dashboard/node-system/onboarding/checklist", labelKey: "nsChecklist" },
      { href: "/dashboard/node-system/onboarding/pending", labelKey: "nsOnbPending" },
      { href: "/dashboard/node-system/onboarding/go-live", labelKey: "nsGoLive" },
      { href: "/dashboard/node-system/onboarding/probation", labelKey: "nsProbation" },
    ],
  },
  // ── 07 节点Pipeline（经营层）──────────────────────────────────
  {
    sectionKey: "nsPipeline",
    items: [
      { href: "/dashboard/node-system/pipeline", labelKey: "nsPipeline", icon: <FolderKanban size={16} /> },
      { href: "/dashboard/node-system/pipeline/projects", labelKey: "nsPipeProjects" },
      { href: "/dashboard/node-system/pipeline/capital", labelKey: "nsPipeCapital" },
      { href: "/dashboard/node-system/pipeline/services", labelKey: "nsPipeServices" },
      { href: "/dashboard/node-system/pipeline/regional", labelKey: "nsPipeRegional" },
      { href: "/dashboard/node-system/pipeline/active", labelKey: "nsPipeActive" },
      { href: "/dashboard/node-system/pipeline/blocked", labelKey: "nsPipeBlocked" },
    ],
  },
  // ── 08 节点协同（经营层）──────────────────────────────────────
  {
    sectionKey: "nsCollaboration",
    items: [
      { href: "/dashboard/node-system/collaboration", labelKey: "nsCollaboration", icon: <Handshake size={16} /> },
      { href: "/dashboard/node-system/collaboration/my-deals", labelKey: "nsMyDeals" },
      { href: "/dashboard/node-system/collaboration/co-deals", labelKey: "nsCoDeals" },
      { href: "/dashboard/node-system/collaboration/my-tasks", labelKey: "nsMyTasks" },
      { href: "/dashboard/node-system/collaboration/assigned", labelKey: "nsAssigned" },
      { href: "/dashboard/node-system/collaboration/cross-node", labelKey: "nsCrossNode" },
      { href: "/dashboard/node-system/collaboration/agent", labelKey: "nsAgentCollab" },
    ],
  },
  // ── 09 节点PoB（经营层）───────────────────────────────────────
  {
    sectionKey: "nsPob",
    items: [
      { href: "/dashboard/node-system/pob", labelKey: "nsPob", icon: <ShieldCheck size={16} /> },
      { href: "/dashboard/node-system/pob/submitted", labelKey: "nsPobSubmitted" },
      { href: "/dashboard/node-system/pob/info-needed", labelKey: "nsPobInfoNeeded" },
      { href: "/dashboard/node-system/pob/reviewing", labelKey: "nsPobReviewing" },
      { href: "/dashboard/node-system/pob/approved", labelKey: "nsPobApproved" },
      { href: "/dashboard/node-system/pob/rejected", labelKey: "nsPobRejected" },
      { href: "/dashboard/node-system/pob/disputes", labelKey: "nsPobDisputes" },
    ],
  },
  // ── 10 节点评分（管理层）──────────────────────────────────────
  {
    sectionKey: "nsScorecard",
    items: [
      { href: "/dashboard/node-system/scorecard", labelKey: "nsScorecard", icon: <BarChart3 size={16} /> },
      { href: "/dashboard/node-system/scorecard/pipeline-quality", labelKey: "nsPipelineQuality" },
      { href: "/dashboard/node-system/scorecard/closure-rate", labelKey: "nsClosureRate" },
      { href: "/dashboard/node-system/scorecard/evidence-quality", labelKey: "nsEvidenceQuality" },
      { href: "/dashboard/node-system/scorecard/collaboration", labelKey: "nsCollabReliability" },
      { href: "/dashboard/node-system/scorecard/risk-record", labelKey: "nsRiskRecord" },
      { href: "/dashboard/node-system/scorecard/monthly", labelKey: "nsMonthly" },
      { href: "/dashboard/node-system/scorecard/quarterly", labelKey: "nsQuarterly" },
    ],
  },
  // ── 11 节点动作（管理层）──────────────────────────────────────
  {
    sectionKey: "nsActions",
    items: [
      { href: "/dashboard/node-system/actions", labelKey: "nsActions", icon: <Zap size={16} /> },
      { href: "/dashboard/node-system/actions/upgrade", labelKey: "nsUpgrade" },
      { href: "/dashboard/node-system/actions/maintain", labelKey: "nsMaintain" },
      { href: "/dashboard/node-system/actions/watchlist", labelKey: "nsWatchlist" },
      { href: "/dashboard/node-system/actions/downgrade", labelKey: "nsDowngrade" },
      { href: "/dashboard/node-system/actions/freeze", labelKey: "nsFreeze" },
      { href: "/dashboard/node-system/actions/offboard", labelKey: "nsOffboard" },
    ],
  },
  // ── 12 节点收益（管理层）──────────────────────────────────────
  {
    sectionKey: "nsRevenue",
    items: [
      { href: "/dashboard/node-system/revenue", labelKey: "nsRevenue", icon: <DollarSign size={16} /> },
      { href: "/dashboard/node-system/revenue/overview", labelKey: "nsRevenueOverview" },
      { href: "/dashboard/node-system/revenue/pob-share", labelKey: "nsPobShare" },
      { href: "/dashboard/node-system/revenue/settlement", labelKey: "nsSettlement" },
      { href: "/dashboard/node-system/revenue/frozen", labelKey: "nsFrozen" },
      { href: "/dashboard/node-system/revenue/roi", labelKey: "nsRoi" },
    ],
  },
  // ── 13 节点报告（管理层）──────────────────────────────────────
  {
    sectionKey: "nsReports",
    items: [
      { href: "/dashboard/node-system/reports", labelKey: "nsReports", icon: <FileText size={16} /> },
      { href: "/dashboard/node-system/reports/weekly", labelKey: "nsWeekly" },
      { href: "/dashboard/node-system/reports/monthly", labelKey: "nsReportMonthly" },
      { href: "/dashboard/node-system/reports/quarterly-review", labelKey: "nsQuarterlyReview" },
      { href: "/dashboard/node-system/reports/remediation", labelKey: "nsRemediation" },
      { href: "/dashboard/node-system/reports/archive", labelKey: "nsArchive" },
    ],
  },
  // ── 14 节点风控（风控层）──────────────────────────────────────
  {
    sectionKey: "nsRisk",
    items: [
      { href: "/dashboard/node-system/risk", labelKey: "nsRisk", icon: <AlertTriangle size={16} /> },
      { href: "/dashboard/node-system/risk/flagged", labelKey: "nsRiskFlagged" },
      { href: "/dashboard/node-system/risk/violations", labelKey: "nsViolations" },
      { href: "/dashboard/node-system/risk/private-settlement", labelKey: "nsPrivateSettlement" },
      { href: "/dashboard/node-system/risk/duplicate-attribution", labelKey: "nsDuplicateAttribution" },
      { href: "/dashboard/node-system/risk/anomalies", labelKey: "nsAnomalies" },
      { href: "/dashboard/node-system/risk/blacklist", labelKey: "nsBlacklist" },
    ],
  },
  // ── 15 节点设置（系统层）──────────────────────────────────────
  {
    sectionKey: "nsSettings",
    items: [
      { href: "/dashboard/node-system/settings", labelKey: "nsSettings", icon: <Settings size={16} /> },
      { href: "/dashboard/node-system/settings/types", labelKey: "nsTypeConfig" },
      { href: "/dashboard/node-system/settings/seats", labelKey: "nsSeatLevels" },
      { href: "/dashboard/node-system/settings/scoring", labelKey: "nsScoringRules" },
      { href: "/dashboard/node-system/settings/territory-rules", labelKey: "nsTerritoryRules" },
      { href: "/dashboard/node-system/settings/permissions", labelKey: "nsPermissions" },
      { href: "/dashboard/node-system/settings/notifications", labelKey: "nsNotifRules" },
      { href: "/dashboard/node-system/settings/templates", labelKey: "nsTemplates" },
    ],
  },
];

const GROUP_DEFS: NavDef[] = [
  {
    titleKey: "overview",
    items: [
      { href: "/dashboard", labelKey: "myWorkspace", icon: <LayoutDashboard size={18} strokeWidth={2} /> },
    ],
  },
  {
    titleKey: "nodeSystem",
    items: [
      {
        href: "/dashboard/node-system",
        labelKey: "nodes",
        icon: <Network size={18} strokeWidth={2} />,
        roles: ["FOUNDER", "ADMIN", "NODE_OWNER", "REVIEWER", "RISK_DESK"],
        sections: NODE_SYSTEM_SECTIONS,
      },
    ],
  },
  {
    titleKey: "network",
    items: [
      { href: "/dashboard/projects", labelKey: "projects", icon: <FolderKanban size={18} strokeWidth={2} /> },
      { href: "/dashboard/capital", labelKey: "capital", icon: <Landmark size={18} strokeWidth={2} /> },
      { href: "/dashboard/matches", labelKey: "matches", icon: <GitCompareArrows size={18} strokeWidth={2} /> },
      { href: "/dashboard/deals", labelKey: "dealRoom", icon: <Handshake size={18} strokeWidth={2} /> },
    ],
  },
  {
    titleKey: "work",
    items: [
      { href: "/dashboard/tasks", labelKey: "tasks", icon: <ListTodo size={18} strokeWidth={2} /> },
      { href: "/dashboard/agents", labelKey: "agents", icon: <Bot size={18} strokeWidth={2} /> },
    ],
  },
  {
    titleKey: "verification",
    items: [
      {
        href: "/dashboard/proof-desk",
        labelKey: "evidenceDesk",
        icon: <ShieldCheck size={18} strokeWidth={2} />,
        roles: ["FOUNDER", "ADMIN", "REVIEWER", "RISK_DESK", "NODE_OWNER", "SERVICE_NODE"],
      },
      { href: "/dashboard/pob", labelKey: "pobRecords", icon: <ListChecks size={18} strokeWidth={2} /> },
      {
        href: "/dashboard/disputes",
        labelKey: "disputes",
        icon: <Gavel size={18} strokeWidth={2} />,
        roles: ["FOUNDER", "ADMIN", "REVIEWER", "RISK_DESK"],
      },
      { href: "/dashboard/settlement", labelKey: "settlement", icon: <Scale size={18} strokeWidth={2} /> },
    ],
  },
  {
    titleKey: "intelligence",
    items: [
      { href: "/dashboard/data", labelKey: "dataCockpit", icon: <BarChart3 size={18} strokeWidth={2} />, roles: ["FOUNDER", "ADMIN"] },
      { href: "/dashboard/risk", labelKey: "riskConsole", icon: <AlertTriangle size={18} strokeWidth={2} />, roles: ["FOUNDER", "ADMIN", "RISK_DESK"] },
      { href: "/dashboard/reputation", labelKey: "reputation", icon: <Trophy size={18} strokeWidth={2} /> },
    ],
  },
  {
    titleKey: "admin",
    items: [
      {
        href: "/dashboard/approvals",
        labelKey: "approvals",
        icon: <ShieldCheck size={18} strokeWidth={2} />,
        roles: ["FOUNDER", "ADMIN", "FINANCE_ADMIN", "REVIEWER", "RISK_DESK"],
      },
      { href: "/dashboard/applications", labelKey: "applications", icon: <Inbox size={18} strokeWidth={2} />, roles: ["FOUNDER", "ADMIN", "REVIEWER"] },
      { href: "/dashboard/users", labelKey: "users", icon: <Users size={18} strokeWidth={2} />, roles: ["FOUNDER", "ADMIN"] },
      { href: "/dashboard/admin/invites", labelKey: "invites", icon: <Mail size={18} strokeWidth={2} />, roles: ["FOUNDER", "ADMIN"] },
      { href: "/dashboard/audit", labelKey: "auditLog", icon: <ClipboardList size={18} strokeWidth={2} />, roles: ["FOUNDER", "ADMIN", "REVIEWER", "RISK_DESK"] },
    ],
  },
  {
    titleKey: "ecosystem",
    items: [
      { href: "/dashboard/governance", labelKey: "proposals", icon: <Vote size={18} strokeWidth={2} /> },
      { href: "/dashboard/campaigns", labelKey: "campaigns", icon: <Megaphone size={18} strokeWidth={2} />, roles: ["FOUNDER", "ADMIN"] },
    ],
  },
  {
    titleKey: "platform",
    items: [
      { href: "/dashboard/api-keys", labelKey: "apiKeys", icon: <Key size={18} strokeWidth={2} /> },
      { href: "/dashboard/ingestion", labelKey: "ingestion", icon: <Database size={18} strokeWidth={2} />, roles: ["FOUNDER", "ADMIN"] },
    ],
  },
];

function stripLocaleFromPath(pathname: string): string {
  return pathname.replace(/^\/(en|zh|ja|ko|es|fr|de|pt|ar|ru)/, "") || "/";
}

function pathMatches(pathname: string, href: string) {
  const p = stripLocaleFromPath(pathname).replace(/\/$/, "") || "/";
  const h = href.replace(/\/$/, "") || "/";
  if (h === "/dashboard") return p === "/dashboard";
  return p === h || p.startsWith(`${h}/`);
}

function getBreadcrumbs(
  pathname: string,
  tSeg: (key: string) => string
): { label: string; href: string }[] {
  const bare = stripLocaleFromPath(pathname);
  const parts = bare.replace(/^\/dashboard\/?/, "").split("/").filter(Boolean);
  if (parts.length === 0) return [];
  const crumbs: { label: string; href: string }[] = [];
  let href = "/dashboard";
  for (const part of parts) {
    href += `/${part}`;
    const mapped = tSeg(part);
    const label = mapped !== part
      ? mapped
      : part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, " ");
    crumbs.push({ label, href });
  }
  return crumbs;
}

function GlobalSearch() {
  const t = useTranslations("dashboard.search");
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ type: string; id: string; label: string; href: string; badge?: string }[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const search = useCallback((value: string) => {
    setQ(value);
    clearTimeout(timer.current);
    if (value.trim().length < 2) { setResults([]); return; }
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
        const data = await res.json();
        if (data.ok) setResults(data.data?.results ?? data.data ?? []);
      } catch { /* ignore */ }
    }, 300);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as HTMLElement)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <div className="search-box">
        <Search size={15} className="search-box-icon" />
        <input
          placeholder={t("placeholder")}
          value={q}
          onChange={(e) => search(e.target.value)}
          onFocus={() => setOpen(true)}
        />
      </div>
      {open && results.length > 0 && (
        <div className="search-dropdown">
          {results.map((r) => (
            <button
              key={`${r.type}-${r.id}`}
              type="button"
              onClick={() => { setOpen(false); setQ(""); setResults([]); router.push(r.href); }}
              className="search-result-btn"
            >
              <span className="badge" style={{ fontSize: 10, flexShrink: 0 }}>{r.type}</span>
              <span className="search-result-label">{r.label}</span>
              {r.badge && <span className="badge" style={{ fontSize: 10 }}>{r.badge}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AccountMenu({
  displayName,
  email,
}: {
  displayName: string;
  email?: string;
}) {
  const t = useTranslations("dashboard.account");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as HTMLElement)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div ref={ref} className="dashboard-account-wrap">
      <button
        type="button"
        className="dashboard-account-trigger"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={t("menuAria")}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="user-avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
          {(displayName || "?").charAt(0).toUpperCase()}
        </span>
        <ChevronDown size={16} className="dashboard-account-chevron" aria-hidden data-open={open ? "true" : "false"} />
      </button>
      <div className="account-menu-panel account-menu-panel--dashboard" hidden={!open}>
        <div className="account-menu-head">
          <p className="account-menu-name">{displayName}</p>
          {email ? <p className="account-menu-email muted">{email}</p> : null}
        </div>
        <div className="account-menu-actions">
          <Link href="/dashboard" className="account-menu-link" onClick={() => setOpen(false)}>
            <LayoutDashboard size={16} strokeWidth={2} aria-hidden />
            {t("workspace")}
          </Link>
          <Link href="/dashboard/profile" className="account-menu-link" onClick={() => setOpen(false)}>
            <UserCircle size={16} strokeWidth={2} aria-hidden />
            {t("profile")}
          </Link>
          <Link href="/dashboard/settings" className="account-menu-link" onClick={() => setOpen(false)}>
            <Settings size={16} strokeWidth={2} aria-hidden />
            {t("settings")}
          </Link>
          <Link href="/" className="account-menu-link" onClick={() => setOpen(false)}>
            <Home size={16} strokeWidth={2} aria-hidden />
            {t("siteHome")}
          </Link>
          <button
            type="button"
            className="account-menu-signout"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOut size={16} strokeWidth={2} aria-hidden />
            {t("signOut")}
          </button>
        </div>
      </div>
    </div>
  );
}

function NotificationBell() {
  const t = useTranslations("dashboard.notifications");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<{ id: string; title: string; body: string | null; readAt: string | null; createdAt: string }[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/notifications?unread=false")
      .then((r) => {
        if (!r.ok) throw new Error(`Notification fetch failed: ${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (d.ok && d.data) {
          setCount(d.data.unreadCount ?? 0);
          setItems(d.data.notifications ?? []);
        }
      })
      .catch((err) => console.error("[Dashboard] notification fetch failed", err));
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as HTMLElement)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "markAllRead" }),
    });
    setCount(0);
    setItems(items.map((i) => ({ ...i, readAt: new Date().toISOString() })));
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="bell-btn"
        aria-label={t("aria")}
      >
        <Bell size={18} />
        {count > 0 && <span className="bell-badge">{count > 9 ? "9+" : count}</span>}
      </button>
      {open && (
        <div className="bell-dropdown">
          <div className="bell-dropdown-header">
            <span>{t("title")}</span>
            {count > 0 && <button type="button" onClick={markAllRead}>{t("markAllRead")}</button>}
          </div>
          {items.length === 0 ? (
            <p className="muted" style={{ padding: 16, textAlign: "center", fontSize: 13 }}>{t("empty")}</p>
          ) : (
            items.slice(0, 20).map((n) => (
              <div key={n.id} className={`bell-item ${n.readAt ? "" : "bell-item-unread"}`}>
                <div className={n.readAt ? "" : "bell-item-title"}>{n.title}</div>
                {n.body && <div className="bell-item-body">{n.body}</div>}
                <div className="bell-item-time">
                  {new Date(n.createdAt).toLocaleString(locale, {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function NodeSystemNav({
  sections,
  pathname,
  tItems,
  tNodeSystem,
}: {
  sections: NavSection[];
  pathname: string;
  tItems: (key: string) => string;
  /** next-intl translator for `dashboard.nodeSystem` */
  tNodeSystem: (key: string) => string;
}) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [masterExpanded, setMasterExpanded] = useState(true);

  // Auto-expand section containing current path
  useEffect(() => {
    const newExpanded: Record<string, boolean> = {};
    let foundSection = false;
    for (const section of sections) {
      const sectionHasActive = section.items.some((item) => pathMatches(pathname, item.href));
      newExpanded[section.sectionKey] = sectionHasActive;
      if (sectionHasActive) foundSection = true;
    }
    if (foundSection) {
      setExpandedSections(newExpanded);
    }
  }, [pathname, sections]);

  const toggleSection = (sectionKey: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  if (!masterExpanded) {
    return (
      <div style={{ paddingLeft: 12, paddingRight: 12, paddingTop: 6, paddingBottom: 6 }}>
        <button
          type="button"
          onClick={() => setMasterExpanded(true)}
          style={{
            width: "100%",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "6px 12px",
            textAlign: "left",
            fontSize: 12,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            color: "var(--muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>Node System</span>
          <ChevronRight size={14} />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ paddingLeft: 12, paddingRight: 12, paddingTop: 6, paddingBottom: 6 }}>
        <button
          type="button"
          onClick={() => setMasterExpanded(false)}
          style={{
            width: "100%",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "6px 12px",
            textAlign: "left",
            fontSize: 12,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            color: "var(--muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>Node System</span>
          <ChevronDown size={14} style={{ transform: "rotate(-90deg)" }} />
        </button>
      </div>

      {sections.map((section) => {
        const isExpanded = expandedSections[section.sectionKey] ?? false;
        const sectionLabel = tNodeSystem(section.sectionKey);

        return (
          <div key={section.sectionKey}>
            <button
              type="button"
              onClick={() => toggleSection(section.sectionKey)}
              style={{
                width: "100%",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "6px 12px",
                textAlign: "left",
                fontSize: 12,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                color: "var(--muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>{sectionLabel}</span>
              <ChevronRight
                size={14}
                style={{
                  transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                }}
              />
            </button>

            {isExpanded && (
              <ul className="dashboard-nav-list" style={{ paddingLeft: 0 }}>
                {section.items.map((item) => {
                  const active = pathMatches(pathname, item.href);
                  return (
                    <li
                      key={item.href}
                      style={{
                        paddingLeft: item.icon ? 0 : 24,
                      }}
                    >
                      <Link
                        href={item.href as any}
                        className="dashboard-nav-link"
                        data-active={active ? "true" : "false"}
                        aria-current={active ? "page" : undefined}
                        style={{
                          fontSize: item.icon ? 14 : 13,
                          paddingLeft: item.icon ? 12 : 36,
                        }}
                      >
                        {item.icon && (
                          <span className="dashboard-nav-icon" aria-hidden>
                            {item.icon}
                          </span>
                        )}
                        {tNodeSystem(item.labelKey)}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SidebarFooterMenu({
  displayName,
  email,
  roleLabelText,
  isAdmin,
  tShell,
}: {
  displayName: string;
  email?: string;
  roleLabelText: string;
  isAdmin: boolean;
  tShell: (key: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as HTMLElement)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div ref={ref} className="dashboard-sidebar-footer">
      {open && (
        <div className="sidebar-footer-popup">
          {email && <p className="sidebar-footer-popup-email">{email}</p>}
          <div className="sidebar-footer-popup-divider" />
          <Link href="/dashboard/settings" className="sidebar-footer-popup-item" onClick={() => setOpen(false)}>
            <Settings size={16} strokeWidth={2} />
            {tShell("settings")}
          </Link>
          <Link href="/" className="sidebar-footer-popup-item" onClick={() => setOpen(false)}>
            <Home size={16} strokeWidth={2} />
            {tShell("siteHomeFooter")}
          </Link>
          <div className="sidebar-footer-popup-divider" />
          <button
            type="button"
            className="sidebar-footer-popup-item"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOut size={16} strokeWidth={2} />
            {tShell("signOut")}
          </button>
        </div>
      )}
      <button
        type="button"
        className="dashboard-footer-trigger"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="user-avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
          {(displayName || "?").charAt(0).toUpperCase()}
        </span>
        <span className="dashboard-footer-name">{displayName}</span>
        <span className={`dashboard-role-pill ${isAdmin ? "dashboard-role-pill-admin" : ""}`}>
          {roleLabelText}
        </span>
        <ChevronDown size={14} className="dashboard-footer-chevron" data-open={open ? "true" : "false"} />
      </button>
    </div>
  );
}

export function DashboardShell({
  children,
  displayName,
  email,
  role,
  isAdmin,
}: {
  children: ReactNode;
  displayName: string;
  email?: string;
  role: Role;
  isAdmin: boolean;
}) {
  const pathname = usePathname() ?? "/dashboard";
  const [open, setOpen] = useState(false);
  const navId = useId();
  const t = useTranslations("dashboard");
  const tShell = useTranslations("dashboard.shell");
  const tGroups = useTranslations("dashboard.groups");
  const tItems = useTranslations("dashboard.items");
  const tRoles = useTranslations("dashboard.roles");
  const tNodeSystem = useTranslations("dashboard.nodeSystem");

  const tSeg = (key: string) => {
    try { return t(`breadcrumbSegment.${key}`); } catch { return key; }
  };

  const crumbs = getBreadcrumbs(pathname, tSeg);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.documentElement.setAttribute("data-dashboard", "true");
    return () => document.documentElement.removeAttribute("data-dashboard");
  }, []);

  const roleLabelText = (() => {
    try { return tRoles(role); } catch { return role; }
  })();

  return (
    <div className="dashboard-app">
      <button
        type="button"
        className="dashboard-sidebar-toggle"
        aria-label={open ? tShell("closeMenu") : tShell("openMenu")}
        aria-expanded={open}
        aria-controls={navId}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
        <span>{tShell("consoleMenu")}</span>
      </button>

      {open ? (
        <button
          type="button"
          className="dashboard-sidebar-backdrop"
          aria-label={tShell("closeMenuBackdrop")}
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside id={navId} className="dashboard-sidebar" data-open={open ? "true" : "false"}>
        <div className="dashboard-sidebar-inner">
          <div className="dashboard-sidebar-search">
            <GlobalSearch />
          </div>

          <nav className="dashboard-nav" aria-label={tShell("navAria")}>
            {GROUP_DEFS.map((group, groupIndex) => {
              const visibleItems = group.items.filter((item) => {
                if (!item.roles) return true;
                return item.roles.includes(role);
              });
              if (visibleItems.length === 0) return null;

              // Special handling for groups with sections (nodeSystem)
              if (visibleItems.some((item) => item.sections)) {
                return (
                  <div key={group.titleKey} className="dashboard-nav-group">
                    {groupIndex > 0 && <div className="dashboard-nav-divider" />}
                    <NodeSystemNav
                      sections={visibleItems[0]?.sections || []}
                      pathname={pathname}
                      tItems={tItems}
                      tNodeSystem={tNodeSystem}
                    />
                  </div>
                );
              }

              // Standard nav group rendering
              return (
                <div key={group.titleKey} className="dashboard-nav-group">
                  {groupIndex > 0 && <div className="dashboard-nav-divider" />}
                  <ul className="dashboard-nav-list">
                    {visibleItems.map((item) => {
                      const active = pathMatches(pathname, item.href);
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href as any}
                            className="dashboard-nav-link"
                            data-active={active ? "true" : "false"}
                            aria-current={active ? "page" : undefined}
                          >
                            <span className="dashboard-nav-icon" aria-hidden>
                              {item.icon}
                            </span>
                            {tItems(item.labelKey)}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </nav>

          <SidebarFooterMenu
            displayName={displayName}
            email={email}
            roleLabelText={roleLabelText}
            isAdmin={isAdmin}
            tShell={tShell}
          />
        </div>
      </aside>

      <div className="dashboard-main" role="main" tabIndex={-1}>
        <header className="dashboard-topbar">
          <div className="dashboard-topbar-left">
            {crumbs.length > 0 ? (
              <nav aria-label={tShell("breadcrumbAria")}>
                <ol className="breadcrumb-list">
                  <li><Link href="/dashboard" className="muted">{tShell("breadcrumbRoot")}</Link></li>
                  {crumbs.map((c, i) => (
                    <li key={c.href} className="breadcrumb-separator">
                      <span className="breadcrumb-slash">/</span>
                      {i === crumbs.length - 1 ? (
                        <span className="breadcrumb-current">{c.label}</span>
                      ) : (
                        <Link href={c.href as any} className="muted">{c.label}</Link>
                      )}
                    </li>
                  ))}
                </ol>
              </nav>
            ) : (
              <span className="dashboard-topbar-title">{tShell("topTitle")}</span>
            )}
          </div>
          <div className="dashboard-topbar-right" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <NotificationBell />
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
