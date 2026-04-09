"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

export default function TwoFactorChallengePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const email = searchParams.get("email") ?? "";
  const next = searchParams.get("next") ?? "/dashboard";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (code.length !== 6) { setError("Please enter a 6-digit code."); return; }

    setBusy(true);
    try {
      const res = await signIn("credentials", {
        email,
        password: "__2fa_challenge__",
        twoFactorCode: code,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid code. Please try again.");
        return;
      }

      router.push(next);
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="section" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="container" style={{ maxWidth: 420 }}>
        <div className="card" style={{ padding: 32 }}>
          <h1 style={{ fontSize: 22, marginBottom: 4 }}>Two-Factor Verification</h1>
          <p className="muted" style={{ marginBottom: 20 }}>
            Enter the 6-digit code from your authenticator app.
          </p>

          <form onSubmit={handleSubmit} className="form">
            <label className="field">
              <span className="label">Verification code</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
                maxLength={6}
                style={{ textAlign: "center", fontSize: 24, letterSpacing: 10, fontWeight: 700 }}
                autoFocus
              />
            </label>

            {error && <p className="form-error" role="alert">{error}</p>}

            <button
              type="submit"
              className="button"
              disabled={busy || code.length !== 6}
              style={{ width: "100%" }}
            >
              {busy ? "Verifying..." : "Verify"}
            </button>
          </form>

          <p className="muted" style={{ marginTop: 16, fontSize: 12, textAlign: "center" }}>
            Lost access to your authenticator? Contact your administrator.
          </p>
        </div>
      </div>
    </main>
  );
}
