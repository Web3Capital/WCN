"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAutoTranslate } from "@/lib/i18n/auto-translate-provider";

export default function InviteActivationClient() {
  const { t } = useAutoTranslate();
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError(t("Password must be at least 8 characters.")); return; }
    if (password !== confirm) { setError(t("Passwords do not match.")); return; }

    setBusy(true);
    try {
      const res = await fetch(`/api/invites/${token}/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error || "Activation failed."); return; }

      if (data.needs2FA) {
        setSuccess(t("Account created! Redirecting to 2FA setup..."));
        setTimeout(() => router.push("/login?next=/account/2fa"), 1500);
      } else {
        setSuccess(t("Account activated! Redirecting to login..."));
        setTimeout(() => router.push("/login"), 1500);
      }
    } catch {
      setError(t("Network error."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 480 }}>
        <span className="eyebrow">{t("Welcome")}</span>
        <h1>{t("Activate your account")}</h1>
        <div className="card" style={{ marginTop: 18 }}>
          <p className="muted" style={{ marginBottom: 20 }}>{t("Set your password to join the WCN network.")}</p>

          {success ? (
            <div className="badge badge-green" role="status" style={{ fontSize: 14, padding: "10px 16px" }}>{success}</div>
          ) : (
            <form onSubmit={handleSubmit} className="form">
              <label className="field">
                <span className="label">{t("Full name")}</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </label>
              <label className="field">
                <span className="label">{t("Password (min 8 characters)")}</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </label>
              <label className="field">
                <span className="label">{t("Confirm password")}</span>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </label>
              {error ? <p className="form-error" role="alert">{error}</p> : null}
              <button type="submit" className="button" disabled={busy} style={{ width: "100%" }}>
                {busy ? t("Activating...") : t("Activate account")}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
