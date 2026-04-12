import type { Metadata } from "next";
import { Network, ShieldCheck, Scale, Workflow, FileCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    title: t("title"),
    description: t("description"),
    openGraph: {
      title: t("title"),
      description: t("description"),
      type: "website",
    },
  };
}

export default async function HomePage() {
  const t = await getTranslations("home");

  const steps = [
    { icon: <Network size={22} />, label: t("stepNodeLabel"), desc: t("stepNodeDesc") },
    { icon: <Workflow size={22} />, label: t("stepDealLabel"), desc: t("stepDealDesc") },
    { icon: <FileCheck size={22} />, label: t("stepTaskLabel"), desc: t("stepTaskDesc") },
    { icon: <ShieldCheck size={22} />, label: t("stepProofLabel"), desc: t("stepProofDesc") },
    { icon: <Scale size={22} />, label: t("stepSettlementLabel"), desc: t("stepSettlementDesc") },
  ];

  return (
    <main>
      <section className="hero hero-orb">
        <div className="container">
          <div className="hero-center">
            <span className="eyebrow">{t("eyebrow")}</span>
            <h1>{t("headline")}</h1>
            <p className="hero-lede">{t("lede")}</p>
            <div className="cta-row cta-centered">
              <Link href="/apply" className="button">{t("applyAsNode")}</Link>
              <Link href="/wiki" className="button-secondary">{t("readWiki")}</Link>
            </div>
          </div>

          <div className="hero-panels card-grid-animated" style={{ marginTop: 36 }}>
            <div className="kpi kpi-centered">
              <div className="kpi-icon-wrap">
                <Network size={28} strokeWidth={1.5} />
              </div>
              <strong>{t("nodeTitle")}</strong>
              <span className="muted">{t("nodeDesc")}</span>
            </div>
            <div className="kpi kpi-centered">
              <div className="kpi-icon-wrap">
                <ShieldCheck size={28} strokeWidth={1.5} />
              </div>
              <strong>{t("pobTitle")}</strong>
              <span className="muted">{t("pobDesc")}</span>
            </div>
            <div className="kpi kpi-centered">
              <div className="kpi-icon-wrap">
                <Scale size={28} strokeWidth={1.5} />
              </div>
              <strong>{t("settlementTitle")}</strong>
              <span className="muted">{t("settlementDesc")}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="section-head">
            <h2>{t("designedTitle")}</h2>
            <p className="muted">{t("designedDesc")}</p>
          </div>

          <div className="grid-3 card-grid-animated">
            <div className="card step-card">
              <span className="step-card-number">1</span>
              <h3>{t("clearPrimitives")}</h3>
              <p>{t("clearPrimitivesDesc")}</p>
            </div>
            <div className="card step-card">
              <span className="step-card-number">2</span>
              <h3>{t("verifiableWork")}</h3>
              <p>{t("verifiableWorkDesc")}</p>
            </div>
            <div className="card step-card">
              <span className="step-card-number">3</span>
              <h3>{t("alignedIncentives")}</h3>
              <p>{t("alignedIncentivesDesc")}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">{t("trustedByEyebrow")}</span>
            <h2>{t("trustedByTitle")}</h2>
            <p className="muted">{t("trustedByDesc")}</p>
          </div>
          <div className="grid-5" style={{ opacity: 0.55 }}>
            {[t("capitalPartners"), t("regionalHubs"), t("aiLabs"), t("legalAudit"), t("marketMakers")].map((name) => (
              <div key={name} className="logo-tile">
                <span>{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-divider">
        <div className="container">
          <div className="card" style={{ padding: "32px 28px" }}>
            <div className="section-head">
              <h2>{t("loopTitle")}</h2>
              <p className="muted">{t("loopDesc")}</p>
            </div>
            <div className="flow flow-centered" style={{ marginTop: 24 }}>
              {steps.map((step, index) => (
                <div key={step.label} style={{ display: "contents" }}>
                  <div className="step step-vertical">
                    <span className="step-icon">{step.icon}</span>
                    <span className="step-name">{step.label}</span>
                    <span className="step-desc">{step.desc}</span>
                  </div>
                  {index < 4 && <span className="arrow" style={{ fontSize: 20, marginTop: 10 }}>→</span>}
                </div>
              ))}
            </div>
            <div className="cta-row cta-centered" style={{ marginTop: 28 }}>
              <Link href="/how-it-works" className="button-secondary">{t("howItWorks")}</Link>
              <Link href="/nodes" className="button-secondary">{t("exploreNodes")}</Link>
              <Link href="/apply" className="button">{t("applyAsANode")}</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="section-head">
            <h2>{t("buildersSay")}</h2>
          </div>
          <div className="grid-3 card-grid-animated">
            <div className="card testimonial">
              <p>&ldquo;{t("testimonial1")}&rdquo;</p>
              <p className="testimonial-author">{t("testimonial1Author")}</p>
            </div>
            <div className="card testimonial">
              <p>&ldquo;{t("testimonial2")}&rdquo;</p>
              <p className="testimonial-author">{t("testimonial2Author")}</p>
            </div>
            <div className="card testimonial">
              <p>&ldquo;{t("testimonial3")}&rdquo;</p>
              <p className="testimonial-author">{t("testimonial3Author")}</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
