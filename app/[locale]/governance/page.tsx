import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import {
  Activity,
  Banknote,
  FileSignature,
  Fingerprint,
  Gavel,
  Landmark,
  Lock,
  ScrollText,
  ShieldAlert,
  ShieldCheck,
  TimerReset,
  Users,
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

  const t = await getTranslations({ locale, namespace: "governance" });
  return {
    title: t("title"),
    description: t("metaDesc"),
  };
}

const STACK_ICONS: ReactNode[] = [
  <ScrollText key="l0" size={18} strokeWidth={2} aria-hidden />,
  <Landmark key="l1" size={18} strokeWidth={2} aria-hidden />,
  <Users key="l2" size={18} strokeWidth={2} aria-hidden />,
  <Gavel key="l3" size={18} strokeWidth={2} aria-hidden />,
  <Banknote key="l4" size={18} strokeWidth={2} aria-hidden />,
  <Activity key="l5" size={18} strokeWidth={2} aria-hidden />,
  <Landmark key="l6" size={18} strokeWidth={2} aria-hidden />,
  <ShieldCheck key="l7" size={18} strokeWidth={2} aria-hidden />,
];

const NEVER_ICONS: ReactNode[] = [
  <Fingerprint key="n0" size={20} strokeWidth={2} aria-hidden />,
  <ShieldCheck key="n1" size={20} strokeWidth={2} aria-hidden />,
  <Lock key="n2" size={20} strokeWidth={2} aria-hidden />,
  <FileSignature key="n3" size={20} strokeWidth={2} aria-hidden />,
  <ShieldAlert key="n4" size={20} strokeWidth={2} aria-hidden />,
  <TimerReset key="n5" size={20} strokeWidth={2} aria-hidden />,
];

export default async function GovernancePage() {
  const t = await getTranslations("governance");

  const layers = [0, 1, 2, 3, 4, 5, 6, 7].map((n) => ({
    code: `L${n}`,
    title: t(`layer${n}Title`),
    body: t(`layer${n}Body`),
    icon: STACK_ICONS[n],
  }));

  const nevers = [1, 2, 3, 4, 5, 6].map((n, i) => ({
    n,
    title: t(`never${n}Title`),
    body: t(`never${n}Body`),
    icon: NEVER_ICONS[i],
  }));

  return (
    <main className="gov-page">
      <AnimationBudget />

      {/* ═══ HERO — editorial masthead bar + centered thesis ═══ */}
      <section className="section hero hero-orb gov-hero" data-anim-host>
        <div className="container">
          <div className="hiw-issue-bar" aria-hidden>
            <span className="hiw-issue-num">№ 06</span>
            <span className="hiw-issue-rule" />
            <span className="hiw-issue-section">{t("eyebrow")}</span>
            <span className="hiw-issue-rule" />
            <span className="hiw-issue-meta">Volume · MMXXVI</span>
          </div>
          <div className="section-head gov-hero-intro">
            <h1 className="gov-hero-title">
              {t.rich("headline", { em: (chunks) => <em>{chunks}</em> })}
            </h1>
            <p className="hero-lede gov-hero-lede">{t("lede")}</p>
          </div>
        </div>
      </section>

      {/* ═══ № 01 — Eight-layer command stack — L0→L7 ledger ════ */}
      <section className="section section-alt gov-stack-section">
        <div className="container">
          <div className="section-head hiw-section-head section-head-numbered">
            <span className="section-number">№ 01</span>
            <span className="eyebrow hiw-eyebrow">{t("stackEyebrow")}</span>
            <h2 className="hiw-section-h2">{t("stackTitle")}</h2>
            <p className="muted hero-lede hiw-section-lede">{t("stackDesc")}</p>
          </div>
          <ol className="gov-stack card-grid-animated">
            {layers.map((layer) => (
              <li key={layer.code} className="card gov-layer">
                <span className="gov-layer-code" aria-hidden>{layer.code}</span>
                <span className="gov-layer-icon" aria-hidden>{layer.icon}</span>
                <div className="gov-layer-text">
                  <h3 className="gov-layer-title">{layer.title}</h3>
                  <p className="gov-layer-body">{layer.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ═══ № 02 — Two thresholds on the founder — exact gates ══ */}
      <section className="section gov-thresholds-section">
        <div className="container">
          <div className="section-head hiw-section-head section-head-numbered">
            <span className="section-number">№ 02</span>
            <span className="eyebrow hiw-eyebrow">{t("thresholdsEyebrow")}</span>
            <h2 className="hiw-section-h2">{t("thresholdsTitle")}</h2>
            <p className="muted hero-lede hiw-section-lede">{t("thresholdsDesc")}</p>
          </div>

          <div className="grid-2 gov-thresholds-grid card-grid-animated">
            <article className="card gov-threshold">
              <div className="gov-threshold-head">
                <span className="gov-threshold-icon" aria-hidden>
                  <ShieldCheck size={20} strokeWidth={2} aria-hidden />
                </span>
                <span className="gov-threshold-kind">{t("integrityKind")}</span>
              </div>
              <h3 className="gov-threshold-title">{t("integrityTitle")}</h3>
              <p className="gov-threshold-body">{t("integrityDesc")}</p>
              <ul className="gov-gate-list">
                <li className="gov-gate"><span className="gov-gate-value">{t("integrityGate1Value")}</span><span className="gov-gate-label">{t("integrityGate1Label")}</span></li>
                <li className="gov-gate"><span className="gov-gate-value">{t("integrityGate2Value")}</span><span className="gov-gate-label">{t("integrityGate2Label")}</span></li>
                <li className="gov-gate"><span className="gov-gate-value">{t("integrityGate3Value")}</span><span className="gov-gate-label">{t("integrityGate3Label")}</span></li>
              </ul>
              <p className="gov-threshold-trigger muted">{t("integrityTriggers")}</p>
            </article>

            <article className="card gov-threshold">
              <div className="gov-threshold-head">
                <span className="gov-threshold-icon" aria-hidden>
                  <Activity size={20} strokeWidth={2} aria-hidden />
                </span>
                <span className="gov-threshold-kind">{t("competenceKind")}</span>
              </div>
              <h3 className="gov-threshold-title">{t("competenceTitle")}</h3>
              <p className="gov-threshold-body">{t("competenceDesc")}</p>
              <ul className="gov-gate-list">
                <li className="gov-gate"><span className="gov-gate-value">{t("competenceGate1Value")}</span><span className="gov-gate-label">{t("competenceGate1Label")}</span></li>
                <li className="gov-gate"><span className="gov-gate-value">{t("competenceGate2Value")}</span><span className="gov-gate-label">{t("competenceGate2Label")}</span></li>
                <li className="gov-gate"><span className="gov-gate-value">{t("competenceGate3Value")}</span><span className="gov-gate-label">{t("competenceGate3Label")}</span></li>
              </ul>
              <p className="gov-threshold-trigger muted">{t("competenceTriggers")}</p>
            </article>
          </div>

          <p className="gov-analogy">
            <Landmark size={18} className="gov-analogy-icon" aria-hidden />
            <span>{t.rich("analogy", { em: (chunks) => <em>{chunks}</em> })}</span>
          </p>
        </div>
      </section>

      {/* ═══ № 03 — Six things no majority can vote away — cards ══ */}
      <section className="section section-alt gov-never-section">
        <div className="container">
          <div className="section-head hiw-section-head section-head-numbered">
            <span className="section-number">№ 03</span>
            <span className="eyebrow hiw-eyebrow">{t("neverEyebrow")}</span>
            <h2 className="hiw-section-h2">{t("neverTitle")}</h2>
            <p className="muted hero-lede hiw-section-lede">{t("neverDesc")}</p>
          </div>
          <ol className="grid-2 gov-never-grid card-grid-animated">
            {nevers.map((never) => (
              <li key={never.n} className="card gov-never-card">
                <div className="gov-never-mark" aria-hidden>
                  <span className="gov-never-numeral">
                    {String(never.n).padStart(2, "0")}
                  </span>
                  <span className="gov-never-icon">{never.icon}</span>
                </div>
                <h3 className="gov-never-title">{never.title}</h3>
                <p className="gov-never-body">{never.body}</p>
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
