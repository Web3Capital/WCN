"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { WCNGlyph } from "@/components/brand/wcn-glyph";

export function Footer() {
  const t = useTranslations("footer");
  const nav = useTranslations("nav");

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col">
            <Link href="/" className="brand" aria-label="WCN — World Citizen Network">
              <span className="brand-mark">
                <WCNGlyph size={16} />
              </span>
              <span className="brand-wordmark">
                <span>WCN</span>
                <span className="brand-divider" aria-hidden />
                <span className="brand-tagline">Citizen Ledger</span>
              </span>
            </Link>
            <p className="footer-tagline">{t("tagline")}</p>
          </div>
          <div className="footer-col">
            <h4>{t("product")}</h4>
            <Link href="/how-it-works">{nav("howItWorks")}</Link>
            <Link href="/nodes">{nav("nodeNetwork")}</Link>
            <Link href="/pob">{t("proofOfBusiness")}</Link>
            <Link href="/apply">{nav("applyAsNode")}</Link>
          </div>
          <div className="footer-col">
            <h4>{t("resources")}</h4>
            <Link href="/wiki">{nav("wiki")}</Link>
            <Link href="/about">{t("aboutWcn")}</Link>
            <Link href="/wiki">{t("phase3Roadmap")}</Link>
          </div>
          <div className="footer-col">
            <h4>{t("connect")}</h4>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
              {t("twitterX")}
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer">
              {t("github")}
            </a>
            <a href="https://t.me" target="_blank" rel="noopener noreferrer">
              {t("telegram")}
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <p className="footer-copyright">
            {t("copyright", { year: new Date().getFullYear() })}
          </p>
          <span className="footer-meta">
            <span>v3.0 · Sovereign</span>
            <span className="footer-meta-dot" aria-hidden />
            <span>audit-first protocol</span>
            <span className="footer-meta-dot" aria-hidden />
            <span>three-ledger model</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
