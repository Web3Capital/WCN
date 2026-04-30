"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

interface SearchItem {
  title: string;
  description?: string;
  href: string;
  chapter: string;
  body: string;
}

export function DocsSearch({ items }: { items: SearchItem[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      // Intentional sync-on-prop pattern (close on navigate / reset on open).
      // React docs flag this as cascade risk; see issue 0002 for refactor plan.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery("");
      setSelected(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const results = query.trim().length < 2
    ? []
    : items.filter((item) => {
        const q = query.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          (item.description ?? "").toLowerCase().includes(q) ||
          item.body.toLowerCase().includes(q)
        );
      }).slice(0, 12);

  useEffect(() => {
    // Intentional sync-on-prop pattern (close on navigate / reset on open).
    // React docs flag this as cascade risk; see issue 0002 for refactor plan.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelected(0);
  }, [query]);

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router]
  );

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter" && results[selected]) {
      navigate(results[selected].href);
    }
  }

  if (!open) {
    return (
      <button className="docs-search-trigger" onClick={() => setOpen(true)}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span>Search docs…</span>
        <kbd>⌘K</kbd>
      </button>
    );
  }

  return (
    <div className="docs-search-overlay" onClick={() => setOpen(false)}>
      <div className="docs-search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="docs-search-input-wrap">
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            className="docs-search-input"
            type="text"
            placeholder="Search documentation…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <kbd className="docs-search-esc" onClick={() => setOpen(false)}>Esc</kbd>
        </div>

        {query.trim().length >= 2 && (
          <div className="docs-search-results">
            {results.length === 0 ? (
              <div className="docs-search-empty">No results for &ldquo;{query}&rdquo;</div>
            ) : (
              <ul>
                {results.map((item, i) => (
                  <li key={item.href}>
                    <button
                      className={`docs-search-item${i === selected ? " selected" : ""}`}
                      onClick={() => navigate(item.href)}
                      onMouseEnter={() => setSelected(i)}
                    >
                      <span className="docs-search-item-chapter">{item.chapter}</span>
                      <span className="docs-search-item-title">{item.title}</span>
                      {item.description && (
                        <span className="docs-search-item-desc">{item.description}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
