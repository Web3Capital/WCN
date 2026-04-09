"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Bot,
  ClipboardList,
  FolderKanban,
  Handshake,
  Home,
  Inbox,
  Landmark,
  LayoutDashboard,
  ListTodo,
  Bell,
  Mail,
  Menu,
  Network,
  Search,
  Rocket,
  Scale,
  ShieldCheck,
  Users,
  X
} from "lucide-react";
import type { Role } from "@prisma/client";

type NavItem = { href: string; label: string; icon: ReactNode; roles?: string[] };

const ADMIN_ROLES = new Set(["FOUNDER", "ADMIN"]);
const FINANCE_ROLES = new Set(["FOUNDER", "ADMIN", "FINANCE_ADMIN"]);
const REVIEWER_ROLES = new Set(["FOUNDER", "ADMIN", "REVIEWER"]);

const GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Overview",
    items: [
      { href: "/dashboard", label: "My Workspace", icon: <LayoutDashboard size={18} strokeWidth={2} /> }
    ]
  },
  {
    title: "Network",
    items: [
      { href: "/dashboard/nodes", label: "Nodes", icon: <Network size={18} strokeWidth={2} /> },
      { href: "/dashboard/projects", label: "Projects", icon: <FolderKanban size={18} strokeWidth={2} /> },
      { href: "/dashboard/capital", label: "Capital", icon: <Landmark size={18} strokeWidth={2} /> },
      { href: "/dashboard/deals", label: "Deal Room", icon: <Handshake size={18} strokeWidth={2} /> }
    ]
  },
  {
    title: "Work",
    items: [
      { href: "/dashboard/tasks", label: "Tasks", icon: <ListTodo size={18} strokeWidth={2} /> },
      { href: "/dashboard/agents", label: "Agents", icon: <Bot size={18} strokeWidth={2} /> }
    ]
  },
  {
    title: "Verification",
    items: [
      { href: "/dashboard/proof-desk", label: "Evidence Desk", icon: <ShieldCheck size={18} strokeWidth={2} />, roles: ["FOUNDER", "ADMIN", "REVIEWER", "RISK_DESK", "NODE_OWNER", "SERVICE_NODE"] },
      { href: "/dashboard/pob", label: "PoB Records", icon: <ShieldCheck size={18} strokeWidth={2} /> },
      { href: "/dashboard/disputes", label: "Disputes", icon: <AlertTriangle size={18} strokeWidth={2} />, roles: ["FOUNDER", "ADMIN", "REVIEWER", "RISK_DESK"] },
      { href: "/dashboard/settlement", label: "Settlement", icon: <Scale size={18} strokeWidth={2} /> }
    ]
  },
  {
    title: "Intelligence",
    items: [
      { href: "/dashboard/data", label: "Data Cockpit", icon: <BarChart3 size={18} strokeWidth={2} /> },
      { href: "/dashboard/risk", label: "Risk Console", icon: <AlertTriangle size={18} strokeWidth={2} /> }
    ]
  },
  {
    title: "Admin",
    items: [
      { href: "/dashboard/approvals", label: "Approvals", icon: <ShieldCheck size={18} strokeWidth={2} />, roles: ["FOUNDER", "ADMIN", "FINANCE_ADMIN", "REVIEWER", "RISK_DESK"] },
      { href: "/dashboard/applications", label: "Applications", icon: <Inbox size={18} strokeWidth={2} /> },
      { href: "/dashboard/users", label: "Users", icon: <Users size={18} strokeWidth={2} /> },
      { href: "/dashboard/admin/invites", label: "Invites", icon: <Mail size={18} strokeWidth={2} />, roles: ["FOUNDER", "ADMIN"] },
      { href: "/dashboard/audit", label: "Audit Log", icon: <ClipboardList size={18} strokeWidth={2} />, roles: ["FOUNDER", "ADMIN", "REVIEWER", "RISK_DESK"] }
    ]
  },
  {
    title: "Roadmap",
    items: [{ href: "/dashboard/assets", label: "Phase 3 · Assets", icon: <Rocket size={18} strokeWidth={2} /> }]
  }
];

function pathMatches(pathname: string, href: string) {
  const p = pathname.replace(/\/$/, "") || "/";
  const h = href.replace(/\/$/, "") || "/";
  if (h === "/dashboard") return p === "/dashboard";
  return p === h || p.startsWith(`${h}/`);
}

function getBreadcrumbs(pathname: string): { label: string; href: string }[] {
  const parts = pathname.replace(/^\/dashboard\/?/, "").split("/").filter(Boolean);
  if (parts.length === 0) return [];
  const crumbs: { label: string; href: string }[] = [];
  let href = "/dashboard";
  for (const part of parts) {
    href += `/${part}`;
    const label = part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, " ");
    crumbs.push({ label, href });
  }
  return crumbs;
}

function roleLabel(role: Role): string {
  const map: Record<string, string> = {
    FOUNDER: "Founder",
    ADMIN: "Admin",
    FINANCE_ADMIN: "Finance",
    NODE_OWNER: "Node Owner",
    PROJECT_OWNER: "Project Owner",
    CAPITAL_NODE: "Capital",
    SERVICE_NODE: "Service",
    REVIEWER: "Reviewer",
    RISK_DESK: "Risk Desk",
    AGENT_OWNER: "Agent Owner",
    OBSERVER: "Observer",
    SYSTEM: "System",
    USER: "Member",
  };
  return map[role] || role;
}

function GlobalSearch() {
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
        if (data.ok) setResults(data.results);
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
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, padding: "6px 10px" }}>
        <Search size={15} style={{ color: "var(--muted)", flexShrink: 0 }} />
        <input
          placeholder="Search nodes, projects, deals, tasks..."
          value={q}
          onChange={(e) => search(e.target.value)}
          onFocus={() => setOpen(true)}
          style={{ border: "none", background: "none", outline: "none", flex: 1, fontSize: 13, color: "var(--text)", padding: 0 }}
        />
      </div>
      {open && results.length > 0 && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8,
          boxShadow: "0 8px 24px rgba(0,0,0,.12)", zIndex: 100, maxHeight: 320, overflowY: "auto",
        }}>
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

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<{ id: string; title: string; body: string | null; readAt: string | null; createdAt: string }[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/notifications?unread=false")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setCount(d.unreadCount ?? 0);
          setItems(d.notifications ?? []);
        }
      })
      .catch(() => {});
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
        style={{ background: "none", border: "none", cursor: "pointer", padding: 4, position: "relative", color: "var(--muted)" }}
        aria-label="Notifications"
      >
        <Bell size={18} />
        {count > 0 && (
          <span style={{
            position: "absolute", top: -2, right: -4, background: "var(--red)", color: "#fff",
            borderRadius: 99, fontSize: 10, fontWeight: 700, padding: "1px 5px", lineHeight: 1.3,
          }}>
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0, width: 320,
          background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8,
          boxShadow: "0 8px 24px rgba(0,0,0,.12)", zIndex: 100, maxHeight: 380, overflowY: "auto",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderBottom: "1px solid var(--line)" }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>Notifications</span>
            {count > 0 && (
              <button onClick={markAllRead} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "var(--accent)" }}>
                Mark all read
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="muted" style={{ padding: 16, textAlign: "center", fontSize: 13 }}>No notifications.</p>
          ) : (
            items.slice(0, 20).map((n) => (
              <div
                key={n.id}
                style={{
                  padding: "8px 12px", borderBottom: "1px solid var(--line)", fontSize: 13,
                  background: n.readAt ? "transparent" : "color-mix(in oklab, var(--accent) 5%, transparent)",
                }}
              >
                <div style={{ fontWeight: n.readAt ? 400 : 600 }}>{n.title}</div>
                {n.body && <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{n.body}</div>}
                <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>{new Date(n.createdAt).toLocaleString()}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function DashboardShell({
  children,
  displayName,
  email,
  role,
  isAdmin
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
  const crumbs = getBreadcrumbs(pathname);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isRoleAdmin = ADMIN_ROLES.has(role);

  return (
    <div className="dashboard-app">
      <button
        type="button"
        className="dashboard-sidebar-toggle"
        aria-label={open ? "Close console menu" : "Open console menu"}
        aria-expanded={open}
        aria-controls={navId}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
        <span>Console menu</span>
      </button>

      {crumbs.length > 0 ? (
        <nav aria-label="Breadcrumb" className="dashboard-breadcrumb">
          <ol className="breadcrumb-list">
            <li><Link href="/dashboard" className="muted">Console</Link></li>
            {crumbs.map((c, i) => (
              <li key={c.href} className="breadcrumb-separator">
                <span className="breadcrumb-slash">/</span>
                {i === crumbs.length - 1 ? (
                  <span className="breadcrumb-current">{c.label}</span>
                ) : (
                  <Link href={c.href} className="muted">{c.label}</Link>
                )}
              </li>
            ))}
          </ol>
        </nav>
      ) : null}

      {open ? (
        <button
          type="button"
          className="dashboard-sidebar-backdrop"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside id={navId} className="dashboard-sidebar" data-open={open ? "true" : "false"}>
        <div className="dashboard-sidebar-inner">
          <div className="dashboard-sidebar-brand">
            <span className="dashboard-sidebar-title">WCN Console</span>
            <span className={`dashboard-role-pill ${isAdmin ? "dashboard-role-pill-admin" : ""}`}>
              {roleLabel(role)}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "-8px 0 0" }}>
            <span className="user-avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
              {(displayName || "?").charAt(0).toUpperCase()}
            </span>
            <p className="dashboard-sidebar-user muted" title={email} style={{ margin: 0 }}>
              {displayName}
            </p>
          </div>

          <div style={{ padding: "0 0 8px", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1 }}><GlobalSearch /></div>
            <NotificationBell />
          </div>

          <nav className="dashboard-nav" aria-label="Console">
            {GROUPS.map((group) => {
              const visibleItems = group.items.filter((item) => {
                if (!item.roles) return true;
                return item.roles.includes(role);
              });
              if (visibleItems.length === 0) return null;
              return (
                <div key={group.title} className="dashboard-nav-group">
                  <div className="dashboard-nav-heading">{group.title}</div>
                  <ul className="dashboard-nav-list">
                    {visibleItems.map((item) => {
                      const active = pathMatches(pathname, item.href);
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className="dashboard-nav-link"
                            data-active={active ? "true" : "false"}
                            aria-current={active ? "page" : undefined}
                          >
                            <span className="dashboard-nav-icon" aria-hidden>
                              {item.icon}
                            </span>
                            {item.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </nav>

          <div className="dashboard-sidebar-footer">
            <Link href="/account" className="dashboard-nav-link dashboard-nav-link-muted">
              <span className="dashboard-nav-icon" aria-hidden><Users size={16} strokeWidth={2} /></span>
              Account settings
            </Link>
            <Link href="/" className="dashboard-nav-link dashboard-nav-link-muted">
              <span className="dashboard-nav-icon" aria-hidden><Home size={16} strokeWidth={2} /></span>
              Site home
            </Link>
          </div>
        </div>
      </aside>

      <main id="main-content" className="dashboard-main" tabIndex={-1}>{children}</main>
    </div>
  );
}
