import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Landmark, Box, Wrench, Globe, Megaphone, Factory } from "lucide-react";
import { ApplyForm } from "./ui";
import { VoltageCallout } from "@/components/brand/voltage-callout";

const NODE_TYPES: { icon: ReactNode; titleKey: string; descKey: string }[] = [
  { icon: <Landmark size={18} strokeWidth={1.4} />, titleKey: "capitalTitle", descKey: "capitalDesc" },
  { icon: <Box size={18} strokeWidth={1.4} />, titleKey: "projectTitle", descKey: "projectDesc" },
  { icon: <Wrench size={18} strokeWidth={1.4} />, titleKey: "serviceTitle", descKey: "serviceDesc" },
  { icon: <Globe size={18} strokeWidth={1.4} />, titleKey: "regionalTitle", descKey: "regionalDesc" },
  { icon: <Megaphone size={18} strokeWidth={1.4} />, titleKey: "mediaTitle", descKey: "mediaDesc" },
  { icon: <Factory size={18} strokeWidth={1.4} />, titleKey: "industryTitle", descKey: "industryDesc" },
];

const STEPS = [
  { num: 1, titleKey: "step1Title" as const, descKey: "step1Desc" as const },
  { num: 2, titleKey: "step2Title" as const, descKey: "step2Desc" as const },
  { num: 3, titleKey: "step3Title" as const, descKey: "step3Desc" as const },
  { num: 4, titleKey: "step4Title" as const, descKey: "step4Desc" as const },
] as const;

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "apply" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function ApplyPage() {
  const t = await getTranslations("apply");

  return (
    <main className="apply-page apply-page-sovereign">
      <div className="container">
        <header className="apply-hero apply-hero-sovereign">
          <div className="apply-masthead" aria-hidden>
            <span className="apply-masthead-mark">№ 06</span>
            <span className="apply-masthead-rule" />
            <span className="apply-masthead-section">{t("eyebrow")}</span>
            <span className="apply-masthead-rule" />
            <span className="apply-masthead-meta">Volume · MMXXVI</span>
          </div>
          <h1>{t.rich("headline", { em: (chunks) => <em>{chunks}</em> })}</h1>
          <p className="apply-hero-desc apply-hero-desc--dropcap">{t("heroDesc")}</p>
        </header>

        <div className="apply-layout">
          <div className="apply-form-col">
            <div className="card apply-form-card">
              <ApplyForm />
            </div>
          </div>

          <aside className="apply-info-col">
            <div className="apply-info-card">
              <span className="apply-info-kicker">
                <span className="apply-info-kicker-num">№ 01</span>
                <span className="apply-info-kicker-rule" aria-hidden />
                <span className="apply-info-kicker-label">{t("howItWorks")}</span>
              </span>
              <ol className="apply-steps">
                {STEPS.map((step) => (
                  <li key={step.num} className="apply-step">
                    <span className="apply-step-num" aria-hidden>{String(step.num).padStart(2, "0")}</span>
                    <div className="apply-step-text">
                      <strong>{t(step.titleKey)}</strong>
                      <p>{t(step.descKey)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="apply-info-card">
              <span className="apply-info-kicker">
                <span className="apply-info-kicker-num">№ 02</span>
                <span className="apply-info-kicker-rule" aria-hidden />
                <span className="apply-info-kicker-label">{t("nodeTypesTitle")}</span>
              </span>
              <ol className="apply-node-types">
                {NODE_TYPES.map((node, i) => (
                  <li key={node.titleKey} className="apply-node-type">
                    <span className="apply-node-num" aria-hidden>{String(i + 1).padStart(2, "0")}</span>
                    <span className="apply-node-icon" aria-hidden>{node.icon}</span>
                    <div className="apply-node-text">
                      <strong>{t(node.titleKey)}</strong>
                      <p>{t(node.descKey)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="apply-tip-card">
              <span className="apply-tip-kicker">
                <span className="apply-tip-kicker-rule" aria-hidden />
                {t("tipLabel")}
              </span>
              <p>{t("tipMessage")}</p>
            </div>
          </aside>
        </div>
      </div>

      <VoltageCallout
        eyebrow={t("ctaEyebrow")}
        title={t("ctaTitle")}
        desc={t("ctaDesc")}
        primaryLabel={t("ctaPrimary")}
        primaryHref="/wiki"
        secondaryLabel={t("ctaSecondary")}
        secondaryHref="/how-it-works"
      />
    </main>
  );
}
