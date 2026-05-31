import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import {
  Boxes,
  CircuitBoard,
  Coins,
  Network,
  Receipt,
  ScanLine,
  ShieldCheck,
  TrendingUp,
  Workflow,
} from "lucide-react";
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

  const t = await getTranslations({ locale, namespace: "whyNow" });
  return {
    title: t("title"),
    description: t("metaDesc"),
  };
}

const RUPTURE_ICONS: ReactNode[] = [
  <Network key="r0" size={20} strokeWidth={2} aria-hidden />,
  <Coins key="r1" size={20} strokeWidth={2} aria-hidden />,
  <Receipt key="r2" size={20} strokeWidth={2} aria-hidden />,
  <CircuitBoard key="r3" size={20} strokeWidth={2} aria-hidden />,
];

const WINDOW_ICONS: ReactNode[] = [
  <Boxes key="w0" size={20} strokeWidth={2} aria-hidden />,
  <ShieldCheck key="w1" size={20} strokeWidth={2} aria-hidden />,
  <TrendingUp key="w2" size={20} strokeWidth={2} aria-hidden />,
  <ScanLine key="w3" size={20} strokeWidth={2} aria-hidden />,
  <Workflow key="w4" size={20} strokeWidth={2} aria-hidden />,
];

export default async function WhyNowPage() {
  const t = await getTranslations("whyNow");

  const ruptures = [1, 2, 3, 4].map((n, i) => ({
    n,
    title: t(`rupture${n}Title`),
    body: t(`rupture${n}Body`),
    icon: RUPTURE_ICONS[i],
  }));

  const windows = [1, 2, 3, 4, 5].map((n, i) => ({
    n,
    title: t(`window${n}Title`),
    body: t(`window${n}Body`),
    icon: WINDOW_ICONS[i],
  }));

  return (
    <main className="wn-page">
      <AnimationBudget />

      {/* ═══ HERO — editorial masthead bar + centered headline ═══ */}
      <section className="section hero hero-orb wn-hero" data-anim-host>
        <div className="container">
          <div className="hiw-issue-bar" aria-hidden>
            <span className="hiw-issue-num">№ 04</span>
            <span className="hiw-issue-rule" />
            <span className="hiw-issue-section">{t("eyebrow")}</span>
            <span className="hiw-issue-rule" />
            <span className="hiw-issue-meta">Volume · MMXXVI</span>
          </div>
          <div className="section-head wn-hero-intro">
            <h1 className="wn-hero-title">
              {t.rich("headline", { em: (chunks) => <em>{chunks}</em> })}
            </h1>
            <p className="hero-lede wn-hero-lede">{t("lede")}</p>
          </div>
        </div>
      </section>

      {/* ═══ № 01 — Four structural ruptures — editorial grid ════ */}
      <section className="section section-alt wn-ruptures-section">
        <div className="container">
          <div className="section-head hiw-section-head section-head-numbered">
            <span className="section-number">№ 01</span>
            <span className="eyebrow hiw-eyebrow">{t("rupturesEyebrow")}</span>
            <h2 className="hiw-section-h2">{t("rupturesTitle")}</h2>
            <p className="muted hero-lede hiw-section-lede">{t("rupturesDesc")}</p>
          </div>
          <div className="grid-2 wn-ruptures-grid card-grid-animated">
            {ruptures.map((rupture) => (
              <article key={rupture.n} className="card wn-rupture-card">
                <div className="wn-rupture-mark" aria-hidden>
                  <span className="wn-rupture-numeral">
                    {String(rupture.n).padStart(2, "0")}
                  </span>
                  <span className="wn-rupture-icon">{rupture.icon}</span>
                </div>
                <h3 className="wn-rupture-title">{rupture.title}</h3>
                <p className="wn-rupture-body">{rupture.body}</p>
              </article>
            ))}
          </div>
          <p className="wn-synthesis">
            {t.rich("rupturesSynthesis", { em: (chunks) => <em>{chunks}</em> })}
          </p>
        </div>
      </section>

      {/* ═══ № 02 — Five windows, open at once — card grid ═══════ */}
      <section className="section wn-windows-section">
        <div className="container">
          <div className="section-head hiw-section-head section-head-numbered">
            <span className="section-number">№ 02</span>
            <span className="eyebrow hiw-eyebrow">{t("windowsEyebrow")}</span>
            <h2 className="hiw-section-h2">{t("windowsTitle")}</h2>
            <p className="muted hero-lede hiw-section-lede">{t("windowsDesc")}</p>
          </div>
          <ol className="wn-windows-grid card-grid-animated">
            {windows.map((window) => (
              <li key={window.n} className="card wn-window-card">
                <div className="wn-window-head">
                  <span className="wn-window-index" aria-hidden>
                    {String(window.n).padStart(2, "0")}
                  </span>
                  <span className="wn-window-icon" aria-hidden>{window.icon}</span>
                </div>
                <h3 className="wn-window-title">{window.title}</h3>
                <p className="wn-window-body">{window.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <VoltageCallout
        eyebrow={t("ctaEyebrow")}
        title={t("ctaTitle")}
        desc={t("ctaDesc")}
        primaryLabel={t("applyButton")}
        primaryHref="/apply"
        secondaryLabel={t("readWhitepaper")}
        secondaryHref="/wiki"
      />
    </main>
  );
}
