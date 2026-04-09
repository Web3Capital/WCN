"use client";

import { useState } from "react";

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
      if (!data.ok) { setError(data.error || "Failed."); return; }
      setLastToken(data.invite.token);
      setInvites([{
        id: data.invite.id,
        email: data.invite.email,
        tokenHash: data.invite.tokenHash?.slice(0, 8) + "…" || "—",
        role: data.invite.role,
        expiresAt: data.invite.expiresAt,
        activatedAt: null,
        revokedAt: null,
        createdBy: "You",
        createdAt: new Date().toISOString(),
      }, ...invites]);
      setEmail("");
    } catch { setError("Network error."); }
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
    <div style={{ marginTop: 20 }}>
      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <h3 style={{ margin: "0 0 14px" }}>Send new invite</h3>
        <form onSubmit={createInvite} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ flex: 1, minWidth: 200 }}
          />
          <select value={role} onChange={(e) => setRole(e.target.value)} style={{ minWidth: 160 }}>
            {ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
          </select>
          <button type="submit" className="button" disabled={busy}>
            {busy ? "Sending..." : "Send invite"}
          </button>
        </form>
        {error && <p style={{ color: "var(--red)", margin: "8px 0 0", fontSize: 13 }}>{error}</p>}
        {lastToken && (
          <div style={{ marginTop: 12, padding: 12, background: "color-mix(in oklab, var(--green) 10%, transparent)", borderRadius: 8, fontSize: 13 }}>
            <strong>Invite created!</strong> Copy the link below (shown only once):
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
              <code style={{ flex: 1, fontSize: 12, wordBreak: "break-all" }}>{`${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${lastToken}`}</code>
              <button className="button" style={{ fontSize: 11, padding: "3px 10px", flexShrink: 0 }} onClick={copyLink}>
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line)", textAlign: "left" }}>
                <th style={{ padding: "10px 14px" }}>Email</th>
                <th style={{ padding: "10px 14px" }}>Role</th>
                <th style={{ padding: "10px 14px" }}>Status</th>
                <th style={{ padding: "10px 14px" }}>Created by</th>
                <th style={{ padding: "10px 14px" }}>Expires</th>
                <th style={{ padding: "10px 14px" }}>Token</th>
              </tr>
            </thead>
            <tbody>
              {invites.map((inv) => {
                const expired = new Date(inv.expiresAt) < new Date();
                const status = inv.activatedAt ? "Activated" : inv.revokedAt ? "Revoked" : expired ? "Expired" : "Pending";
                const badgeClass = inv.activatedAt ? "badge-green" : inv.revokedAt ? "badge-red" : expired ? "badge-red" : "badge-amber";
                return (
                  <tr key={inv.id} style={{ borderBottom: "1px solid var(--line)" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 600 }}>{inv.email}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <span className="badge">{inv.role.replace(/_/g, " ")}</span>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <span className={`badge ${badgeClass}`}>{status}</span>
                    </td>
                    <td style={{ padding: "10px 14px" }} className="muted">{inv.createdBy}</td>
                    <td style={{ padding: "10px 14px" }} className="muted">
                      {new Date(inv.expiresAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: 11 }} className="muted">
                      {inv.tokenHash}
                    </td>
                  </tr>
                );
              })}
              {invites.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: 20, textAlign: "center" }} className="muted">
                    No invites yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
