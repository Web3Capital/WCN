"use client";

import { usePathname as useNextPathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { isAdminRole } from "@/lib/permissions";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { locales, localeMetadata, type Locale } from "@/i18n/config";
import { ThemeToggle } from "@/components/theme-toggle";
import { WCNGlyph } from "@/components/brand/wcn-glyph";

function UserAvatar({ name }: { name: string }) {
  const letter = (name || "?").charAt(0).toUpperCase();
  return <span className="user-avatar">{letter}</span>;
}

function pathMatchesNav(path: string, href: string) {
  const stripped = path.replace(/^\/(en|zh|ja|ko|es|fr|de|pt|ar|ru)/, "") || "/";
  const p = stripped.replace(/\/$/, "") || "/";
  const h = href.replace(/\/$/, "") || "/";
  if (h === "/") return p === "/";
  if (h.startsWith("/wiki")) return p === "/wiki" || p.startsWith("/wiki/");
  return p === h || p.startsWith(`${h}/`);
}

type MegaKey = "network" | "resources" | null;

export function Nav() {
  const t = useTranslations("nav");
  const rawPathname = useNextPathname() ?? "/";
  const intlPathname = usePathname();
  const router = useRouter();
  const normalizedPath = rawPathname.replace(/\/$/, "") || "/";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mega, setMega] = useState<MegaKey>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const navId = useId();
  const networkPanelId = useId();
  const resourcesPanelId = useId();
  const accountPanelId = useId();
  const shellRef = useRef<HTMLDivElement>(null);
  const { data: session, status } = useSession();
  const authed = status === "authenticated";
  const isAdmin = authed && isAdminRole(session?.user?.role ?? "USER");

  const primaryLinks = [
    { href: "/" as const, label: t("home") },
    { href: "/about" as const, label: t("about") },
  ];

  const networkLinks = [
    { href: "/nodes" as const, label: t("nodeNetwork") },
    { href: "/pob" as const, label: t("pob") },
  ];

  const resourceLinks = [
    { href: "/how-it-works" as const, label: t("howItWorks") },
    { href: "/wiki" as const, label: t("wiki") },
  ];

  const networkActive = networkLinks.some((l) => pathMatchesNav(normalizedPath, l.href));
  const resourcesActive = resourceLinks.some((l) => pathMatchesNav(normalizedPath, l.href));

  useEffect(() => {
    // Intentional sync-on-prop pattern (close on navigate / reset on open).
    // React docs flag this as cascade risk; see issue 0002 for refactor plan.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false);
    setMega(null);
    setAccountOpen(false);
    setLangOpen(false);
  }, [normalizedPath]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (shellRef.current && !shellRef.current.contains(e.target as Node)) {
        setMega(null);
        setAccountOpen(false);
      }
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
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
        setLangOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const currentLocale = (rawPathname.match(/^\/(en|zh|ja|ko|es|fr|de|pt|ar|ru)(?:\/|$)/)?.[1] || "en") as Locale;

  function switchLocale(next: Locale) {
    setLangOpen(false);
    router.replace(intlPathname, { locale: next });
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
        <Link href="/" className="brand" aria-label="WCN — World Citizen Network">
          <span className="brand-mark">
            <WCNGlyph size={16} />
          </span>
          <span className="brand-wordmark">
            <span>WCN</span>
            <span className="brand-divider" aria-hidden />
            <span className="brand-tagline">Citizen Ledger</span>
          </span>
        </Link>
        <button
          type="button"
          className="nav-toggle"
          aria-label={mobileOpen ? t("closeNav") : t("openNav")}
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
              {t("network")}
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
              {t("resources")}
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
            <ThemeToggle />
            <div className="lang-toggle" ref={langRef}>
              <button
                type="button"
                className="lang-trigger"
                aria-expanded={langOpen}
                aria-haspopup="true"
                aria-label={t("language")}
                onClick={() => setLangOpen((v) => !v)}
              >
                <span className="lang-current">{localeMetadata[currentLocale].nativeName}</span>
                <ChevronDown size={14} className="lang-chevron" aria-hidden />
              </button>
              <div className="lang-dropdown" hidden={!langOpen}>
                {locales.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    className={`lang-option${loc === currentLocale ? " lang-option-active" : ""}`}
                    onClick={() => switchLocale(loc)}
                  >
                    <span className="lang-option-native">{localeMetadata[loc].nativeName}</span>
                    <span className="lang-option-name muted">{localeMetadata[loc].name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Link className="button-secondary nav-cta" href="/apply">
            {t("applyAsNode")}
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
                    {isAdmin ? t("adminConsole") : t("console")}
                  </Link>
                  <Link href="/account" className="account-menu-link" onClick={() => setAccountOpen(false)}>
                    {t("accountSettings")}
                  </Link>
                  <button
                    type="button"
                    className="account-menu-signout"
                    onClick={() => signOut({ callbackUrl: "/" })}
                  >
                    {t("signOut")}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Link className="button-secondary" href="/login">
              {t("signIn")}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
