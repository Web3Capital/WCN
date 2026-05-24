import React from "react";
import { getChapters, buildSearchIndex } from "@/lib/docs";
import { DocsSidebar } from "@/components/docs/DocsSidebar";
import { DocsSearch } from "@/components/docs/DocsSearch";
import { DocsProgress } from "@/components/docs/DocsProgress";

export default async function DocsLayout(
  props: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;

  const {
    children
  } = props;

  const { locale } = params;
  const chapters = getChapters(locale);
  const searchItems = buildSearchIndex(locale);

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
