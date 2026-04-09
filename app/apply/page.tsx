import { ApplyForm } from "./ui";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Apply as a Node — WCN",
  description:
    "Join the WCN network as a node. Submit your application to become a capital, project, service, or regional node.",
};

export default function ApplyPage() {
  return (
    <main className="apply-page">
      <div className="container">
        <div className="apply-hero">
          <span className="eyebrow">Node Application</span>
          <h1>Apply as a node.</h1>
          <p className="apply-hero-desc">
            WCN is an invite-and-application network. Submit your information
            below and our team will review within 48 hours.
          </p>
        </div>

        <div className="apply-layout">
          <div className="apply-form-col">
            <div className="card apply-form-card">
              <ApplyForm />
            </div>
          </div>

          <div className="apply-info-col">
            <div className="card apply-info-card">
              <h3 className="apply-info-title">How it works</h3>
              <div className="apply-steps">
                <div className="apply-step">
                  <span className="apply-step-num">1</span>
                  <div>
                    <strong>Submit application</strong>
                    <p>Fill out the form with your background and resources.</p>
                  </div>
                </div>
                <div className="apply-step">
                  <span className="apply-step-num">2</span>
                  <div>
                    <strong>Team review</strong>
                    <p>
                      Our team evaluates fit, resources, and network alignment.
                    </p>
                  </div>
                </div>
                <div className="apply-step">
                  <span className="apply-step-num">3</span>
                  <div>
                    <strong>Intro call</strong>
                    <p>
                      Qualified applicants are invited to a 30-minute intro
                      call.
                    </p>
                  </div>
                </div>
                <div className="apply-step">
                  <span className="apply-step-num">4</span>
                  <div>
                    <strong>Onboarding</strong>
                    <p>
                      Seat assignment, Node NFT, permissions, and platform
                      access.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card apply-info-card">
              <h3 className="apply-info-title">Node types</h3>
              <div className="apply-node-types">
                <div className="apply-node-type">
                  <span className="apply-node-icon">💰</span>
                  <div>
                    <strong>Capital Node</strong>
                    <p>VC, family office, fund, angel investor</p>
                  </div>
                </div>
                <div className="apply-node-type">
                  <span className="apply-node-icon">📦</span>
                  <div>
                    <strong>Project Node</strong>
                    <p>Protocol, DApp, infrastructure, AI project</p>
                  </div>
                </div>
                <div className="apply-node-type">
                  <span className="apply-node-icon">🔧</span>
                  <div>
                    <strong>Service Node</strong>
                    <p>Legal, audit, security, development, growth</p>
                  </div>
                </div>
                <div className="apply-node-type">
                  <span className="apply-node-icon">🌍</span>
                  <div>
                    <strong>Regional Node</strong>
                    <p>Country lead, city hub, local network connector</p>
                  </div>
                </div>
                <div className="apply-node-type">
                  <span className="apply-node-icon">📣</span>
                  <div>
                    <strong>Media / KOL Node</strong>
                    <p>Media outlet, KOL, community, event organizer</p>
                  </div>
                </div>
                <div className="apply-node-type">
                  <span className="apply-node-icon">🏭</span>
                  <div>
                    <strong>Industry Node</strong>
                    <p>Exchange, market maker, custodian, data provider</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card apply-info-card apply-tip-card">
              <p>
                <strong>Tip:</strong> Applications with specific resource
                descriptions and clear alignment with the WCN network have a
                significantly higher approval rate.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
