import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import {
  Banknote,
  Coins,
  Database,
  Globe,
  Landmark,
  ScrollText,
  ShieldCheck,
  Wallet,
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

  const t = await getTranslations({ locale, namespace: "economics" });
  return {
    title: t("title"),
    description: t("metaDesc"),
  };
}

const SOURCE_ICONS: ReactNode[] = [
  <Wallet key="s0" size={20} strokeWidth={2} aria-hidden />,
  <Coins key="s1" size={20} strokeWidth={2} aria-hidden />,
  <Banknote key="s2" size={20} strokeWidth={2} aria-hidden />,
];

const MOAT_ICONS: ReactNode[] = [
  <Database key="m0" size={20} strokeWidth={2} aria-hidden />,
  <Globe key="m1" size={20} strokeWidth={2} aria-hidden />,
  <ShieldCheck key="m2" size={20} strokeWidth={2} aria-hidden />,
];

export default async function EconomicsPage() {
  const t = await getTranslations("economics");

  const sources = [1, 2, 3].map((n, i) => ({
    tag: t(`source${n}Tag`),
    title: t(`source${n}Title`),
    body: t(`source${n}Body`),
    icon: SOURCE_ICONS[i],
  }));

  const headlineStats = [
    { value: t("statCapValue"), label: t("statCapLabel") },
    { value: t("statMedianValue"), label: t("statMedianLabel") },
    { value: t("statRunwayValue"), label: t("statRunwayLabel") },
    { value: t("statTokenValue"), label: t("statTokenLabel") },
  ];

  const derivationRows = [
    "Founding",
    "Country",
    "City",
    "Track",
    "Service",
    "Standard",
  ].map((key) => ({
    tier: t(`row${key}Tier`),
    seats: t(`row${key}Seats`),
    price: t(`row${key}Price`),
    full: t(`row${key}Full`),
    fill: t(`row${key}Fill`),
    expected: t(`row${key}Expected`),
  }));

  const allocations = [1, 2, 3, 4, 5].map((n) => ({
    label: t(`alloc${n}Label`),
    pct: t(`alloc${n}Pct`),
    note: t(`alloc${n}Note`),
  }));

  const moats = [1, 2, 3].map((n, i) => ({
    title: t(`moat${n}Title`),
    body: t(`moat${n}Body`),
    icon: MOAT_ICONS[i],
  }));

  return (
    <main className="ec-page">
      <AnimationBudget />

      {/* ═══ HERO — editorial masthead bar + centered thesis ═══ */}
      <section className="section hero hero-orb ec-hero" data-anim-host>
        <div className="container">
          <div className="hiw-issue-bar" aria-hidden>
            <span className="hiw-issue-num">№ 05</span>
            <span className="hiw-issue-rule" />
            <span className="hiw-issue-section">{t("eyebrow")}</span>
            <span className="hiw-issue-rule" />
            <span className="hiw-issue-meta">Volume · MMXXVI</span>
          </div>
          <div className="section-head ec-hero-intro">
            <h1 className="ec-hero-title">
              {t.rich("headline", { em: (chunks) => <em>{chunks}</em> })}
            </h1>
            <p className="hero-lede ec-hero-lede">{t("lede")}</p>
          </div>
        </div>
      </section>

      {/* ═══ № 01 — Three value sources — card grid ════════════ */}
      <section className="section section-alt ec-sources-section">
        <div className="container">
          <div className="section-head hiw-section-head section-head-numbered">
            <span className="section-number">№ 01</span>
            <span className="eyebrow hiw-eyebrow">{t("sourcesEyebrow")}</span>
            <h2 className="hiw-section-h2">{t("sourcesTitle")}</h2>
            <p className="muted hero-lede hiw-section-lede">{t("sourcesDesc")}</p>
          </div>
          <div className="grid-2 ec-sources-grid card-grid-animated">
            {sources.map((source) => (
              <article key={source.tag} className="card ec-source-card">
                <div className="ec-source-mark" aria-hidden>
                  <span className="ec-source-tag">{source.tag}</span>
                  <span className="ec-source-icon">{source.icon}</span>
                </div>
                <h3 className="ec-source-title">{source.title}</h3>
                <p className="ec-source-body">{source.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ № 02 — The raise, derived — headline stats + table ══ */}
      <section className="section ec-raise-section">
        <div className="container">
          <div className="section-head hiw-section-head section-head-numbered">
            <span className="section-number">№ 02</span>
            <span className="eyebrow hiw-eyebrow">{t("raiseEyebrow")}</span>
            <h2 className="hiw-section-h2">{t("raiseTitle")}</h2>
            <p className="muted hero-lede hiw-section-lede">{t("raiseDesc")}</p>
          </div>

          <dl className="ec-stat-row card-grid-animated">
            {headlineStats.map((stat) => (
              <div key={stat.label} className="card ec-stat">
                <dt className="ec-stat-label">{stat.label}</dt>
                <dd className="ec-stat-value">{stat.value}</dd>
              </div>
            ))}
          </dl>

          <figure className="ec-table-figure">
            <div className="ec-table-scroll">
              <table className="ec-table">
                <caption className="ec-table-caption">{t("tableCaption")}</caption>
                <thead>
                  <tr>
                    <th scope="col" className="ec-th-tier">{t("colTier")}</th>
                    <th scope="col" className="ec-th-num">{t("colSeats")}</th>
                    <th scope="col" className="ec-th-num">{t("colPrice")}</th>
                    <th scope="col" className="ec-th-num">{t("colFull")}</th>
                    <th scope="col" className="ec-th-num">{t("colFill")}</th>
                    <th scope="col" className="ec-th-num ec-th-expected">{t("colExpected")}</th>
                  </tr>
                </thead>
                <tbody>
                  {derivationRows.map((row) => (
                    <tr key={row.tier}>
                      <th scope="row" className="ec-td-tier">{row.tier}</th>
                      <td className="ec-td-num">{row.seats}</td>
                      <td className="ec-td-num">{row.price}</td>
                      <td className="ec-td-num">{row.full}</td>
                      <td className="ec-td-num">{row.fill}</td>
                      <td className="ec-td-num ec-td-expected">{row.expected}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="ec-tr-total">
                    <th scope="row" className="ec-td-tier">{t("rowTotalTier")}</th>
                    <td className="ec-td-num" aria-hidden>—</td>
                    <td className="ec-td-num" aria-hidden>—</td>
                    <td className="ec-td-num">{t("rowTotalFull")}</td>
                    <td className="ec-td-num" aria-hidden>—</td>
                    <td className="ec-td-num ec-td-expected">{t("rowTotalExpected")}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <figcaption className="ec-table-footnote muted">{t("raiseFootnote")}</figcaption>
          </figure>
        </div>
      </section>

      {/* ═══ № 03 — Token: deferred, gated, fully allocated ═════ */}
      <section className="section section-alt ec-token-section">
        <div className="container">
          <div className="section-head hiw-section-head section-head-numbered">
            <span className="section-number">№ 03</span>
            <span className="eyebrow hiw-eyebrow">{t("tokenEyebrow")}</span>
            <h2 className="hiw-section-h2">{t("tokenTitle")}</h2>
            <p className="muted hero-lede hiw-section-lede">{t("tokenDesc")}</p>
          </div>

          <div className="ec-token-grid">
            <div className="ec-alloc-panel glass" aria-label={t("tokenAllocCaption")}>
              <div className="ec-alloc-head">
                <Coins size={18} className="ec-alloc-head-icon" aria-hidden />
                <span>{t("tokenAllocCaption")}</span>
              </div>
              <ul className="ec-alloc-list">
                {allocations.map((alloc) => (
                  <li key={alloc.label} className="ec-alloc-item">
                    <div className="ec-alloc-row">
                      <span className="ec-alloc-label">{alloc.label}</span>
                      <span className="ec-alloc-pct">{alloc.pct}</span>
                    </div>
                    <span className="ec-alloc-bar" aria-hidden>
                      <span className="ec-alloc-fill" style={{ inlineSize: alloc.pct }} />
                    </span>
                    <p className="ec-alloc-note muted">{alloc.note}</p>
                  </li>
                ))}
              </ul>
            </div>

            <aside className="ec-disclaimer card">
              <div className="ec-disclaimer-head">
                <ShieldCheck size={18} className="ec-disclaimer-icon" aria-hidden />
                <h3 className="ec-disclaimer-title">{t("tokenDisclaimerTitle")}</h3>
              </div>
              <p className="ec-disclaimer-body">{t("tokenDisclaimer")}</p>
              <p className="ec-disclaimer-legal muted">
                <ScrollText size={14} className="ec-disclaimer-legal-icon" aria-hidden />
                <span>{t("tokenLegalNote")}</span>
              </p>
            </aside>
          </div>
        </div>
      </section>

      {/* ═══ № 04 — The moat compounds — card grid ═════════════ */}
      <section className="section ec-moat-section">
        <div className="container">
          <div className="section-head hiw-section-head section-head-numbered">
            <span className="section-number">№ 04</span>
            <span className="eyebrow hiw-eyebrow">{t("moatEyebrow")}</span>
            <h2 className="hiw-section-h2">{t("moatTitle")}</h2>
            <p className="muted hero-lede hiw-section-lede">{t("moatDesc")}</p>
          </div>
          <ol className="ec-moat-grid card-grid-animated">
            {moats.map((moat, i) => (
              <li key={`moat-${i}`} className="card ec-moat-card">
                <div className="ec-moat-head">
                  <span className="ec-moat-index" aria-hidden>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="ec-moat-icon" aria-hidden>{moat.icon}</span>
                </div>
                <h3 className="ec-moat-title">{moat.title}</h3>
                <p className="ec-moat-body">{moat.body}</p>
              </li>
            ))}
          </ol>
          <p className="ec-moat-close">
            <Landmark size={18} className="ec-moat-close-icon" aria-hidden />
            <span>{t("moatClose")}</span>
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
