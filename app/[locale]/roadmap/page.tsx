import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import {
  CalendarCheck,
  FileSignature,
  Flag,
  Gavel,
  Globe,
  Handshake,
  Network,
  Route,
  ScrollText,
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

  const t = await getTranslations({ locale, namespace: "roadmap" });
  return {
    title: t("title"),
    description: t("metaDesc"),
  };
}

const PHASE_ICONS: ReactNode[] = [
  <Network key="p1" size={20} strokeWidth={2} aria-hidden />,
  <Route key="p2" size={20} strokeWidth={2} aria-hidden />,
  <Globe key="p3" size={20} strokeWidth={2} aria-hidden />,
];

const MILESTONE_ICONS: ReactNode[] = [
  <Flag key="d14" size={18} strokeWidth={2} aria-hidden />,
  <FileSignature key="d30" size={18} strokeWidth={2} aria-hidden />,
  <Handshake key="d60" size={18} strokeWidth={2} aria-hidden />,
  <CalendarCheck key="d90" size={18} strokeWidth={2} aria-hidden />,
];

export default async function RoadmapPage() {
  const t = await getTranslations("roadmap");

  const phases = [1, 2, 3].map((n, i) => ({
    n,
    tag: t(`phase${n}Tag`),
    title: t(`phase${n}Title`),
    window: t(`phase${n}Window`),
    focus: t(`phase${n}Focus`),
    exitLabel: t(`phase${n}ExitLabel`),
    exit: [t(`phase${n}Exit1`), t(`phase${n}Exit2`)],
    icon: PHASE_ICONS[i],
  }));

  const milestones = [14, 30, 60, 90].map((day, i) => ({
    day,
    title: t(`day${day}Title`),
    body: t(`day${day}Body`),
    icon: MILESTONE_ICONS[i],
  }));

  return (
    <main className="rm-page">
      <AnimationBudget />

      {/* ═══ HERO — editorial masthead bar + centered thesis ═══ */}
      <section className="section hero hero-orb rm-hero" data-anim-host>
        <div className="container">
          <div className="hiw-issue-bar" aria-hidden>
            <span className="hiw-issue-num">№ 07</span>
            <span className="hiw-issue-rule" />
            <span className="hiw-issue-section">{t("eyebrow")}</span>
            <span className="hiw-issue-rule" />
            <span className="hiw-issue-meta">Volume · MMXXVI</span>
          </div>
          <div className="section-head rm-hero-intro">
            <h1 className="rm-hero-title">
              {t.rich("headline", { em: (chunks) => <em>{chunks}</em> })}
            </h1>
            <p className="hero-lede rm-hero-lede">{t("lede")}</p>
          </div>
        </div>
      </section>

      {/* ═══ № 01 — Three milestone-gated phases — phased sequence ══ */}
      <section className="section section-alt rm-phases-section">
        <div className="container">
          <div className="section-head hiw-section-head section-head-numbered">
            <span className="section-number">№ 01</span>
            <span className="eyebrow hiw-eyebrow">{t("phasesEyebrow")}</span>
            <h2 className="hiw-section-h2">{t("phasesTitle")}</h2>
            <p className="muted hero-lede hiw-section-lede">{t("phasesDesc")}</p>
          </div>
          <ol className="rm-phases card-grid-animated">
            {phases.map((phase) => (
              <li key={phase.n} className="card rm-phase">
                <div className="rm-phase-head">
                  <span className="rm-phase-code" aria-hidden>
                    {`P${phase.n}`}
                  </span>
                  <span className="rm-phase-icon" aria-hidden>{phase.icon}</span>
                  <span className="rm-phase-window">{phase.window}</span>
                </div>
                <span className="rm-phase-tag">{phase.tag}</span>
                <h3 className="rm-phase-title">{phase.title}</h3>
                <p className="rm-phase-focus">{phase.focus}</p>
                <div className="rm-gate">
                  <span className="rm-gate-label">{phase.exitLabel}</span>
                  <ul className="rm-gate-list">
                    {phase.exit.map((item, j) => (
                      <li key={j} className="rm-gate-item">{item}</li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ═══ № 02 — The first 90 days — Day 14/30/60/90 timeline ═══ */}
      <section className="section rm-days-section">
        <div className="container">
          <div className="section-head hiw-section-head section-head-numbered">
            <span className="section-number">№ 02</span>
            <span className="eyebrow hiw-eyebrow">{t("daysEyebrow")}</span>
            <h2 className="hiw-section-h2">{t("daysTitle")}</h2>
            <p className="muted hero-lede hiw-section-lede">{t("daysDesc")}</p>
          </div>
          <ol className="rm-timeline card-grid-animated">
            {milestones.map((milestone) => (
              <li key={milestone.day} className="card rm-day">
                <div className="rm-day-head">
                  <span className="rm-day-marker" aria-hidden>
                    <span className="rm-day-num">{milestone.day}</span>
                    <span className="rm-day-unit">{t("dayUnit")}</span>
                  </span>
                  <span className="rm-day-icon" aria-hidden>{milestone.icon}</span>
                </div>
                <h3 className="rm-day-title">{milestone.title}</h3>
                <p className="rm-day-body">{milestone.body}</p>
              </li>
            ))}
          </ol>
          <p className="rm-close">
            <ScrollText size={18} className="rm-close-icon" aria-hidden />
            <span>{t.rich("closing", { em: (chunks) => <em>{chunks}</em> })}</span>
          </p>
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
