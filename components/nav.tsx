"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Menu, Moon, Sun, X } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { isAdminRole } from "@/lib/permissions";

const primaryLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" }
] as const;

const networkLinks = [
  { href: "/nodes", label: "Node Network" },
  { href: "/pob", label: "PoB" }
] as const;

const resourceLinks = [
  { href: "/how-it-works", label: "How It Works" },
  { href: "/docs", label: "Docs" }
] as const;

function UserAvatar({ name }: { name: string }) {
  const letter = (name || "?").charAt(0).toUpperCase();
  return <span className="user-avatar">{letter}</span>;
}

function pathMatchesNav(path: string, href: string) {
  const p = path.replace(/\/$/, "") || "/";
  const h = href.replace(/\/$/, "") || "/";
  if (h === "/") return p === "/";
  if (h.startsWith("/docs")) return p === "/docs" || p.startsWith("/docs/");
  return p === h || p.startsWith(`${h}/`);
}

type MegaKey = "network" | "resources" | null;

export function Nav() {
  const pathname = usePathname() ?? "/";
  const normalizedPath = pathname.replace(/\/$/, "") || "/";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mega, setMega] = useState<MegaKey>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [lang, setLang] = useState<"en" | "zh">("en");
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const navId = useId();
  const networkPanelId = useId();
  const resourcesPanelId = useId();
  const accountPanelId = useId();
  const shellRef = useRef<HTMLDivElement>(null);
  const { data: session, status } = useSession();
  const authed = status === "authenticated";
  const isAdmin = authed && isAdminRole(session?.user?.role ?? "USER");

  const networkActive = networkLinks.some((l) => pathMatchesNav(normalizedPath, l.href));
  const resourcesActive = resourceLinks.some((l) => pathMatchesNav(normalizedPath, l.href));

  useEffect(() => {
    setMobileOpen(false);
    setMega(null);
    setAccountOpen(false);
  }, [normalizedPath]);

  useEffect(() => {
    const match = document.cookie.match(/(?:^|;\s*)wcn_lang=(en|zh)(?:;|$)/);
    setLang(match?.[1] === "zh" ? "zh" : "en");
    const themeMatch = document.cookie.match(/(?:^|;\s*)wcn_theme=(light|dark|system)(?:;|$)/);
    setTheme((themeMatch?.[1] as "light" | "dark" | "system") ?? "system");
  }, []);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (shellRef.current && !shellRef.current.contains(e.target as Node)) {
        setMega(null);
        setAccountOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMega(null);
        setAccountOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
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

  const displayName = session?.user?.name || session?.user?.email || "Account";
  const email = session?.user?.email;

  function toggleMega(key: MegaKey) {
    setMega((k) => (k === key ? null : key));
    setAccountOpen(false);
  }

  function openAccount() {
    setAccountOpen((v) => !v);
    setMega(null);
  }

  return (
    <header className="nav">
      <div className="container nav-inner" ref={shellRef}>
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
          {primaryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="nav-link-pill"
              aria-current={pathMatchesNav(normalizedPath, link.href) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}

          <div
            className="nav-dropdown-wrap"
            data-open={mega === "network" ? "true" : "false"}
          >
            <button
              type="button"
              className={`nav-dropdown-trigger${networkActive ? " nav-dropdown-trigger-active" : ""}`}
              aria-expanded={mega === "network"}
              aria-haspopup="true"
              aria-controls={networkPanelId}
              onClick={() => toggleMega("network")}
            >
              Network
              <ChevronDown size={16} className="nav-dropdown-chevron" aria-hidden />
            </button>
            <div
              id={networkPanelId}
              className="nav-dropdown-panel"
              hidden={mega !== "network"}
            >
              {networkLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="nav-dropdown-link"
                  aria-current={pathMatchesNav(normalizedPath, link.href) ? "page" : undefined}
                  onClick={() => setMega(null)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div
            className="nav-dropdown-wrap"
            data-open={mega === "resources" ? "true" : "false"}
          >
            <button
              type="button"
              className={`nav-dropdown-trigger${resourcesActive ? " nav-dropdown-trigger-active" : ""}`}
              aria-expanded={mega === "resources"}
              aria-haspopup="true"
              aria-controls={resourcesPanelId}
              onClick={() => toggleMega("resources")}
            >
              Resources
              <ChevronDown size={16} className="nav-dropdown-chevron" aria-hidden />
            </button>
            <div
              id={resourcesPanelId}
              className="nav-dropdown-panel"
              hidden={mega !== "resources"}
            >
              {resourceLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="nav-dropdown-link"
                  aria-current={pathMatchesNav(normalizedPath, link.href) ? "page" : undefined}
                  onClick={() => setMega(null)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="nav-utils">
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
          </div>

          <Link className="button-secondary nav-cta" href="/apply">
            Apply as a Node
          </Link>

          {authed ? (
            <div className="nav-account-wrap">
              <button
                type="button"
                className="nav-account-trigger"
                aria-expanded={accountOpen}
                aria-haspopup="true"
                aria-controls={accountPanelId}
                onClick={openAccount}
              >
                <UserAvatar name={displayName} />
                <ChevronDown size={16} className="nav-account-chevron" aria-hidden data-open={accountOpen ? "true" : "false"} />
              </button>
              <div
                id={accountPanelId}
                className="account-menu-panel account-menu-panel--nav"
                hidden={!accountOpen}
              >
                <div className="account-menu-head">
                  <p className="account-menu-name">{displayName}</p>
                  {email ? <p className="account-menu-email muted">{email}</p> : null}
                </div>
                <div className="account-menu-actions">
                  <Link
                    href="/dashboard"
                    className="account-menu-link"
                    onClick={() => setAccountOpen(false)}
                  >
                    {isAdmin ? "Admin console" : "Console"}
                  </Link>
                  <Link href="/account" className="account-menu-link" onClick={() => setAccountOpen(false)}>
                    Account settings
                  </Link>
                  <button
                    type="button"
                    className="account-menu-signout"
                    onClick={() => signOut({ callbackUrl: "/" })}
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Link className="button-secondary" href="/login">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
