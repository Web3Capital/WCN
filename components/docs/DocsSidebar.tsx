"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Link } from "@/i18n/routing";
import { usePathname } from "next/navigation";
import type { ChapterEntry } from "@/lib/docs";
import {
  BookOpen, Search, Lightbulb, Settings, Layers,
  Globe, Bot, ShieldCheck, Coins, DoorOpen,
  Building2, Map, Trophy, Handshake, Archive,
} from "lucide-react";

const CHAPTER_ICONS: Record<string, React.ReactNode> = {
  "project-intro":    <BookOpen size={16} strokeWidth={1.8} />,
  "industry-problem": <Search size={16} strokeWidth={1.8} />,
  "solution":         <Lightbulb size={16} strokeWidth={1.8} />,
  "how-it-works":     <Settings size={16} strokeWidth={1.8} />,
  "network-arch":     <Layers size={16} strokeWidth={1.8} />,
  "node-system":      <Globe size={16} strokeWidth={1.8} />,
  "ai-agent":         <Bot size={16} strokeWidth={1.8} />,
  "pob":              <ShieldCheck size={16} strokeWidth={1.8} />,
  "business-model":   <Coins size={16} strokeWidth={1.8} />,
  "node-onboarding":  <DoorOpen size={16} strokeWidth={1.8} />,
  "governance":       <Building2 size={16} strokeWidth={1.8} />,
  "roadmap":          <Map size={16} strokeWidth={1.8} />,
  "why-wcn":          <Trophy size={16} strokeWidth={1.8} />,
  "join-wcn":         <Handshake size={16} strokeWidth={1.8} />,
  "resources":        <Archive size={16} strokeWidth={1.8} />,
};

export function DocsSidebar({
  chapters,
}: {
  chapters: ChapterEntry[];
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [drawerOpen, setDrawerOpen] = useState(false);

  const activeChapter = chapters.find(
    (ch) => ch.docs.some((d) => d.href === pathname)
  )?.slug;

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const toggle = useCallback((slug: string) => {
    setCollapsed((prev) => ({ ...prev, [slug]: !prev[slug] }));
  }, []);

  const nav = (
    <nav className="docs-sidebar-inner" aria-label="Documentation">
      <div className="docs-sidebar-header">
        <Link href="/wiki" className="docs-sidebar-logo">
          <span className="docs-sidebar-mark">W³</span>
          <span className="docs-sidebar-title">WCN Wiki</span>
        </Link>
      </div>

      <div className="docs-sidebar-chapters">
        {chapters.map((ch) => {
          const isOpen = collapsed[ch.slug] !== true;
          const isActive = ch.slug === activeChapter;

          return (
            <div key={ch.slug} className="docs-sidebar-group" data-active={isActive || undefined}>
              <button
                className="docs-sidebar-chapter"
                onClick={() => toggle(ch.slug)}
                aria-expanded={isOpen}
              >
                {CHAPTER_ICONS[ch.slug] && (
                  <span className="docs-sidebar-icon">{CHAPTER_ICONS[ch.slug]}</span>
                )}
                <span>{ch.title}</span>
                <svg
                  className="docs-sidebar-chevron"
                  data-open={isOpen || undefined}
                  width="16" height="16" viewBox="0 0 16 16" fill="none"
                >
                  <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {isOpen && (
                <div className="docs-sidebar-links">
                  {ch.docs.map((doc) => (
                    <Link
                      key={doc.href}
                      href={doc.href}
                      className={`docs-sidebar-link${doc.href === pathname ? " active" : ""}`}
                    >
                      {doc.meta.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );

  return (
    <>
      <button
        className="docs-mobile-trigger"
        onClick={() => setDrawerOpen(true)}
        aria-label="Open navigation"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span>Menu</span>
      </button>

      <aside className="docs-sidebar">{nav}</aside>

      {drawerOpen && (
        <div className="docs-drawer-backdrop" onClick={() => setDrawerOpen(false)}>
          <aside className="docs-drawer" onClick={(e) => e.stopPropagation()}>
            <button className="docs-drawer-close" onClick={() => setDrawerOpen(false)} aria-label="Close">
              ✕
            </button>
            {nav}
          </aside>
        </div>
      )}
    </>
  );
}
