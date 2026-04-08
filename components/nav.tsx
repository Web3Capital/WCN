"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/nodes", label: "Node Network" },
  { href: "/docs/introduction", label: "Docs" },
  { href: "/apply", label: "Apply" }
];

export function Nav() {
  const pathname = usePathname() ?? "/";
  const normalizedPath = pathname.replace(/\/$/, "") || "/";

  function isActive(href: string) {
    const normalizedHref = href.replace(/\/$/, "") || "/";
    if (normalizedHref === "/") return normalizedPath === "/";
    if (normalizedHref.startsWith("/docs")) return normalizedPath === "/docs" || normalizedPath.startsWith("/docs/");
    return normalizedPath === normalizedHref;
  }

  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link href="/" className="brand">
          <span className="brand-mark" />
          <span>WCN</span>
        </Link>
        <nav className="nav-links">
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
