import { Link } from "@/i18n/routing";
import { getChapters } from "@/lib/docs";
import { getTranslations } from "next-intl/server";
import {
  BookOpen, Search, Lightbulb, Settings, Layers,
  Globe, Bot, ShieldCheck, Coins, DoorOpen,
  Building2, Map, Trophy, Handshake, Archive,
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

  return (
    <div className="docs-landing">
      <header className="docs-landing-hero">
        <h1>{t("heading")}</h1>
        <p>{t("subtitle")}</p>
      </header>

      <div className="docs-landing-chapters">
        {chapters.map((ch) => {
          const firstDoc = ch.docs[0];
          const href = firstDoc?.href ?? "/wiki";
          const icon = CHAPTER_ICONS[ch.slug];

          return (
            <Link key={ch.slug} href={href as any} className="docs-landing-card">
              {icon && <span className="docs-landing-card-icon">{icon}</span>}
              <span className="docs-landing-card-title">{ch.title}</span>
              {ch.description && (
                <span className="docs-landing-card-desc">{ch.description}</span>
              )}
              <span className="docs-landing-card-count">{ch.docs.length} {t("pages")}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
