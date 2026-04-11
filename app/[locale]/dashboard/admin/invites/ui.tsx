"use client";

import { useState } from "react";
import { useAutoTranslate } from "@/lib/i18n/auto-translate-provider";
import { EmptyState } from "../../_components";

type InviteRow = {
  id: string;
  email: string;
  tokenHash: string;
  role: string;
  expiresAt: string;
  activatedAt: string | null;
  revokedAt: string | null;
  createdBy: string;
  createdAt: string;
};

const ROLES = [
  "FOUNDER", "ADMIN", "FINANCE_ADMIN", "NODE_OWNER", "PROJECT_OWNER",
  "CAPITAL_NODE", "SERVICE_NODE", "REVIEWER", "RISK_DESK", "AGENT_OWNER", "OBSERVER"
];

export function InviteConsole({ initialInvites }: { initialInvites: InviteRow[] }) {
  const { t } = useAutoTranslate();
  const [invites, setInvites] = useState(initialInvites);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("NODE_OWNER");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [lastToken, setLastToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function createInvite(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setLastToken(null);
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error || t("Failed.")); return; }
      const inv = data.data;
      setLastToken(inv.token);
      setInvites([{
        id: inv.id,
        email: inv.email,
        tokenHash: inv.tokenHash?.slice(0, 8) + "…" || "—",
        role: inv.role,
        expiresAt: inv.expiresAt,
        activatedAt: null,
        revokedAt: null,
        createdBy: t("You"),
        createdAt: new Date().toISOString(),
      }, ...invites]);
      setEmail("");
    } catch { setError(t("Network error.")); }
    finally { setBusy(false); }
  }

  function copyLink() {
    if (!lastToken) return;
    const url = `${window.location.origin}/invite/${lastToken}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mt-20">
      <div className="card p-20 mb-20">
        <h3 style={{ margin: "0 0 14px" }}>{t("Send new invite")}</h3>
        <form onSubmit={createInvite} className="flex flex-wrap items-start gap-10" style={{ alignItems: "flex-end" }}>
          <label className="field" style={{ flex: 1, minWidth: 200, margin: 0 }}>
            <span className="label">{t("Email address")}</span>
            <input
              type="email"
              placeholder={t("user@example.com")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="field" style={{ minWidth: 160, margin: 0 }}>
            <span className="label">{t("Role")}</span>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              {ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
            </select>
          </label>
          <button type="submit" className="button" disabled={busy}>
            {busy ? t("Sending...") : t("Send invite")}
          </button>
        </form>
        {error && <p style={{ color: "var(--red)", margin: "8px 0 0", fontSize: 13 }}>{error}</p>}
        {lastToken && (
          <div role="status" aria-live="polite" style={{ marginTop: 12, padding: 12, background: "color-mix(in oklab, var(--green) 10%, transparent)", borderRadius: 8, fontSize: 13 }}>
            <strong>{t("Invite created!")}</strong> {t("Copy the link below (shown only once):")}
            <div className="flex items-center gap-8 mt-6">
              <code style={{ flex: 1, fontSize: 12, wordBreak: "break-all" }}>{`${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${lastToken}`}</code>
              <button className="button" style={{ fontSize: 11, padding: "3px 10px", flexShrink: 0 }} onClick={copyLink}>
                {copied ? t("Copied!") : t("Copy")}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>{t("Email")}</th>
                <th>{t("Role")}</th>
                <th>{t("Status")}</th>
                <th>{t("Created by")}</th>
                <th>{t("Expires")}</th>
                <th>{t("Token")}</th>
              </tr>
            </thead>
            <tbody>
              {invites.map((inv) => {
                const expired = new Date(inv.expiresAt) < new Date();
                const status = inv.activatedAt ? t("Activated") : inv.revokedAt ? t("Revoked") : expired ? t("Expired") : t("Pending");
                const badgeClass = inv.activatedAt ? "badge-green" : inv.revokedAt ? "badge-red" : expired ? "badge-red" : "badge-amber";
                return (
                  <tr key={inv.id}>
                    <td className="font-semibold">{inv.email}</td>
                    <td><span className="badge">{inv.role.replace(/_/g, " ")}</span></td>
                    <td><span className={`badge ${badgeClass}`}>{status}</span></td>
                    <td className="muted">{inv.createdBy}</td>
                    <td className="muted">{new Date(inv.expiresAt).toLocaleDateString()}</td>
                    <td className="muted font-mono text-xs">{inv.tokenHash}</td>
                  </tr>
                );
              })}
              {invites.length === 0 && (
                <tr>
                  <td colSpan={6}><EmptyState message={t("No invites yet.")} /></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
