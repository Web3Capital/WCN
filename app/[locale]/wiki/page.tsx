import { Link } from "@/i18n/routing";
import { getChapters } from "@/lib/docs";
import { getTranslations } from "next-intl/server";
import {
  BookOpen, Search, Lightbulb, Settings, Layers,
  Globe, Bot, ShieldCheck, Coins, DoorOpen,
  Building2, Map, Trophy, Handshake, Archive,
  ArrowUpRight,
} from "lucide-react";
import type { Metadata } from "next";

const CHAPTER_ICONS: Record<string, React.ReactNode> = {
  "project-intro":    <BookOpen size={22} strokeWidth={1.5} />,
  "industry-problem": <Search size={22} strokeWidth={1.5} />,
  "solution":         <Lightbulb size={22} strokeWidth={1.5} />,
  "how-it-works":     <Settings size={22} strokeWidth={1.5} />,
  "network-arch":     <Layers size={22} strokeWidth={1.5} />,
  "node-system":      <Globe size={22} strokeWidth={1.5} />,
  "ai-agent":         <Bot size={22} strokeWidth={1.5} />,
  "pob":              <ShieldCheck size={22} strokeWidth={1.5} />,
  "business-model":   <Coins size={22} strokeWidth={1.5} />,
  "node-onboarding":  <DoorOpen size={22} strokeWidth={1.5} />,
  "governance":       <Building2 size={22} strokeWidth={1.5} />,
  "roadmap":          <Map size={22} strokeWidth={1.5} />,
  "why-wcn":          <Trophy size={22} strokeWidth={1.5} />,
  "join-wcn":         <Handshake size={22} strokeWidth={1.5} />,
  "resources":        <Archive size={22} strokeWidth={1.5} />,
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("wiki");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function WikiLandingPage() {
  const chapters = getChapters();
  const t = await getTranslations("wiki");

  const totalPages = chapters.reduce((acc, ch) => acc + ch.docs.length, 0);

  return (
    <div className="docs-landing wiki-editorial">
      <header className="wiki-masthead">
        <div className="wiki-masthead-bar" aria-hidden>
          <span className="wiki-masthead-mark">№ 01</span>
          <span className="wiki-masthead-rule" />
          <span className="wiki-masthead-section">Wiki · Compendium</span>
          <span className="wiki-masthead-rule" />
          <span className="wiki-masthead-meta">Volume · MMXXVI</span>
        </div>
        <h1 className="wiki-masthead-title">
          {t.rich("heading", { em: (chunks) => <em>{chunks}</em> })}
        </h1>
        <p className="wiki-masthead-lede">{t("subtitle")}</p>
        <div className="wiki-masthead-stats">
          <span className="wiki-masthead-stat">
            <span className="wiki-masthead-stat-num">{String(chapters.length).padStart(2, "0")}</span>
            <span className="wiki-masthead-stat-label">Chapters</span>
          </span>
          <span className="wiki-masthead-stat-divider" aria-hidden />
          <span className="wiki-masthead-stat">
            <span className="wiki-masthead-stat-num">{totalPages}</span>
            <span className="wiki-masthead-stat-label">Articles</span>
          </span>
        </div>
      </header>

      <ol className="wiki-chapters">
        {chapters.map((ch, i) => {
          const firstDoc = ch.docs[0];
          const href = firstDoc?.href ?? "/wiki";
          const icon = CHAPTER_ICONS[ch.slug];
          const num = String(i + 1).padStart(2, "0");

          return (
            <li key={ch.slug} className="wiki-chapter-item">
              <Link href={href as any} className="wiki-chapter-card">
                <span className="wiki-chapter-num" aria-hidden>{num}</span>
                <div className="wiki-chapter-body">
                  <div className="wiki-chapter-head">
                    {icon && <span className="wiki-chapter-icon" aria-hidden>{icon}</span>}
                    <h2 className="wiki-chapter-title">{ch.title}</h2>
                  </div>
                  {ch.description && (
                    <p className="wiki-chapter-desc">{ch.description}</p>
                  )}
                  <div className="wiki-chapter-meta">
                    <span className="wiki-chapter-count">{ch.docs.length} {t("pages")}</span>
                    <ArrowUpRight size={14} className="wiki-chapter-arrow" aria-hidden />
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
