"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useAutoTranslate } from "@/lib/i18n/auto-translate-provider";

export default function TwoFactorChallengeClient() {
  const { t } = useAutoTranslate();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const next = searchParams.get("next") ?? "/dashboard";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (code.length !== 6) { setError(t("Please enter a 6-digit code.")); return; }

    setBusy(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        totpCode: code,
        redirect: false,
      });

      if (res?.error === "INVALID_2FA_CODE") {
        setError(t("Invalid code. Please try again."));
        setCode("");
        return;
      }

      if (res?.error) {
        setError(t("Authentication failed. Check your credentials and try again."));
        return;
      }

      router.push(next);
    } catch {
      setError(t("Network error."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 420 }}>
        <span className="eyebrow">{t("Security")}</span>
        <h1>{t("Two-Factor Verification")}</h1>
        <div className="card" style={{ marginTop: 18 }}>
          <p className="muted" style={{ marginBottom: 20 }}>
            {t("Enter your credentials and the 6-digit code from your authenticator app.")}
          </p>

          <form onSubmit={handleSubmit} className="form">
            <label className="field">
              <span className="label">{t("Email")}</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
              />
            </label>

            <label className="field">
              <span className="label">{t("Password")}</span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder={t("Enter your password")}
              />
            </label>

            <label className="field">
              <span className="label">{t("Verification code")}</span>
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
              {busy ? t("Verifying...") : t("Verify & Sign in")}
            </button>
          </form>

          <p className="muted" style={{ marginTop: 16, fontSize: 12, textAlign: "center" }}>
            {t("Lost access to your authenticator? Contact your administrator.")}
          </p>
        </div>
      </div>
    </main>
  );
}
