"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TwoFactorSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<"generate" | "verify" | "done">("generate");
  const [secret, setSecret] = useState("");
  const [otpauthUrl, setOtpauthUrl] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/account/2fa/setup", { method: "POST" });
      const data = await res.json();
      if (!data.ok) { setError(data.error || "Failed to generate."); return; }
      setSecret(data.secret);
      setOtpauthUrl(data.otpauthUrl);
      setStep("verify");
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/account/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error || "Verification failed."); return; }
      setStep("done");
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="section" style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="container" style={{ maxWidth: 480 }}>
        <div className="card" style={{ padding: 32 }}>
          <h1 style={{ fontSize: 22, marginBottom: 4 }}>Two-Factor Authentication</h1>

          {step === "generate" ? (
            <>
              <p className="muted" style={{ marginBottom: 16 }}>
                Secure your account with a TOTP authenticator app (Google Authenticator, Authy, 1Password, etc.)
              </p>
              {error ? <p style={{ color: "var(--red)", margin: "0 0 12px", fontSize: 13 }}>{error}</p> : null}
              <button className="button" onClick={handleGenerate} disabled={busy} style={{ width: "100%" }}>
                {busy ? "Generating..." : "Generate secret"}
              </button>
            </>
          ) : step === "verify" ? (
            <>
              <p className="muted" style={{ marginBottom: 12 }}>
                Scan the QR code or enter the secret manually in your authenticator app:
              </p>
              <div className="card" style={{ padding: 16, textAlign: "center", marginBottom: 16, wordBreak: "break-all", fontFamily: "monospace", fontSize: 13 }}>
                {secret}
              </div>
              <p className="muted" style={{ fontSize: 12, marginBottom: 12 }}>
                OTP Auth URL: <code style={{ fontSize: 11 }}>{otpauthUrl}</code>
              </p>
              <form onSubmit={handleVerify} style={{ display: "grid", gap: 12 }}>
                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  required
                  maxLength={6}
                  style={{ textAlign: "center", fontSize: 20, letterSpacing: 8 }}
                />
                {error ? <p style={{ color: "var(--red)", margin: 0, fontSize: 13 }}>{error}</p> : null}
                <button type="submit" className="button" disabled={busy || code.length !== 6} style={{ width: "100%" }}>
                  {busy ? "Verifying..." : "Verify & enable"}
                </button>
              </form>
            </>
          ) : (
            <>
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <div className="badge badge-green" style={{ fontSize: 14, padding: "10px 16px", marginBottom: 16 }}>
                  2FA enabled successfully
                </div>
                <p className="muted">Your account is now secured with two-factor authentication.</p>
                <button className="button" onClick={() => router.push("/dashboard")} style={{ marginTop: 16 }}>
                  Go to Dashboard
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
