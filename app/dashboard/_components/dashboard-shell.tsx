"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import {
  Bot,
  ClipboardList,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  ListTodo,
  Menu,
  Network,
  Rocket,
  Scale,
  ShieldCheck,
  Users,
  X
} from "lucide-react";

type NavItem = { href: string; label: string; icon: ReactNode };

const GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Overview",
    items: [{ href: "/dashboard", label: "Home", icon: <LayoutDashboard size={18} strokeWidth={2} /> }]
  },
  {
    title: "Network & work",
    items: [
      { href: "/dashboard/nodes", label: "Nodes", icon: <Network size={18} strokeWidth={2} /> },
      { href: "/dashboard/projects", label: "Projects", icon: <FolderKanban size={18} strokeWidth={2} /> },
      { href: "/dashboard/tasks", label: "Tasks", icon: <ListTodo size={18} strokeWidth={2} /> }
    ]
  },
  {
    title: "Trust & intake",
    items: [
      { href: "/dashboard/pob", label: "PoB", icon: <ShieldCheck size={18} strokeWidth={2} /> },
      { href: "/dashboard/applications", label: "Applications", icon: <Inbox size={18} strokeWidth={2} /> },
      { href: "/dashboard/users", label: "Users", icon: <Users size={18} strokeWidth={2} /> }
    ]
  },
  {
    title: "Automation & settlement",
    items: [
      { href: "/dashboard/agents", label: "Agents", icon: <Bot size={18} strokeWidth={2} /> },
      { href: "/dashboard/settlement", label: "Settlement", icon: <Scale size={18} strokeWidth={2} /> },
      { href: "/dashboard/audit", label: "Audit log", icon: <ClipboardList size={18} strokeWidth={2} /> }
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

export function DashboardShell({
  children,
  displayName,
  email,
  isAdmin
}: {
  children: ReactNode;
  displayName: string;
  email?: string;
  isAdmin: boolean;
}) {
  const pathname = usePathname() ?? "/dashboard";
  const [open, setOpen] = useState(false);
  const navId = useId();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

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
              {isAdmin ? "Admin" : "Member"}
            </span>
          </div>
          <p className="dashboard-sidebar-user muted" title={email}>
            {displayName}
          </p>

          <nav className="dashboard-nav" aria-label="Console">
            {GROUPS.map((group) => (
              <div key={group.title} className="dashboard-nav-group">
                <div className="dashboard-nav-heading">{group.title}</div>
                <ul className="dashboard-nav-list">
                  {group.items.map((item) => {
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
            ))}
          </nav>

          <div className="dashboard-sidebar-footer">
            <Link href="/" className="dashboard-nav-link dashboard-nav-link-muted">
              ← Site home
            </Link>
          </div>
        </div>
      </aside>

      <main className="dashboard-main">{children}</main>
    </div>
  );
}
