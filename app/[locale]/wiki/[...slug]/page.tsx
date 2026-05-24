import { notFound, redirect } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { getAllDocs, getDocBySlug, getAdjacentDocs, getDocHeadings, getChapters, readingMinutes, getDocPosition } from "@/lib/docs";
import { DocsBreadcrumb } from "@/components/docs/DocsBreadcrumb";
import { DocsTableOfContents } from "@/components/docs/DocsTableOfContents";
import { DocsNav } from "@/components/docs/DocsNav";
import { Hero } from "@/components/docs/mdx/Hero";
import { Callout } from "@/components/docs/mdx/Callout";
import { CardGrid, Card } from "@/components/docs/mdx/CardGrid";
import { MetaGrid, Meta } from "@/components/docs/mdx/MetaGrid";
import { Steps, Step } from "@/components/docs/mdx/Steps";
import { Statement } from "@/components/docs/mdx/Statement";
import { Tabs, Tab } from "@/components/docs/mdx/Tabs";
import type { Metadata } from "next";
import { locales } from "@/i18n/config";

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXTAUTH_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
).replace(/\/$/, "");

const mdxComponents = {
  Hero,
  Callout,
  CardGrid,
  Card,
  MetaGrid,
  Meta,
  Steps,
  Step,
  Statement,
  Tabs,
  Tab,
};

export function generateStaticParams({ params }: { params: { locale: string } }) {
  return getAllDocs(params.locale).map((doc) => ({ slug: doc.slug }));
}

export async function generateMetadata(props: { params: Promise<{ slug: string[]; locale: string }> }): Promise<Metadata> {
  const params = await props.params;
  const decoded = params.slug.map((s) => decodeURIComponent(s));
  const doc = getDocBySlug(decoded, params.locale);
  if (!doc) return {};

  const locale = params.locale || "en";
  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = `${siteUrl}/${loc}${doc.href}`;
  }

  return {
    title: doc.meta.title,
    description: doc.meta.description,
    openGraph: {
      title: doc.meta.title,
      description: doc.meta.description,
      type: "article",
    },
    alternates: {
      canonical: `${siteUrl}/${locale}${doc.href}`,
      languages,
    },
  };
}

const LEGACY_MAP: Record<string, string> = {
  introduction: "project-intro",
  problem: "industry-problem",
  solution: "solution",
  mechanism: "how-it-works",
  pob: "pob",
  settlement: "node-onboarding",
  nodes: "node-system",
  agents: "ai-agent",
  governance: "governance",
};

export default async function WikiPage(props: { params: Promise<{ slug: string[]; locale: string }> }) {
  const params = await props.params;
  const decoded = params.slug.map((s) => decodeURIComponent(s));
  let doc = getDocBySlug(decoded, params.locale);

  if (!doc && decoded.length === 1) {
    const mapped = LEGACY_MAP[decoded[0]];
    if (mapped) {
      const chapters = getChapters(params.locale);
      const ch = chapters.find((c) => c.slug === mapped);
      if (ch?.docs[0]) redirect(ch.docs[0].href);
    }
  }

  if (!doc) notFound();

  const { prev, next } = getAdjacentDocs(doc, params.locale);
  const headings = getDocHeadings(doc.content);

  const { content } = await compileMDX({
    source: doc.content,
    components: mdxComponents,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug],
      },
    },
  });

  const crumbs = [
    { label: doc.chapterTitle, href: `/wiki/${doc.chapterSlug}` },
    { label: doc.meta.title },
  ];

  const isChapterOverview = doc.slug.length === 1;
  const position = getDocPosition(doc, params.locale);
  const sectionTotal = position ? Math.max(0, position.total - 1) : 0; // exclude index.mdx
  const minutes = readingMinutes(doc.content);
  const chapterNum = String(doc.meta.chapter).padStart(2, "0");
  const sectionNum = isChapterOverview ? null : String(doc.meta.order).padStart(2, "0");
  const markLabel = isChapterOverview ? `№ ${chapterNum}` : `№ ${chapterNum}·${sectionNum}`;
  const positionLabel = isChapterOverview
    ? `${sectionTotal} ${params.locale === "zh" ? "篇" : "articles"}`
    : params.locale === "zh"
      ? `第 ${doc.meta.order} / ${sectionTotal} 篇`
      : `Section ${doc.meta.order} of ${sectionTotal}`;
  const readLabel = params.locale === "zh" ? `${minutes} 分钟` : `${minutes} min read`;
  const updatedLabel = new Date(doc.mtimeMs).toLocaleDateString(
    params.locale === "zh" ? "zh-CN" : "en-US",
    { year: "numeric", month: "short", day: "numeric" },
  );

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: doc.meta.title,
    description: doc.meta.description ?? "",
    author: { "@type": "Organization", name: "Web3 Capital Network" },
    publisher: { "@type": "Organization", name: "Web3 Capital Network", logo: { "@type": "ImageObject", url: `${siteUrl}/icon.png` } },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${siteUrl}${doc.href}` },
  };

  return (
    <div className="docs-page-wrap">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      <article className="docs-article wiki-article">
        <DocsBreadcrumb items={crumbs} />

        <div className="wiki-article-bar" aria-label="Article metadata">
          <span className="wiki-article-mark">{markLabel}</span>
          <span className="wiki-article-rule" aria-hidden />
          <span className="wiki-article-chapter">{doc.chapterTitle}</span>
          <span className="wiki-article-rule" aria-hidden />
          <span className="wiki-article-readmeta">
            {readLabel}
            {positionLabel ? <> · {positionLabel}</> : null}
          </span>
        </div>

        <header className="docs-article-header wiki-article-header">
          <h1>{doc.meta.title}</h1>
          {doc.meta.description && (
            <p className="docs-article-desc wiki-article-lede">{doc.meta.description}</p>
          )}
        </header>

        <div className="wiki-article-updated">
          <span className="wiki-article-updated-label">
            {params.locale === "zh" ? "更新于" : "Updated"}
          </span>
          <time dateTime={new Date(doc.mtimeMs).toISOString()}>{updatedLabel}</time>
        </div>

        <div className="docs-article-body wiki-article-body">
          {content}
        </div>

        <DocsNav prev={prev} next={next} />
      </article>

      <DocsTableOfContents headings={headings} />
    </div>
  );
}
