"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || null, email, password })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Signup failed.");

      setSuccess(true);

      const login = await signIn("credentials", { email, password, redirect: false });
      if (!login?.error) {
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      setError(err?.message ?? "Signup failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="form">
      <label className="field">
        <span className="label">Name (optional)</span>
        <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
      </label>

      <label className="field">
        <span className="label">Email</span>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          autoComplete="email"
          required
        />
      </label>

      <label className="field">
        <span className="label">Password</span>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </label>

      {error ? <p className="form-error" role="alert">{error}</p> : null}
      {success ? <p className="muted" role="status">Account created. Signing you in…</p> : null}

      <button className="button" type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create account"}
      </button>
    </form>
  );
}

