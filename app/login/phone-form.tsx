"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";

export function PhoneLoginForm() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const sendCode = useCallback(async () => {
    if (!phone || countdown > 0) return;
    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (data.ok) {
        setCodeSent(true);
        setCountdown(60);
      } else {
        setError(data.error ?? "Failed to send code");
      }
    } catch {
      setError("Network error");
    } finally {
      setSending(false);
    }
  }, [phone, countdown]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone || !code) return;
    setLoading(true);
    setError(null);

    const res = await signIn("phone", {
      phone,
      code,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Invalid code. Please try again.");
      setCode("");
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <form onSubmit={onSubmit} className="form">
      <label className="field">
        <span className="label">Phone number</span>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            type="tel"
            autoComplete="tel"
            required
            placeholder="+86 138 0000 0000"
            style={{ flex: 1 }}
            disabled={codeSent}
          />
          <button
            type="button"
            className="button"
            onClick={sendCode}
            disabled={!phone || sending || countdown > 0}
            style={{ whiteSpace: "nowrap", minWidth: 120 }}
          >
            {sending ? "Sending..." : countdown > 0 ? `${countdown}s` : codeSent ? "Resend" : "Send Code"}
          </button>
        </div>
      </label>

      {codeSent && (
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
            style={{ textAlign: "center", fontSize: 20, letterSpacing: 8, fontWeight: 700 }}
            autoFocus
          />
        </label>
      )}

      {error && <p className="form-error" role="alert">{error}</p>}

      <button
        className="button auth-submit"
        type="submit"
        disabled={loading || !codeSent || code.length !== 6}
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
