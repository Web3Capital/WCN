import React from "react";
import { getChapters, buildSearchIndex } from "@/lib/docs";
import { DocsSidebar } from "@/components/docs/DocsSidebar";
import { DocsSearch } from "@/components/docs/DocsSearch";
import { DocsProgress } from "@/components/docs/DocsProgress";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const chapters = getChapters();
  const searchItems = buildSearchIndex();

  return (
    <div className="docs-shell">
      <DocsProgress />
      <DocsSidebar chapters={chapters} />
      <div className="docs-main">
        <div className="docs-main-header">
          <DocsSearch items={searchItems} />
        </div>
        <div className="docs-main-body">
          {children}
        </div>
      </div>
    </div>
  );
}
