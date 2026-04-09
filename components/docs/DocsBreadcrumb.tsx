import React from "react";
import Link from "next/link";

export function DocsBreadcrumb({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav className="docs-breadcrumb" aria-label="Breadcrumb">
      <ol>
        <li>
          <Link href="/docs">Docs</Link>
        </li>
        {items.map((item, i) => (
          <li key={i}>
            <span className="docs-breadcrumb-sep" aria-hidden="true">/</span>
            {item.href ? (
              <Link href={item.href}>{item.label}</Link>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
