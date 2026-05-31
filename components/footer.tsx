"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { WCNMark } from "@/components/brand/wcn-mark";

/**
 * Footer — the published document's colophon.
 *
 * Not a link farm: it closes the page like the back-matter of a sovereign
 * paper. A serif closing statement (the whitepaper's last line) over a bronze
 * seal, then structured index columns, the compliance line, and a typeface
 * colophon. The seal is the footer's single bronze (authority) mark.
 */
export function Footer() {
  const t = useTranslations("footer");
  const nav = useTranslations("nav");
  const year = new Date().getFullYear();

  return (
    <footer className="footer footer-colophon">
      <div className="container">
        <div className="footer-statement">
          <WCNMark size={44} />
          <p className="footer-motto">{t("motto")}</p>
        </div>

        <div className="footer-grid">
          <div className="footer-col footer-col-brand">
            <Link href="/" className="brand" aria-label="Web3 Capital Network — Sovereign Proof Ledger">
              <WCNMark size={26} />
              <span className="brand-wordmark">
                <span className="wcn-wordmark">WCN</span>
                <span className="brand-divider" aria-hidden />
                <span className="brand-tagline">Sovereign Proof Ledger</span>
              </span>
            </Link>
            <p className="footer-tagline">{t("tagline")}</p>
          </div>

          <nav className="footer-col" aria-label={t("network")}>
            <h4>{t("network")}</h4>
            <Link href="/nodes">{nav("nodeNetwork")}</Link>
            <Link href="/pob">{t("proofOfBusiness")}</Link>
            <Link href="/how-it-works">{nav("howItWorks")}</Link>
            <Link href="/apply">{nav("applyAsNode")}</Link>
          </nav>

          <nav className="footer-col" aria-label={t("resources")}>
            <h4>{t("resources")}</h4>
            <Link href="/wiki">{nav("wiki")}</Link>
            <Link href="/about">{t("aboutWcn")}</Link>
            <Link href="/wiki">{t("phase3Roadmap")}</Link>
          </nav>

          <nav className="footer-col" aria-label={t("connect")}>
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
          </nav>
        </div>

        <div className="footer-bottom">
          <p className="footer-copyright">{t("copyright", { year })}</p>
          <span className="footer-meta">
            <span>Edition v4.0</span>
            <span className="footer-meta-dot" aria-hidden />
            <span>audit-first</span>
            <span className="footer-meta-dot" aria-hidden />
            <span>three-ledger</span>
          </span>
        </div>

        <p className="footer-colophon-set">{t("colophon")}</p>
        <p className="footer-legal">{t("legal")}</p>
      </div>
    </footer>
  );
}
