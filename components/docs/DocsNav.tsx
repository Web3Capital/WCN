import React from "react";
import { Link } from "@/i18n/routing";
import type { DocEntry } from "@/lib/docs";

export function DocsNav({
  prev,
  next,
}: {
  prev: DocEntry | null;
  next: DocEntry | null;
}) {
  return (
    <div className="docs-page-nav">
      {prev ? (
        <Link href={prev.href} className="docs-page-nav-btn">
          <span className="docs-page-nav-label">← Previous</span>
          <span className="docs-page-nav-title">{prev.meta.title}</span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link href={next.href} className="docs-page-nav-btn docs-page-nav-next">
          <span className="docs-page-nav-label">Next →</span>
          <span className="docs-page-nav-title">{next.meta.title}</span>
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}
