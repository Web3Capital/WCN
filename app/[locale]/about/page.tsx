import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

// Phase 2 / ADR-MR-001: static marketing page, revalidate daily.
export const dynamic = "force-static";
export const revalidate = 86400;

import { Link } from "@/i18n/routing";
import { getWikiHref } from "@/lib/wiki-link";
import type { ReactNode } from "react";
import {
  BadgeCheck,
  BookOpen,
  Bot,
  Globe,
  Network,
  Scale,
  Sparkles,
} from "lucide-react";
import { VoltageCallout } from "@/components/brand/voltage-callout";
import { EditorialMasthead } from "@/components/brand/editorial-masthead";
import { FormalDefinition } from "@/components/brand/formal-definition";
import { WhyNowTimeline } from "@/components/brand/why-now-timeline";
import { ArchitectureLayers } from "@/components/brand/architecture-layers";
import { GenesisPullQuote } from "@/components/brand/genesis-pull-quote";
import { AnimationBudget } from "@/components/brand/animation-budget";
import { SectionHead } from "@/components/marketing/section-head";
import { DualSlab } from "@/components/marketing/dual-slab";

export async function generateMetadata(
  props: {
    params: Promise<{ locale: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;

  const {
    locale
  } = params;

  const t = await getTranslations({ locale, namespace: "about" });
  return { title: t("title"), description: t("metaDesc") };
}

export default async function AboutPage() {
  const t = await getTranslations("about");
  const tNav = await getTranslations("nav");
  const tCommon = await getTranslations("common");
  const locale = await getLocale();

  const pillars: { title: string; body: string; icon: ReactNode }[] = [
    { title: t("pillarNodeTitle"), body: t("pillarNodeBody"), icon: <Globe size={20} strokeWidth={1.5} aria-hidden /> },
    { title: t("pillarAgentTitle"), body: t("pillarAgentBody"), icon: <Bot size={20} strokeWidth={1.5} aria-hidden /> },
    { title: t("pillarPobTitle"), body: t("pillarPobBody"), icon: <BadgeCheck size={20} strokeWidth={1.5} aria-hidden /> },
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

  const timeline = [
    { year: t("year2018"), body: t("year2018Body") },
    { year: t("year2020"), body: t("year2020Body") },
    { year: t("year2022"), body: t("year2022Body") },
    { year: t("year2024"), body: t("year2024Body") },
    { year: t("year2026"), body: t("year2026Body"), highlight: true },
  ];

  const variables = [
    { letter: "I", label: t("formalI") },
    { letter: "N", label: t("formalN") },
    { letter: "R", label: t("formalR") },
    { letter: "D", label: t("formalD") },
    { letter: "T", label: t("formalT") },
    { letter: "P", label: t("formalP") },
    { letter: "S", label: t("formalS") },
    { letter: "G", label: t("formalG") },
    { letter: "A", label: t("formalA") },
    { letter: "L", label: t("formalL") },
    { letter: "X", label: t("formalX") },
  ];

  const layers = [
    { n: 1, label: t("archLayer1"), sub: t("archLayer1Sub"), flow: "POST /api/pob — RSC route handler" },
    { n: 2, label: t("archLayer2"), sub: t("archLayer2Sub"), flow: "requirePermission(create, pob) + ownership scope" },
    { n: 3, label: t("archLayer3"), sub: t("archLayer3Sub"), flow: "PolicyMachine.evaluate → ledger.write(POB_CREATED)" },
    { n: 4, label: t("archLayer4"), sub: t("archLayer4Sub"), flow: "outbox.enqueue → emit { type: 'pob.created', v: 1 }" },
    { n: 5, label: t("archLayer5"), sub: t("archLayer5Sub"), flow: "Postgres tx commits — Outbox processor drains" },
  ];

  const structuralPillars: { title: string; body: string; icon: ReactNode }[] = [
    { title: t("struct1Title"), body: t("struct1Body"), icon: <Network size={22} strokeWidth={1.5} aria-hidden /> },
    { title: t("struct2Title"), body: t("struct2Body"), icon: <Bot size={22} strokeWidth={1.5} aria-hidden /> },
    { title: t("struct3Title"), body: t("struct3Body"), icon: <BadgeCheck size={22} strokeWidth={1.5} aria-hidden /> },
    { title: t("struct4Title"), body: t("struct4Body"), icon: <Scale size={22} strokeWidth={1.5} aria-hidden /> },
  ];

  const measureSteps = [
    { roman: t("measureRoman1"), body: t("measureStep1") },
    { roman: t("measureRoman2"), body: t("measureStep2") },
    { roman: t("measureRoman3"), body: t("measureStep3") },
    { roman: t("measureRoman4"), body: t("measureStep4") },
    { roman: t("measureRoman5"), body: t("measureStep5") },
  ];

  return (
    <main className="about-page about-page-cinematic">
      <AnimationBudget />

      {/* ═══ MASTHEAD — feature article opening ═══════════════ */}
      <EditorialMasthead
        issueNumber="№ 02"
        section={tNav("about")}
        issueDate={tCommon("editorial.volumeIssue")}
        kicker={t("mastheadKicker")}
        title={t.rich("headline", {
          linebreak: () => <br />,
          em: (chunks) => <em>{chunks}</em>,
        })}
        lede={t.rich("lede", {
          strong: (chunks) => <strong>{chunks}</strong>,
        })}
        ledeDropcap
      />

      {/* ═══ Three pillars dropcap intro (no number — prologue) ═══ */}
      <section className="section about-intro-spread">
        <div className="container">
          <div className="about-intro-grid">
            <div className="about-intro-prose">
              <p className="about-intro-prose-body">{t("subLede")}</p>
              <div className="about-intro-actions">
                <Link href={getWikiHref(locale, "project-intro", 1)} className="button-secondary">
                  <BookOpen size={17} aria-hidden />
                  {t("wikiWhatIs")}
                </Link>
                <Link href={getWikiHref(locale, "project-intro", 2)} className="button-secondary">
                  {t("wikiWhatIsNot")}
                </Link>
                <Link href="/how-it-works" className="button-secondary">
                  {tNav("howItWorks")}
                </Link>
              </div>
            </div>

            <aside className="about-pillars-panel-v2" aria-label={t("threePillars")}>
              <div className="about-pillars-head-v2">
                <Sparkles size={18} aria-hidden />
                <span>{t("threePillars")}</span>
              </div>
              <ul className="about-pillars-list-v2">
                {pillars.map((p, i) => (
                  <li key={p.title} className="about-pillar-item-v2">
                    <span className="about-pillar-num">{`0${i + 1}`}</span>
                    <div className="about-pillar-text">
                      <div className="about-pillar-title-v2">{p.title}</div>
                      <p className="about-pillar-body-v2">{p.body}</p>
                    </div>
                    <span className="about-pillar-icon-v2" aria-hidden>{p.icon}</span>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </div>
      </section>

      {/* ═══ № 01 · What WCN is / isn't ═══════════════════════ */}
      <section className="section section-alt about-clarity">
        <div className="container">
          <SectionHead
            number="№ 01"
            eyebrow={t("definitionEyebrow")}
            title={t("definitionTitle")}
            lede={t("definitionDesc")}
          />
          <DualSlab
            variant="feature"
            affirm={{
              title: t("whatWcnIs"),
              lede: t("whatWcnIsLede"),
              items: whatIsBullets,
              watermark: "01",
            }}
            deny={{
              title: t("whatWcnIsNot"),
              lede: t("whatWcnIsNotLede"),
              items: whatIsNotBullets,
              watermark: "02",
            }}
          />
        </div>
      </section>

      {/* ═══ № 02 · Why Now timeline ═══════════════════════════ */}
      <section className="section about-why-now">
        <div className="container">
          <SectionHead
            number="№ 02"
            eyebrow={t("timelineEyebrow")}
            title={t.rich("timelineTitle", { em: (chunks) => <em>{chunks}</em> })}
            lede={t("timelineDesc")}
          />
          <WhyNowTimeline entries={timeline} />
        </div>
      </section>

      {/* ═══ № 03 · Formal Definition (signature centerpiece) ═══ */}
      <section className="section section-alt about-formal" data-anim-host>
        <div className="container">
          <SectionHead
            number="№ 03"
            eyebrow={t("formalEyebrow")}
            title={t.rich("formalTitle", { em: (chunks) => <em>{chunks}</em> })}
            lede={t("formalLede")}
          />
          <FormalDefinition
            label={t("formalLabel")}
            eq={t("formalEq")}
            variables={variables}
            caption={t("formalCaption")}
          />
        </div>
      </section>

      {/* ═══ № 04 · Structural pillars ═════════════════════════ */}
      <section className="section about-structure">
        <div className="container">
          <SectionHead
            number="№ 04"
            eyebrow={t("diffEyebrow")}
            title={t("diffTitle")}
            lede={t("diffDesc")}
          />
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

      {/* ═══ № 05 · How we measure (Roman numerals I–V) ═══════ */}
      <section className="section section-alt about-measure">
        <div className="container">
          <div className="card about-measure-card-v2 card-grid-animated">
            <div className="about-measure-inner-v2">
              <div className="about-measure-head">
                <span className="section-number">№ 05</span>
                <span className="eyebrow about-eyebrow">{t("measureEyebrow")}</span>
                <h2 className="about-measure-title-v2">{t("measureTitle")}</h2>
                <p className="muted about-measure-lede">{t("measureDesc")}</p>
              </div>
              <ol className="about-measure-list-v2">
                {measureSteps.map((step) => (
                  <li key={step.roman} className="about-measure-step-v2">
                    <span className="about-measure-roman" aria-hidden>{step.roman}</span>
                    <span className="about-measure-step-body">{step.body}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ № 06 · Architecture layers (NEW signature) ═══════ */}
      <section className="section about-architecture">
        <div className="container">
          <SectionHead
            number="№ 06"
            eyebrow={t("archEyebrow")}
            title={t("archTitle")}
            lede={t("archDesc")}
          />
          <ArchitectureLayers
            layers={layers}
            flowExample={t("archFlowExample")}
            exampleRequestLabel={tCommon("editorial.exampleRequest")}
          />
        </div>
      </section>

      {/* ═══ Genesis pull quote — archival document (no number) ═══ */}
      <GenesisPullQuote
        eyebrow={t("genesisEyebrow")}
        quote={t("genesisQuote")}
        attribution={t("genesisAttribution")}
        documentRef={t.raw("genesisRef") as string}
      />

      {/* ═══ Voltage callout — payoff (no number) ═══════════════ */}
      {/* Phase 5 funnel: from /about, move readers into the mechanics. */}
      <VoltageCallout
        eyebrow={t("ctaEyebrow")}
        title={t("ctaTitle")}
        desc={t("ctaDesc")}
        primaryLabel={tNav("howItWorks")}
        primaryHref="/how-it-works"
        secondaryLabel={t("openWiki")}
        secondaryHref="/wiki"
      />
    </main>
  );
}
