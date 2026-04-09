"use client";

import { useState } from "react";

type InviteRow = {
  id: string;
  email: string;
  token: string;
  role: string;
  expiresAt: string;
  activatedAt: string | null;
  createdBy: string;
  createdAt: string;
};

const ROLES = [
  "FOUNDER", "ADMIN", "FINANCE_ADMIN", "NODE_OWNER", "PROJECT_OWNER",
  "CAPITAL_NODE", "SERVICE_NODE", "REVIEWER", "AGENT_OWNER", "OBSERVER"
];

export function InviteConsole({ initialInvites }: { initialInvites: InviteRow[] }) {
  const [invites, setInvites] = useState(initialInvites);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("NODE_OWNER");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  async function createInvite(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error || "Failed."); return; }
      setInvites([{
        id: data.invite.id,
        email: data.invite.email,
        token: data.invite.token,
        role: data.invite.role,
        expiresAt: data.invite.expiresAt,
        activatedAt: null,
        createdBy: "You",
        createdAt: new Date().toISOString(),
      }, ...invites]);
      setEmail("");
    } catch { setError("Network error."); }
    finally { setBusy(false); }
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
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
        {error ? <p style={{ color: "var(--red)", margin: "8px 0 0", fontSize: 13 }}>{error}</p> : null}
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
                <th style={{ padding: "10px 14px" }}>Link</th>
              </tr>
            </thead>
            <tbody>
              {invites.map((inv) => {
                const expired = new Date(inv.expiresAt) < new Date();
                const status = inv.activatedAt ? "Activated" : expired ? "Expired" : "Pending";
                const badgeClass = inv.activatedAt ? "badge-green" : expired ? "badge-red" : "badge-amber";
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
                    <td style={{ padding: "10px 14px" }}>
                      {!inv.activatedAt && !expired ? (
                        <button
                          className="button-secondary"
                          style={{ fontSize: 11, padding: "3px 8px" }}
                          onClick={() => copyLink(inv.token)}
                        >
                          {copied === inv.token ? "Copied!" : "Copy link"}
                        </button>
                      ) : "—"}
                    </td>
                  </tr>
                );
              })}
              {invites.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 20, textAlign: "center" }} className="muted">
                    No invites yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
