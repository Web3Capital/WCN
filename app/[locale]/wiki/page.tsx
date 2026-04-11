import { Link } from "@/i18n/routing";
import { getChapters } from "@/lib/docs";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

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

          return (
            <Link key={ch.slug} href={href as any} className="docs-landing-card">
              {ch.icon && <span className="docs-landing-card-icon">{ch.icon}</span>}
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
