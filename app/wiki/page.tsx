import Link from "next/link";
import { getChapters } from "@/lib/docs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wiki",
  description: "WCN 完整知识库 — 从项目介绍到系统架构，全面了解 Web3 Capital Network。",
};

export default function WikiLandingPage() {
  const chapters = getChapters();

  return (
    <div className="docs-landing">
      <header className="docs-landing-hero">
        <h1>WCN Wiki</h1>
        <p>
          从项目定义到系统架构，从节点机制到商业模式 — 全面了解 Web3 Capital Network 的设计与运作方式。
        </p>
      </header>

      <div className="docs-landing-chapters">
        {chapters.map((ch) => {
          const firstDoc = ch.docs[0];
          const href = firstDoc?.href ?? "/wiki";

          return (
            <Link key={ch.slug} href={href} className="docs-landing-card">
              {ch.icon && <span className="docs-landing-card-icon">{ch.icon}</span>}
              <span className="docs-landing-card-title">{ch.title}</span>
              {ch.description && (
                <span className="docs-landing-card-desc">{ch.description}</span>
              )}
              <span className="docs-landing-card-count">{ch.docs.length} pages</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
