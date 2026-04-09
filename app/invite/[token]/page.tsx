"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function InviteActivationPage() {
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
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }

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
        setSuccess("Account created! Redirecting to 2FA setup...");
        setTimeout(() => router.push("/login?next=/account/2fa"), 1500);
      } else {
        setSuccess("Account activated! Redirecting to login...");
        setTimeout(() => router.push("/login"), 1500);
      }
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="section" style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="container" style={{ maxWidth: 440 }}>
        <div className="card" style={{ padding: 32 }}>
          <h1 style={{ fontSize: 22, marginBottom: 4 }}>Activate your account</h1>
          <p className="muted" style={{ marginBottom: 20 }}>Set your password to join the WCN network.</p>

          {success ? (
            <div className="badge badge-green" style={{ fontSize: 14, padding: "10px 16px" }}>{success}</div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
              <input
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Password (min 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              <input
                type="password"
                placeholder="Confirm password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
              {error ? <p style={{ color: "var(--red)", margin: 0, fontSize: 13 }}>{error}</p> : null}
              <button type="submit" className="button" disabled={busy} style={{ width: "100%" }}>
                {busy ? "Activating..." : "Activate account"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
