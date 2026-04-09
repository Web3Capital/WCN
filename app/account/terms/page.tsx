"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type TermsDoc = {
  type: string;
  label: string;
  version: string;
  summary: string;
};

const REQUIRED_TERMS: TermsDoc[] = [
  {
    type: "NDA",
    label: "Non-Disclosure Agreement",
    version: "1.0",
    summary: "You agree not to disclose confidential information shared within the WCN platform to unauthorized third parties.",
  },
  {
    type: "TERMS",
    label: "Platform Terms of Service",
    version: "1.0",
    summary: "You agree to abide by the WCN Operating Console terms of service, including data handling, usage policies, and dispute resolution procedures.",
  },
  {
    type: "CODE_OF_CONDUCT",
    label: "Code of Conduct",
    version: "1.0",
    summary: "You agree to maintain professional standards, avoid conflicts of interest, and participate in good faith across all WCN operations.",
  },
];

type Acceptance = { documentType: string; documentVer: string };

export default function TermsAcceptancePage() {
  const router = useRouter();
  const [accepted, setAccepted] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/terms")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          const keys = new Set(
            (d.acceptances as Acceptance[]).map(
              (a) => `${a.documentType}:${a.documentVer}`
            )
          );
          setAccepted(keys);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const allAccepted = REQUIRED_TERMS.every((t) =>
    accepted.has(`${t.type}:${t.version}`)
  );

  async function handleAccept(doc: TermsDoc) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentType: doc.type, documentVer: doc.version }),
      });
      const data = await res.json();
      if (data.ok) {
        setAccepted((prev) => new Set([...prev, `${doc.type}:${doc.version}`]));
      } else {
        setError(data.error || "Failed to accept.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  async function handleAcceptAll() {
    setBusy(true);
    setError("");
    for (const doc of REQUIRED_TERMS) {
      if (accepted.has(`${doc.type}:${doc.version}`)) continue;
      try {
        const res = await fetch("/api/terms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentType: doc.type, documentVer: doc.version }),
        });
        const data = await res.json();
        if (data.ok) {
          setAccepted((prev) => new Set([...prev, `${doc.type}:${doc.version}`]));
        }
      } catch {
        setError("Network error.");
        break;
      }
    }
    setBusy(false);
  }

  if (loading) {
    return (
      <main className="section">
        <div className="container" style={{ maxWidth: 560 }}>
          <p className="muted">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 560 }}>
        <span className="eyebrow">Onboarding</span>
        <h1>Terms & Agreements</h1>
        <div className="card" style={{ marginTop: 18 }}>
          <p className="muted" style={{ marginBottom: 20 }}>
            Please review and accept the following agreements before continuing.
          </p>

          <div style={{ display: "grid", gap: 16 }}>
            {REQUIRED_TERMS.map((doc) => {
              const isAccepted = accepted.has(`${doc.type}:${doc.version}`);
              return (
                <div
                  key={doc.type}
                  className="card"
                  style={{
                    padding: 16,
                    border: isAccepted ? "1px solid var(--green)" : "1px solid var(--line)",
                    background: isAccepted ? "color-mix(in oklab, var(--green) 5%, transparent)" : undefined,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <strong style={{ fontSize: 14 }}>{doc.label}</strong>
                    <span className={`badge ${isAccepted ? "badge-green" : ""}`} style={{ fontSize: 10 }}>
                      {isAccepted ? "Accepted" : `v${doc.version}`}
                    </span>
                  </div>
                  <p className="muted" style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>
                    {doc.summary}
                  </p>
                  {!isAccepted && (
                    <button
                      className="button"
                      onClick={() => handleAccept(doc)}
                      disabled={busy}
                      style={{ marginTop: 10, fontSize: 12, padding: "6px 16px" }}
                    >
                      Accept
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {error && <p style={{ color: "var(--red)", margin: "12px 0 0", fontSize: 13 }}>{error}</p>}

          <div style={{ marginTop: 20, display: "flex", gap: 10, justifyContent: "flex-end" }}>
            {!allAccepted && (
              <button className="button" onClick={handleAcceptAll} disabled={busy}>
                {busy ? "Processing..." : "Accept All"}
              </button>
            )}
            {allAccepted && (
              <button className="button" onClick={() => router.push("/dashboard")}>
                Continue to Dashboard
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
