"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [needs2fa, setNeeds2fa] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", {
      email,
      password,
      ...(needs2fa ? { totpCode } : {}),
      redirect: false,
    });

    setLoading(false);

    if (res?.error === "2FA_REQUIRED") {
      setNeeds2fa(true);
      setError(null);
      return;
    }

    if (res?.error === "INVALID_2FA_CODE") {
      setError("Invalid verification code. Please try again.");
      setTotpCode("");
      return;
    }

    if (res?.error === "ACCOUNT_LOCKED") {
      setError("Your account has been locked due to too many failed login attempts. Please contact support to unlock your account.");
      return;
    }

    if (res?.error === "ACCOUNT_SUSPENDED") {
      setError("Your account has been suspended. Please contact support for assistance.");
      return;
    }

    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }
    window.location.href = "/dashboard";
  }

  return (
    <form onSubmit={onSubmit} className="form">
      <label className="field">
        <span className="label">Email</span>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          autoComplete="email"
          required
          placeholder="you@company.com"
          disabled={needs2fa}
        />
      </label>

      <label className="field">
        <span className="label">Password</span>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          autoComplete="current-password"
          required
          placeholder="Enter your password"
          disabled={needs2fa}
        />
      </label>

      {needs2fa && (
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, marginTop: 4 }}>
          <p className="muted" style={{ margin: "0 0 12px", fontSize: 13 }}>
            Enter the 6-digit code from your authenticator app.
          </p>
          <label className="field">
            <span className="label">Verification code</span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
              maxLength={6}
              style={{ textAlign: "center", fontSize: 20, letterSpacing: 8, fontWeight: 700 }}
              autoFocus
            />
          </label>
        </div>
      )}

      {error ? <p className="form-error" role="alert">{error}</p> : null}

      <button className="button auth-submit" type="submit" disabled={loading || (needs2fa && totpCode.length !== 6)}>
        {loading ? "Signing in..." : needs2fa ? "Verify & sign in" : "Sign in"}
      </button>

      {needs2fa && (
        <button
          type="button"
          className="button-secondary"
          style={{ width: "100%", marginTop: 8 }}
          onClick={() => { setNeeds2fa(false); setTotpCode(""); setError(null); }}
        >
          Back to login
        </button>
      )}
    </form>
  );
}
