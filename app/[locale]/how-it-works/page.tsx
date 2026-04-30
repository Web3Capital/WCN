import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { CSSProperties, ReactNode } from "react";
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

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
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

const LAYER_WIDTHS = [100, 88, 76, 64, 52];

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
    widthPct: LAYER_WIDTHS[i],
    accent: LAYER_ACCENTS[i],
  }));

  return (
    <main className="hiw-page">
      <section className="section hero hero-orb hiw-hero">
        <div className="container hiw-hero-container">
          <div className="section-head hiw-hero-intro">
            <span className="eyebrow hiw-eyebrow">{t("eyebrow")}</span>
            <h1 className="hiw-hero-title">
              {t.rich("headline", { em: (chunks) => <em>{chunks}</em> })}
            </h1>
            <p className="muted hero-lede hiw-hero-lede">
              {t.rich("lede", {
                strong: (chunks) => <strong className="hiw-strong">{chunks}</strong>,
              })}
            </p>
          </div>

          <div className="hiw-hero-grid card-grid-animated">
            <div className="hiw-hero-copy">
              <p className="muted hiw-hero-sub">{t("subLede")}</p>
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

            <div className="hiw-glance-panel glass" aria-label={t("glanceAriaLabel")}>
              <div className="hiw-glance-head">
                <Layers size={20} className="hiw-glance-icon" aria-hidden />
                <span>{t("loopAtGlance")}</span>
              </div>
              <ol className="hiw-glance-list">
                {loopSteps.map((step, i) => (
                  <li key={`glance-${i}`} className="hiw-glance-item">
                    <span className="hiw-glance-index">{i + 1}</span>
                    <span className="hiw-glance-title">{step.title}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-alt hiw-loop-section">
        <div className="container">
          <div className="section-head hiw-section-head section-head-numbered">
            <span className="section-number">№ 01</span>
            <span className="eyebrow hiw-eyebrow">{t("operatingLoopEyebrow")}</span>
            <h2 className="hiw-section-h2">{t("operatingLoopTitle")}</h2>
            <p className="muted hero-lede hiw-section-lede">{t("operatingLoopDesc")}</p>
          </div>
          <div className="hiw-loop-wrap">
            <div className="hiw-loop card-grid-animated">
              {loopSteps.map((step, i) => (
                <div key={`loop-${i}`} className="hiw-loop-card">
                  <div className="hiw-loop-icon">{step.icon}</div>
                  <div className="hiw-loop-step">{t("step", { n: i + 1 })}</div>
                  <h3 className="hiw-loop-title">{step.title}</h3>
                  <p className="hiw-loop-body">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section hiw-layers-section">
        <div className="container">
          <div className="section-head hiw-section-head section-head-numbered">
            <span className="section-number">№ 02</span>
            <span className="eyebrow hiw-eyebrow">{t("archEyebrow")}</span>
            <h2 className="hiw-section-h2">{t("archTitle")}</h2>
            <p className="muted hero-lede hiw-section-lede">{t("archDesc")}</p>
          </div>
          <div className="hiw-layers-stack card-grid-animated">
            {layers.map((layer) => (
              <div
                key={layer.n}
                className={`hiw-layer-shell hiw-layer-shell--${layer.accent}`}
                style={{ "--hiw-layer-w": `${layer.widthPct}%` } as CSSProperties}
              >
                <div className="hiw-layer-inner">
                  <span className={`hiw-layer-badge hiw-layer-badge--${layer.accent}`}>{layer.n}</span>
                  <div className="hiw-layer-text">
                    <div className="hiw-layer-label">{layer.label}</div>
                    <div className="hiw-layer-desc">{layer.desc}</div>
                    <p className="hiw-layer-detail muted">{layer.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-alt hiw-bridge-section">
        <div className="container">
          <div className="grid-2 hiw-bridge-grid card-grid-animated">
            <div className="card hiw-bridge-card hiw-bridge-card--nodes">
              <span className="hiw-bridge-kicker">{t("bridgeEntryKicker")}</span>
              <h3>{t("bridgeEntryTitle")}</h3>
              <p className="muted hiw-bridge-body">{t("bridgeEntryBody")}</p>
              <Link href="/nodes" className="hiw-bridge-link">
                {t("bridgeEntryLink")}
                <ArrowRight size={16} aria-hidden />
              </Link>
            </div>
            <div className="card hiw-bridge-card hiw-bridge-card--pob">
              <span className="hiw-bridge-kicker">{t("bridgeProofKicker")}</span>
              <h3>{t("bridgeProofTitle")}</h3>
              <p className="muted hiw-bridge-body">{t("bridgeProofBody")}</p>
              <Link href="/pob" className="hiw-bridge-link">
                {t("bridgeProofLink")}
                <ArrowRight size={16} aria-hidden />
              </Link>
            </div>
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
