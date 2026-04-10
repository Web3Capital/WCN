import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Bot,
  CheckCircle2,
  Cpu,
  Globe,
  Layers,
  Network,
  Scale,
  Sparkles,
  Target,
  TrendingUp,
  Wrench,
  XCircle,
} from "lucide-react";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "about" });
  return { title: t("title"), description: t("metaDesc") };
}

export default async function AboutPage() {
  const t = await getTranslations("about");
  const tNav = await getTranslations("nav");

  const pillars: { title: string; body: string; icon: ReactNode }[] = [
    {
      title: t("pillarNodeTitle"),
      body: t("pillarNodeBody"),
      icon: <Globe size={20} strokeWidth={2} aria-hidden />,
    },
    {
      title: t("pillarAgentTitle"),
      body: t("pillarAgentBody"),
      icon: <Bot size={20} strokeWidth={2} aria-hidden />,
    },
    {
      title: t("pillarPobTitle"),
      body: t("pillarPobBody"),
      icon: <BadgeCheck size={20} strokeWidth={2} aria-hidden />,
    },
  ];

  const whatIsBullets = [t("whatIsBullet1"), t("whatIsBullet2"), t("whatIsBullet3")];

  const whatIsNotBullets = [
    t("whatIsNotBullet1"),
    t("whatIsNotBullet2"),
    t("whatIsNotBullet3"),
    t("whatIsNotBullet4"),
    t("whatIsNotBullet5"),
    t("whatIsNotBullet6"),
  ];

  const windows: { title: string; body: string; icon: ReactNode }[] = [
    {
      title: t("window1Title"),
      body: t("window1Body"),
      icon: <Layers size={20} strokeWidth={2} aria-hidden />,
    },
    {
      title: t("window2Title"),
      body: t("window2Body"),
      icon: <Cpu size={20} strokeWidth={2} aria-hidden />,
    },
    {
      title: t("window3Title"),
      body: t("window3Body"),
      icon: <Target size={20} strokeWidth={2} aria-hidden />,
    },
    {
      title: t("window4Title"),
      body: t("window4Body"),
      icon: <TrendingUp size={20} strokeWidth={2} aria-hidden />,
    },
    {
      title: t("window5Title"),
      body: t("window5Body"),
      icon: <Wrench size={20} strokeWidth={2} aria-hidden />,
    },
  ];

  const structuralPillars: { title: string; body: string; icon: ReactNode }[] = [
    {
      title: t("struct1Title"),
      body: t("struct1Body"),
      icon: <Network size={22} strokeWidth={2} aria-hidden />,
    },
    {
      title: t("struct2Title"),
      body: t("struct2Body"),
      icon: <Bot size={22} strokeWidth={2} aria-hidden />,
    },
    {
      title: t("struct3Title"),
      body: t("struct3Body"),
      icon: <BadgeCheck size={22} strokeWidth={2} aria-hidden />,
    },
    {
      title: t("struct4Title"),
      body: t("struct4Body"),
      icon: <Scale size={22} strokeWidth={2} aria-hidden />,
    },
  ];

  const principles: { title: string; body: string }[] = [
    {
      title: t("principle1Title"),
      body: t("principle1Body"),
    },
    {
      title: t("principle2Title"),
      body: t("principle2Body"),
    },
    {
      title: t("principle3Title"),
      body: t("principle3Body"),
    },
    {
      title: t("principle4Title"),
      body: t("principle4Body"),
    },
  ];

  const measureSteps = [
    t("measureStep1"),
    t("measureStep2"),
    t("measureStep3"),
    t("measureStep4"),
    t("measureStep5"),
  ];

  return (
    <main className="about-page">
      <section className="section hero hero-orb about-hero">
        <div className="container about-hero-container">
          <div className="section-head about-hero-intro">
            <span className="eyebrow about-eyebrow">{t("eyebrow")}</span>
            <h1 className="about-hero-title">
              {t.rich("headline", {
                linebreak: () => <br />,
              })}
            </h1>
            <p className="muted hero-lede about-hero-lede">
              {t.rich("lede", {
                strong: (chunks) => <strong className="about-strong">{chunks}</strong>,
              })}
            </p>
          </div>

          <div className="about-hero-grid card-grid-animated">
            <div className="about-hero-copy">
              <p className="muted about-hero-sub">{t("subLede")}</p>
              <div className="about-hero-ctas">
                <Link href="/wiki/project-intro/1-1-wcn-是什么" className="button-secondary about-hero-link">
                  <BookOpen size={17} aria-hidden />
                  {t("wikiWhatIs")}
                </Link>
                <Link href="/wiki/project-intro/1-2-wcn-不是什么" className="button-secondary about-hero-link">
                  {t("wikiWhatIsNot")}
                </Link>
                <Link href="/how-it-works" className="button-secondary about-hero-link">
                  {tNav("howItWorks")}
                </Link>
              </div>
            </div>

            <div className="about-pillars-panel glass" aria-label={t("threePillars")}>
              <div className="about-pillars-head">
                <Sparkles size={20} className="about-pillars-icon" aria-hidden />
                <span>{t("threePillars")}</span>
              </div>
              <ul className="about-pillars-list">
                {pillars.map((p) => (
                  <li key={p.title} className="about-pillar-item">
                    <div className="about-pillar-icon">{p.icon}</div>
                    <div>
                      <div className="about-pillar-title">{p.title}</div>
                      <p className="about-pillar-body">{p.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-alt about-clarity">
        <div className="container">
          <div className="section-head about-section-head">
            <span className="eyebrow about-eyebrow">{t("definitionEyebrow")}</span>
            <h2 className="about-section-h2">{t("definitionTitle")}</h2>
            <p className="muted hero-lede about-section-lede">{t("definitionDesc")}</p>
          </div>
          <div className="about-split-board grid-2 card-grid-animated">
            <div className="about-split-slab about-split-slab--yes">
              <span className="about-split-watermark" aria-hidden>
                ✓
              </span>
              <div className="card about-dual-card about-dual-yes">
                <div className="about-dual-icon" aria-hidden>
                  <CheckCircle2 size={24} strokeWidth={2} />
                </div>
                <h3>{t("whatWcnIs")}</h3>
                <p className="muted about-dual-lede">{t("whatWcnIsLede")}</p>
                <ul className="about-list">
                  {whatIsBullets.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="about-split-slab about-split-slab--no">
              <span className="about-split-watermark" aria-hidden>
                ✕
              </span>
              <div className="card about-dual-card about-dual-no">
                <div className="about-dual-icon about-dual-icon-muted" aria-hidden>
                  <XCircle size={24} strokeWidth={2} />
                </div>
                <h3>{t("whatWcnIsNot")}</h3>
                <p className="muted about-dual-lede">{t("whatWcnIsNotLede")}</p>
                <ul className="about-list">
                  {whatIsNotBullets.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section about-windows">
        <div className="container">
          <div className="section-head about-section-head">
            <span className="eyebrow about-eyebrow">{t("whyNowEyebrow")}</span>
            <h2 className="about-section-h2">{t("whyNowTitle")}</h2>
            <p className="muted hero-lede about-section-lede">{t("whyNowDesc")}</p>
          </div>
          <div className="about-windows-grid card-grid-animated">
            {windows.map((w, i) => (
              <div key={w.title} className="about-window-card">
                <div className="about-window-icon">{w.icon}</div>
                <span className="about-window-index">{t("window", { n: i + 1 })}</span>
                <h3 className="about-window-title">{w.title}</h3>
                <p className="about-window-body">{w.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-alt about-structure">
        <div className="container">
          <div className="section-head about-section-head">
            <span className="eyebrow about-eyebrow">{t("diffEyebrow")}</span>
            <h2 className="about-section-h2">{t("diffTitle")}</h2>
            <p className="muted hero-lede about-section-lede">{t("diffDesc")}</p>
          </div>
          <div className="about-struct-grid card-grid-animated">
            {structuralPillars.map((item) => (
              <div key={item.title} className="about-struct-card">
                <div className="about-struct-icon">{item.icon}</div>
                <h3 className="about-struct-title">{item.title}</h3>
                <p className="about-struct-body">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section about-measure">
        <div className="container">
          <div className="card about-measure-card card-grid-animated">
            <div className="about-measure-inner">
              <div>
                <span className="eyebrow about-eyebrow about-measure-kicker">{t("measureEyebrow")}</span>
                <h2 className="about-measure-title">{t("measureTitle")}</h2>
                <p className="muted about-measure-lede">{t("measureDesc")}</p>
              </div>
              <ol className="about-measure-list">
                {measureSteps.map((step, i) => (
                  <li key={step} className="about-measure-step">
                    <span className="about-measure-num">{i + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-alt about-foundation">
        <div className="container">
          <div className="section-head about-section-head">
            <span className="eyebrow about-eyebrow">{t("foundationEyebrow")}</span>
            <h2 className="about-section-h2">{t("foundationTitle")}</h2>
            <p className="muted hero-lede about-section-lede">{t("foundationDesc")}</p>
          </div>
          <div className="grid-2 about-principles-grid card-grid-animated">
            {principles.map((row, i) => (
              <div key={row.title} className="card about-principle-card">
                <span className="about-principle-index">{i + 1}</span>
                <h3>{row.title}</h3>
                <p className="muted about-principle-body">{row.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-tight about-cta-section">
        <div className="container">
          <div className="about-cta-band">
            <div className="about-cta-copy">
              <h2 className="about-cta-title">{t("ctaTitle")}</h2>
              <p className="muted about-cta-desc">{t("ctaDesc")}</p>
            </div>
            <div className="about-cta-actions">
              <Link href="/wiki" className="button">
                <BookOpen size={18} aria-hidden />
                {t("openWiki")}
              </Link>
              <Link href="/wiki/solution/3-1-wcn-的整体解法" className="button-secondary">
                {t("systemSolution")}
              </Link>
              <Link href="/apply" className="button-secondary">
                {tNav("applyAsNode")}
                <ArrowRight size={18} aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
