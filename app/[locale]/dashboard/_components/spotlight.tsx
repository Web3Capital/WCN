"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "@/i18n/routing";
import {
  Bot,
  ClipboardList,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  ListTodo,
  Network,
  Rocket,
  Scale,
  ShieldCheck,
  Users
} from "lucide-react";

const PAGES = [
  { href: "/dashboard", label: "Console Home", icon: <LayoutDashboard size={16} /> },
  { href: "/dashboard/nodes", label: "Nodes", icon: <Network size={16} /> },
  { href: "/dashboard/projects", label: "Projects", icon: <FolderKanban size={16} /> },
  { href: "/dashboard/tasks", label: "Tasks", icon: <ListTodo size={16} /> },
  { href: "/dashboard/pob", label: "PoB Verification", icon: <ShieldCheck size={16} /> },
  { href: "/dashboard/node-system/applications", label: "Node Applications", icon: <Inbox size={16} /> },
  { href: "/dashboard/users", label: "Users", icon: <Users size={16} /> },
  { href: "/dashboard/agents", label: "Agents", icon: <Bot size={16} /> },
  { href: "/dashboard/settlement", label: "Settlement", icon: <Scale size={16} /> },
  { href: "/dashboard/audit", label: "Audit Log", icon: <ClipboardList size={16} /> },
  { href: "/dashboard/assets", label: "Phase 3 · Assets", icon: <Rocket size={16} /> }
];

export function Spotlight() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();

  const filtered = useMemo(() => {
    if (!query.trim()) return PAGES;
    const q = query.toLowerCase();
    return PAGES.filter((p) => p.label.toLowerCase().includes(q));
  }, [query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close]);

  function navigate(href: string) {
    router.push(href);
    close();
  }

  function onInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filtered[activeIndex]) {
      navigate(filtered[activeIndex].href);
    }
  }

  if (!open) return null;

  return (
    <div className="spotlight-backdrop" onClick={close}>
      <div className="spotlight-panel" onClick={(e) => e.stopPropagation()}>
        <input
          className="spotlight-input"
          placeholder="Search pages..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onInputKeyDown}
          autoFocus
        />
        <div className="spotlight-results">
          {filtered.map((page, i) => (
            <div
              key={page.href}
              className="spotlight-item"
              data-active={i === activeIndex ? "true" : "false"}
              onClick={() => navigate(page.href)}
              onMouseEnter={() => setActiveIndex(i)}
            >
              <span className="spotlight-item-icon">{page.icon}</span>
              {page.label}
            </div>
          ))}
          {filtered.length === 0 ? (
            <div style={{ padding: 16, textAlign: "center", color: "var(--muted)", fontSize: 14 }}>
              No results found.
            </div>
          ) : null}
        </div>
        <div className="spotlight-hint">
          <kbd style={{ padding: "2px 6px", borderRadius: 4, border: "1px solid var(--line)", fontSize: 11 }}>↑↓</kbd> navigate
          <span style={{ margin: "0 8px" }}>·</span>
          <kbd style={{ padding: "2px 6px", borderRadius: 4, border: "1px solid var(--line)", fontSize: 11 }}>↵</kbd> open
          <span style={{ margin: "0 8px" }}>·</span>
          <kbd style={{ padding: "2px 6px", borderRadius: 4, border: "1px solid var(--line)", fontSize: 11 }}>esc</kbd> close
        </div>
      </div>
    </div>
  );
}
