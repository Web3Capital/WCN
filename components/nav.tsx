"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { Menu, X } from "lucide-react";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/nodes", label: "Node Network" },
  { href: "/docs", label: "Docs" }
];

export function Nav() {
  const pathname = usePathname() ?? "/";
  const normalizedPath = pathname.replace(/\/$/, "") || "/";
  const [mobileOpen, setMobileOpen] = useState(false);
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
          <Link className="button-secondary" href="/apply">
            Apply as a Node
          </Link>
        </nav>
      </div>
    </header>
  );
}
