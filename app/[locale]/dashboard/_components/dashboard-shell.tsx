"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
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

type GroupTitleKey = "overview" | "network" | "work" | "verification" | "intelligence" | "admin" | "platform";
type ItemLabelKey = "myWorkspace" | "nodes" | "projects" | "capital" | "dealRoom" | "matches" | "tasks" | "agents" | "evidenceDesk" | "myPob" | "disputes" | "settlement" | "dataCockpit" | "riskConsole" | "reputation" | "approvals" | "users" | "invites" | "auditLog" | "proposals" | "campaigns" | "apiKeys" | "ingestion";

type NavDef = {
  titleKey: GroupTitleKey;
  items: { href: string; labelKey: ItemLabelKey; icon: ReactNode; roles?: Role[]; isContextSwitch?: boolean }[];
};

// ── Node System: 15 sections, 5 layers (flat — no sub-items in sidebar) ─────
type NodeSystemLayer = "admission" | "operations" | "management" | "riskControl" | "system";
type NodeSystemNavItem = { href: string; labelKey: string; icon: ReactNode; layer: NodeSystemLayer };

const NODE_SYSTEM_NAV: NodeSystemNavItem[] = [
  // Layer 1: 准入层
  { href: "/dashboard/node-system", labelKey: "nsOverview", icon: <LayoutDashboard size={18} strokeWidth={2} />, layer: "admission" },
  { href: "/dashboard/node-system/applications", labelKey: "nsApplications", icon: <Inbox size={18} strokeWidth={2} />, layer: "admission" },
  { href: "/dashboard/node-system/registry", labelKey: "nsRegistry", icon: <Network size={18} strokeWidth={2} />, layer: "admission" },
  { href: "/dashboard/node-system/territory", labelKey: "nsTerritory", icon: <Map size={18} strokeWidth={2} />, layer: "admission" },
  { href: "/dashboard/node-system/members", labelKey: "nsMembers", icon: <Users size={18} strokeWidth={2} />, layer: "admission" },
  { href: "/dashboard/node-system/onboarding", labelKey: "nsOnboarding", icon: <Rocket size={18} strokeWidth={2} />, layer: "admission" },
  // Layer 2: 经营层
  { href: "/dashboard/node-system/pipeline", labelKey: "nsPipeline", icon: <FolderKanban size={18} strokeWidth={2} />, layer: "operations" },
  { href: "/dashboard/node-system/collaboration", labelKey: "nsCollaboration", icon: <Handshake size={18} strokeWidth={2} />, layer: "operations" },
  { href: "/dashboard/node-system/pob", labelKey: "nsPob", icon: <ShieldCheck size={18} strokeWidth={2} />, layer: "operations" },
  // Layer 3: 管理层
  { href: "/dashboard/node-system/scorecard", labelKey: "nsScorecard", icon: <BarChart3 size={18} strokeWidth={2} />, layer: "management" },
  { href: "/dashboard/node-system/actions", labelKey: "nsActions", icon: <Zap size={18} strokeWidth={2} />, layer: "management" },
  { href: "/dashboard/node-system/revenue", labelKey: "nsRevenue", icon: <DollarSign size={18} strokeWidth={2} />, layer: "management" },
  { href: "/dashboard/node-system/reports", labelKey: "nsReports", icon: <FileText size={18} strokeWidth={2} />, layer: "management" },
  // Layer 4: 风控层
  { href: "/dashboard/node-system/risk", labelKey: "nsRisk", icon: <AlertTriangle size={18} strokeWidth={2} />, layer: "riskControl" },
  // Layer 5: 系统层
  { href: "/dashboard/node-system/settings", labelKey: "nsSettings", icon: <Settings size={18} strokeWidth={2} />, layer: "system" },
];

const NODE_SYSTEM_LAYER_ORDER: NodeSystemLayer[] = ["admission", "operations", "management", "riskControl", "system"];

const NODE_SYSTEM_ROLES: Role[] = ["FOUNDER", "ADMIN", "NODE_OWNER", "REVIEWER", "RISK_DESK"];

const GROUP_DEFS: NavDef[] = [
  {
    titleKey: "overview",
    items: [
      { href: "/dashboard", labelKey: "myWorkspace", icon: <LayoutDashboard size={18} strokeWidth={2} /> },
      { href: "/dashboard/node-system", labelKey: "nodes", icon: <Network size={18} strokeWidth={2} />, roles: NODE_SYSTEM_ROLES, isContextSwitch: true },
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
      { href: "/dashboard/pob", labelKey: "myPob", icon: <ListChecks size={18} strokeWidth={2} /> },
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
      { href: "/dashboard/users", labelKey: "users", icon: <Users size={18} strokeWidth={2} />, roles: ["FOUNDER", "ADMIN"] },
      { href: "/dashboard/admin/invites", labelKey: "invites", icon: <Mail size={18} strokeWidth={2} />, roles: ["FOUNDER", "ADMIN"] },
      { href: "/dashboard/audit", labelKey: "auditLog", icon: <ClipboardList size={18} strokeWidth={2} />, roles: ["FOUNDER", "ADMIN", "REVIEWER", "RISK_DESK"] },
    ],
  },
  {
    titleKey: "platform",
    items: [
      { href: "/dashboard/governance", labelKey: "proposals", icon: <Vote size={18} strokeWidth={2} /> },
      { href: "/dashboard/campaigns", labelKey: "campaigns", icon: <Megaphone size={18} strokeWidth={2} />, roles: ["FOUNDER", "ADMIN"] },
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

function NodeSystemSidebar({
  pathname,
  tNodeSystem,
  onBack,
}: {
  pathname: string;
  tNodeSystem: (key: string) => string;
  onBack: () => void;
}) {
  const grouped = NODE_SYSTEM_LAYER_ORDER.map((layer) => ({
    layer,
    items: NODE_SYSTEM_NAV.filter((item) => item.layer === layer),
  }));

  return (
    <div>
      <button type="button" className="dashboard-sidebar-back" onClick={onBack}>
        <ArrowLeft size={16} />
        <span>{tNodeSystem("backToDashboard")}</span>
      </button>
      <div className="dashboard-sidebar-context-header">
        <Network size={18} strokeWidth={2} />
        <span>{tNodeSystem("toggle")}</span>
      </div>
      {grouped.map(({ layer, items }) => (
        <div key={layer} className="dashboard-nav-group">
          <div className="dashboard-nav-layer-label">{tNodeSystem(`layer_${layer}`)}</div>
          <ul className="dashboard-nav-list">
            {items.map((item) => {
              const active = pathMatches(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href as any}
                    className="dashboard-nav-link"
                    data-active={active ? "true" : "false"}
                    aria-current={active ? "page" : undefined}
                  >
                    <span className="dashboard-nav-icon" aria-hidden>{item.icon}</span>
                    {tNodeSystem(item.labelKey)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
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
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sidebarContext, setSidebarContext] = useState<"main" | "nodeSystem">(
    stripLocaleFromPath(pathname).startsWith("/dashboard/node-system") ? "nodeSystem" : "main",
  );
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

  // Auto-switch sidebar context based on pathname
  useEffect(() => {
    setOpen(false);
    const bare = stripLocaleFromPath(pathname);
    setSidebarContext(bare.startsWith("/dashboard/node-system") ? "nodeSystem" : "main");
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
            {sidebarContext === "nodeSystem" ? (
              <NodeSystemSidebar
                pathname={pathname}
                tNodeSystem={tNodeSystem}
                onBack={() => { setSidebarContext("main"); router.push("/dashboard"); }}
              />
            ) : (
              GROUP_DEFS.map((group, groupIndex) => {
                const visibleItems = group.items.filter((item) => {
                  if (!item.roles) return true;
                  return item.roles.includes(role);
                });
                if (visibleItems.length === 0) return null;

                return (
                  <div key={group.titleKey} className="dashboard-nav-group">
                    {groupIndex > 0 && <div className="dashboard-nav-divider" />}
                    <ul className="dashboard-nav-list">
                      {visibleItems.map((item) => {
                        const active = pathMatches(pathname, item.href);
                        if (item.isContextSwitch) {
                          return (
                            <li key={item.href}>
                              <button
                                type="button"
                                className="dashboard-nav-link"
                                data-active="false"
                                data-context-switch="true"
                                onClick={() => { setSidebarContext("nodeSystem"); router.push(item.href); }}
                              >
                                <span className="dashboard-nav-icon" aria-hidden>{item.icon}</span>
                                {tItems(item.labelKey)}
                                <ChevronRight size={14} className="dashboard-nav-switch-arrow" />
                              </button>
                            </li>
                          );
                        }
                        return (
                          <li key={item.href}>
                            <Link
                              href={item.href as any}
                              className="dashboard-nav-link"
                              data-active={active ? "true" : "false"}
                              aria-current={active ? "page" : undefined}
                            >
                              <span className="dashboard-nav-icon" aria-hidden>{item.icon}</span>
                              {tItems(item.labelKey)}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })
            )}
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
