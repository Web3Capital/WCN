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
              aria-current={pathname === link.href ? "page" : undefined}
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
