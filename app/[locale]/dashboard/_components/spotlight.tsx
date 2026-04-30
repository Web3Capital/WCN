"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "@/i18n/routing";
import {
  Bot,
  ClipboardList,
  CornerDownLeft,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  ListTodo,
  Network,
  Rocket,
  Scale,
  Search,
  ShieldCheck,
  Users
} from "lucide-react";
import { WCNGlyph } from "@/components/brand/wcn-glyph";

type LedgerKey = "node" | "deal" | "settle" | "console";
type Page = {
  href: string;
  label: string;
  icon: React.ReactNode;
  ledger: LedgerKey;
};

const PAGES: Page[] = [
  { href: "/dashboard", label: "Console Home", icon: <LayoutDashboard size={16} strokeWidth={1.6} />, ledger: "console" },
  { href: "/dashboard/nodes", label: "Nodes Registry", icon: <Network size={16} strokeWidth={1.6} />, ledger: "node" },
  { href: "/dashboard/node-system/applications", label: "Node Applications", icon: <Inbox size={16} strokeWidth={1.6} />, ledger: "node" },
  { href: "/dashboard/users", label: "Users & Members", icon: <Users size={16} strokeWidth={1.6} />, ledger: "node" },
  { href: "/dashboard/projects", label: "Projects", icon: <FolderKanban size={16} strokeWidth={1.6} />, ledger: "deal" },
  { href: "/dashboard/tasks", label: "Tasks", icon: <ListTodo size={16} strokeWidth={1.6} />, ledger: "deal" },
  { href: "/dashboard/agents", label: "Agents", icon: <Bot size={16} strokeWidth={1.6} />, ledger: "deal" },
  { href: "/dashboard/pob", label: "PoB Verification", icon: <ShieldCheck size={16} strokeWidth={1.6} />, ledger: "settle" },
  { href: "/dashboard/settlement", label: "Settlement", icon: <Scale size={16} strokeWidth={1.6} />, ledger: "settle" },
  { href: "/dashboard/audit", label: "Audit Log", icon: <ClipboardList size={16} strokeWidth={1.6} />, ledger: "settle" },
  { href: "/dashboard/assets", label: "Phase 3 · Assets", icon: <Rocket size={16} strokeWidth={1.6} />, ledger: "console" }
];

const LEDGER_LABELS: Record<LedgerKey, string> = {
  console: "Console",
  node: "Ledger 01 · Registry",
  deal: "Ledger 02 · Capital",
  settle: "Ledger 03 · Settlement",
};

const LEDGER_ORDER: LedgerKey[] = ["console", "node", "deal", "settle"];

export function Spotlight() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();

  const filtered = useMemo(() => {
    if (!query.trim()) return PAGES;
    const q = query.toLowerCase();
    return PAGES.filter((p) => p.label.toLowerCase().includes(q) || p.href.toLowerCase().includes(q));
  }, [query]);

  const grouped = useMemo(() => {
    const groups: Record<LedgerKey, Page[]> = { console: [], node: [], deal: [], settle: [] };
    filtered.forEach((p) => groups[p.ledger].push(p));
    return groups;
  }, [filtered]);

  useEffect(() => {
    // Intentional sync-on-prop pattern (close on navigate / reset on open).
    // React docs flag this as cascade risk; see issue 0002 for refactor plan.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  let runningIndex = 0;

  return (
    <div className="spotlight-backdrop" onClick={close} role="dialog" aria-modal="true" aria-label="Sovereign command palette">
      <div className="spotlight-panel" onClick={(e) => e.stopPropagation()}>
        <div className="spotlight-header">
          <span className="spotlight-header-mark">
            <WCNGlyph size={11} />
          </span>
          <span>Sovereign Console</span>
          <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)" }}>
            {filtered.length} {filtered.length === 1 ? "match" : "matches"}
          </span>
        </div>

        <div className="spotlight-input-wrap">
          <Search size={18} strokeWidth={1.6} />
          <input
            className="spotlight-input"
            placeholder="Search the network — pages, nodes, ledgers…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKeyDown}
            autoFocus
            aria-label="Search command palette"
          />
        </div>

        <div className="spotlight-results">
          {filtered.length === 0 ? (
            <div className="spotlight-empty">
              <div>No matches in the registry</div>
              <span className="spotlight-empty-mono">try &ldquo;nodes&rdquo;, &ldquo;settlement&rdquo;, or &ldquo;audit&rdquo;</span>
            </div>
          ) : (
            LEDGER_ORDER.map((key) => {
              const pages = grouped[key];
              if (pages.length === 0) return null;
              return (
                <div key={key}>
                  <div className="spotlight-group-label">{LEDGER_LABELS[key]}</div>
                  {pages.map((page) => {
                    const i = runningIndex++;
                    return (
                      <div
                        key={page.href}
                        className="spotlight-item"
                        data-active={i === activeIndex ? "true" : "false"}
                        data-ledger={page.ledger}
                        onClick={() => navigate(page.href)}
                        onMouseEnter={() => setActiveIndex(i)}
                      >
                        <span className="spotlight-item-icon">{page.icon}</span>
                        <span className="spotlight-item-label">
                          <span>{page.label}</span>
                          <span className="spotlight-item-path">{page.href}</span>
                        </span>
                        <CornerDownLeft size={14} strokeWidth={1.6} className="spotlight-item-arrow" />
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        <div className="spotlight-hint">
          <span className="kbd">↑</span><span className="kbd">↓</span> navigate
          <span className="spotlight-hint-sep" />
          <span className="kbd">↵</span> open
          <span className="spotlight-hint-sep" />
          <span className="kbd">esc</span> close
          <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)" }}>
            <span className="kbd">⌘</span><span className="kbd">K</span> to toggle
          </span>
        </div>
      </div>
    </div>
  );
}
