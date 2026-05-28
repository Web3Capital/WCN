import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  Layers,
  ListTodo,
  Network,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { VoltageCallout } from "@/components/brand/voltage-callout";
import { AnimationBudget } from "@/components/brand/animation-budget";

export async function generateMetadata(
  props: {
    params: Promise<{ locale: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;

  const {
    locale
  } = params;

  const t = await getTranslations({ locale, namespace: "howItWorks" });
  return {
    title: t("title"),
    description: t("metaDesc"),
  };
}

const LOOP_ICONS: ReactNode[] = [
  <Network key="i0" size={20} strokeWidth={2} aria-hidden />,
  <ListTodo key="i1" size={20} strokeWidth={2} aria-hidden />,
  <Bot key="i2" size={20} strokeWidth={2} aria-hidden />,
  <ShieldCheck key="i3" size={20} strokeWidth={2} aria-hidden />,
  <BadgeCheck key="i4" size={20} strokeWidth={2} aria-hidden />,
  <Scale key="i5" size={20} strokeWidth={2} aria-hidden />,
];

const LAYER_ACCENTS: ("accent" | "purple" | "amber" | "green" | "muted")[] = [
  "accent",
  "purple",
  "amber",
  "green",
  "muted",
];

export default async function HowItWorksPage() {
  const t = await getTranslations("howItWorks");

  const loopSteps = [1, 2, 3, 4, 5, 6].map((n, i) => ({
    title: t(`loopStep${n}Title`),
    body: t(`loopStep${n}Body`),
    icon: LOOP_ICONS[i],
  }));

  const layers = [1, 2, 3, 4, 5].map((n, i) => ({
    n,
    label: t(`layer${n}Label`),
    desc: t(`layer${n}Desc`),
    detail: t(`layer${n}Detail`),
    accent: LAYER_ACCENTS[i],
  }));

  return (
    <main className="hiw-page">
      <AnimationBudget />

      {/* ═══ HERO — editorial masthead bar + centered headline ═══ */}
      <section className="section hero hero-orb hiw-hero" data-anim-host>
        <div className="container">
          <div className="hiw-issue-bar" aria-hidden>
            <span className="hiw-issue-num">№ 03</span>
            <span className="hiw-issue-rule" />
            <span className="hiw-issue-section">{t("eyebrow")}</span>
            <span className="hiw-issue-rule" />
            <span className="hiw-issue-meta">Volume · MMXXVI</span>
          </div>
          <div className="section-head hiw-hero-intro">
            <h1 className="hiw-hero-title">
              {t.rich("headline", { em: (chunks) => <em>{chunks}</em> })}
            </h1>
            <p className="hero-lede hiw-hero-lede">
              {t.rich("lede", {
                strong: (chunks) => <strong className="hiw-strong">{chunks}</strong>,
              })}
            </p>
            <div className="hiw-hero-ctas">
              <Link href="/nodes" className="button-secondary hiw-hero-link">
                {t("heroLinkNodes")}
              </Link>
              <Link href="/pob" className="button-secondary hiw-hero-link">
                {t("heroLinkPob")}
              </Link>
              <Link href="/wiki" className="button-secondary hiw-hero-link">
                {t("heroLinkWiki")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ INTRO SPREAD — dropcap lede + magazine sidebar ═══ */}
      <section className="hiw-intro-section">
        <div className="container">
          <div className="hiw-intro-grid">
            <div className="hiw-intro-prose">
              <span className="hiw-intro-kicker">Editor’s note</span>
              <p className="hiw-intro-lede hiw-intro-lede--dropcap">{t("subLede")}</p>
            </div>
            <aside className="hiw-glance-panel glass" aria-label={t("glanceAriaLabel")}>
              <div className="hiw-glance-head">
                <Layers size={20} className="hiw-glance-icon" aria-hidden />
                <span>{t("loopAtGlance")}</span>
              </div>
              <ol className="hiw-glance-list">
                {loopSteps.map((step, i) => (
                  <li key={`glance-${i}`} className="hiw-glance-item">
                    <span className="hiw-glance-index">{String(i + 1).padStart(2, "0")}</span>
                    <span className="hiw-glance-dot" aria-hidden />
                    <span className="hiw-glance-title">{step.title}</span>
                  </li>
                ))}
              </ol>
            </aside>
          </div>
        </div>
      </section>

      {/* ═══ № 01 — Operating loop — editorial sequence ════════ */}
      <section className="section section-alt hiw-loop-section">
        <div className="container">
          <div className="section-head hiw-section-head section-head-numbered">
            <span className="section-number">№ 01</span>
            <span className="eyebrow hiw-eyebrow">{t("operatingLoopEyebrow")}</span>
            <h2 className="hiw-section-h2 hiw-loop-h2">{t("operatingLoopTitle")}</h2>
            <p className="muted hero-lede hiw-section-lede">{t("operatingLoopDesc")}</p>
          </div>
          <ol className="hiw-editorial-loop card-grid-animated">
            {loopSteps.map((step, i) => (
              <li key={`loop-${i}`} className="hiw-editorial-step">
                <span className="hiw-editorial-num" aria-hidden>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="hiw-editorial-content">
                  <div className="hiw-editorial-header">
                    <span className="hiw-editorial-icon" aria-hidden>{step.icon}</span>
                    <h3 className="hiw-editorial-title">{step.title}</h3>
                  </div>
                  <p className="hiw-editorial-body">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ═══ № 02 — Five-layer architecture — editorial specimen ══ */}
      <section className="section hiw-layers-section">
        <div className="container">
          <div className="section-head hiw-section-head section-head-numbered">
            <span className="section-number">№ 02</span>
            <span className="eyebrow hiw-eyebrow">{t("archEyebrow")}</span>
            <h2 className="hiw-section-h2 hiw-loop-h2">{t("archTitle")}</h2>
            <p className="muted hero-lede hiw-section-lede">{t("archDesc")}</p>
          </div>
          <ol className="hiw-arch-stack card-grid-animated">
            {layers.map((layer) => (
              <li
                key={layer.n}
                className={`hiw-arch-row hiw-arch-row--${layer.accent}`}
                data-layer={layer.n}
              >
                <div className="hiw-arch-mark" aria-hidden>
                  <span className="hiw-arch-prefix">L</span>
                  <span className="hiw-arch-numeral">{String(layer.n).padStart(2, "0")}</span>
                </div>
                <div className="hiw-arch-body">
                  <h3 className="hiw-arch-label">{layer.label}</h3>
                  <p className="hiw-arch-desc">{layer.desc}</p>
                </div>
                <p className="hiw-arch-detail">{layer.detail}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ═══ № 03 — Bridge — editorial entry cards ══════════════ */}
      <section className="section section-alt hiw-bridge-section">
        <div className="container">
          <div className="grid-2 hiw-bridge-grid card-grid-animated">
            <article className="card hiw-bridge-card hiw-bridge-card--nodes">
              <div className="hiw-bridge-kicker">
                <span className="hiw-bridge-kicker-num">№ 03·a</span>
                <span className="hiw-bridge-kicker-rule" aria-hidden />
                <span className="hiw-bridge-kicker-text">{t("bridgeEntryKicker")}</span>
              </div>
              <h3 className="hiw-bridge-title">{t("bridgeEntryTitle")}</h3>
              <p className="hiw-bridge-body">{t("bridgeEntryBody")}</p>
              <Link href="/nodes" className="hiw-bridge-link">
                {t("bridgeEntryLink")}
                <ArrowRight size={16} aria-hidden />
              </Link>
            </article>
            <article className="card hiw-bridge-card hiw-bridge-card--pob">
              <div className="hiw-bridge-kicker">
                <span className="hiw-bridge-kicker-num">№ 03·b</span>
                <span className="hiw-bridge-kicker-rule" aria-hidden />
                <span className="hiw-bridge-kicker-text">{t("bridgeProofKicker")}</span>
              </div>
              <h3 className="hiw-bridge-title">{t("bridgeProofTitle")}</h3>
              <p className="hiw-bridge-body">{t("bridgeProofBody")}</p>
              <Link href="/pob" className="hiw-bridge-link">
                {t("bridgeProofLink")}
                <ArrowRight size={16} aria-hidden />
              </Link>
            </article>
          </div>
        </div>
      </section>

      <VoltageCallout
        eyebrow={t("ctaEyebrow")}
        title={t("ctaTitle")}
        desc={t("ctaDesc")}
        primaryLabel={t("applyAsNodeButton")}
        primaryHref="/apply"
        secondaryLabel={t("openWiki")}
        secondaryHref="/wiki"
      />
    </main>
  );
}
