"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { Menu, Moon, Sun, X } from "lucide-react";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/nodes", label: "Node Network" },
  { href: "/pob", label: "PoB" },
  { href: "/docs", label: "Docs" }
];

export function Nav() {
  const pathname = usePathname() ?? "/";
  const normalizedPath = pathname.replace(/\/$/, "") || "/";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lang, setLang] = useState<"en" | "zh">("en");
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const navId = useId();

  function isActive(href: string) {
    const normalizedHref = href.replace(/\/$/, "") || "/";
    if (normalizedHref === "/") return normalizedPath === "/";
    if (normalizedHref.startsWith("/docs")) return normalizedPath === "/docs" || normalizedPath.startsWith("/docs/");
    return normalizedPath === normalizedHref;
  }

  useEffect(() => {
    setMobileOpen(false);
  }, [normalizedPath]);

  useEffect(() => {
    const match = document.cookie.match(/(?:^|;\s*)wcn_lang=(en|zh)(?:;|$)/);
    setLang(match?.[1] === "zh" ? "zh" : "en");
    const themeMatch = document.cookie.match(/(?:^|;\s*)wcn_theme=(light|dark|system)(?:;|$)/);
    setTheme((themeMatch?.[1] as "light" | "dark" | "system") ?? "system");
  }, []);

  async function switchLang(next: "en" | "zh") {
    if (next === lang) return;
    setLang(next);
    await fetch("/api/lang", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lang: next })
    });
    window.location.reload();
  }

  async function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    await fetch("/api/theme", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: next })
    });
    window.location.reload();
  }

  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link href="/" className="brand">
          <span className="brand-mark" />
          <span>WCN</span>
        </Link>
        <button
          type="button"
          className="nav-toggle"
          aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={mobileOpen}
          aria-controls={navId}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
        <nav id={navId} className="nav-links" data-open={mobileOpen ? "true" : "false"}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
          <button
            type="button"
            className="theme-toggle"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            onClick={toggleTheme}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <div className="lang-toggle" role="group" aria-label="Language">
            <button
              type="button"
              className="lang-chip"
              aria-pressed={lang === "en"}
              onClick={() => switchLang("en")}
            >
              EN
            </button>
            <button
              type="button"
              className="lang-chip"
              aria-pressed={lang === "zh"}
              onClick={() => switchLang("zh")}
            >
              中文
            </button>
          </div>
          <Link className="button-secondary" href="/apply">
            Apply as a Node
          </Link>
        </nav>
      </div>
    </header>
  );
}
