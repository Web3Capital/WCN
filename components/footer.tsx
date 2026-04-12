"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export function Footer() {
  const t = useTranslations("footer");
  const nav = useTranslations("nav");

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col">
            <div className="brand">
              <span className="brand-mark">W³</span>
              <span>WCN</span>
            </div>
            <p className="muted footer-tagline">{t("tagline")}</p>
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
          <p className="muted footer-copyright">
            {t("copyright", { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>
    </footer>
  );
}
