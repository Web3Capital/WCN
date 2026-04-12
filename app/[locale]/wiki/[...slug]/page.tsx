import { notFound, redirect } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { getAllDocs, getDocBySlug, getAdjacentDocs, getDocHeadings, getChapters } from "@/lib/docs";
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

export function generateStaticParams() {
  return getAllDocs().map((doc) => ({ slug: doc.slug }));
}

export function generateMetadata({ params }: { params: { slug: string[]; locale: string } }): Metadata {
  const decoded = params.slug.map((s) => decodeURIComponent(s));
  const doc = getDocBySlug(decoded);
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

export default async function WikiPage({ params }: { params: { slug: string[] } }) {
  const decoded = params.slug.map((s) => decodeURIComponent(s));
  let doc = getDocBySlug(decoded);

  if (!doc && decoded.length === 1) {
    const mapped = LEGACY_MAP[decoded[0]];
    if (mapped) {
      const chapters = getChapters();
      const ch = chapters.find((c) => c.slug === mapped);
      if (ch?.docs[0]) redirect(ch.docs[0].href);
    }
  }

  if (!doc) notFound();

  const { prev, next } = getAdjacentDocs(doc);
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
      <article className="docs-article">
        <DocsBreadcrumb items={crumbs} />

        <header className="docs-article-header">
          <h1>{doc.meta.title}</h1>
          {doc.meta.description && (
            <p className="docs-article-desc">{doc.meta.description}</p>
          )}
        </header>

        <div className="docs-article-body">
          {content}
        </div>

        <DocsNav prev={prev} next={next} />
      </article>

      <DocsTableOfContents headings={headings} />
    </div>
  );
}
