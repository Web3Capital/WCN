import Link from "next/link";

export function Footer() {
  return (
    <footer className="footer">
      <div className="container" style={{ padding: "48px 0 32px" }}>
        <div className="footer-grid">
          <div className="footer-col">
            <div className="brand">
              <span className="brand-mark" />
              <span>WCN</span>
            </div>
            <p className="muted" style={{ marginTop: 12, fontSize: 14, lineHeight: 1.6 }}>
              Global Institutional Orchestrator for Web3 & AI. Turning fragmented capital and execution into a verifiable, settleable network.
            </p>
          </div>
          <div className="footer-col">
            <h4>Product</h4>
            <Link href="/how-it-works">How It Works</Link>
            <Link href="/nodes">Node Network</Link>
            <Link href="/pob">Proof of Business</Link>
            <Link href="/apply">Apply as a Node</Link>
          </div>
          <div className="footer-col">
            <h4>Resources</h4>
            <Link href="/docs">Documentation</Link>
            <Link href="/about">About WCN</Link>
            <Link href="/dashboard/assets">Phase 3 Roadmap</Link>
          </div>
          <div className="footer-col">
            <h4>Connect</h4>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">Twitter / X</a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href="https://t.me" target="_blank" rel="noopener noreferrer">Telegram</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>
            &copy; {new Date().getFullYear()} WCN Network. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
