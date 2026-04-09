"use client";

import { useState } from "react";
import Link from "next/link";

export function AccountSettings({ name, email, role, has2FA }: {
  name: string;
  email: string;
  role: string;
  has2FA: boolean;
}) {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [sessionMsg, setSessionMsg] = useState("");

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      setMsg(data.ok ? "Password updated." : (data.error || "Failed."));
      if (data.ok) { setCurrentPw(""); setNewPw(""); }
    } catch { setMsg("Network error."); }
    finally { setBusy(false); }
  }

  async function revokeAllSessions() {
    setBusy(true);
    setSessionMsg("");
    try {
      const res = await fetch("/api/account/sessions", { method: "DELETE" });
      const data = await res.json();
      setSessionMsg(data.ok ? `${data.revoked} sessions revoked.` : "Failed.");
    } catch { setSessionMsg("Network error."); }
    finally { setBusy(false); }
  }

  return (
    <div style={{ display: "grid", gap: 20, marginTop: 20 }}>
      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ margin: "0 0 12px" }}>Profile</h3>
        <div style={{ display: "grid", gap: 8, fontSize: 14 }}>
          <div><span className="muted">Name:</span> {name || "—"}</div>
          <div><span className="muted">Email:</span> {email}</div>
          <div><span className="muted">Role:</span> <span className="badge">{role}</span></div>
        </div>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ margin: "0 0 12px" }}>Two-Factor Authentication</h3>
        {has2FA ? (
          <p className="muted" style={{ margin: 0 }}>
            <span className="badge badge-green">Enabled</span>
          </p>
        ) : (
          <div>
            <p className="muted" style={{ margin: "0 0 12px" }}>Not enabled yet.</p>
            <Link href="/account/2fa" className="button-secondary" style={{ display: "inline-block" }}>
              Set up 2FA
            </Link>
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ margin: "0 0 12px" }}>Change Password</h3>
        <form onSubmit={changePassword} style={{ display: "grid", gap: 10 }}>
          <input type="password" placeholder="Current password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} required />
          <input type="password" placeholder="New password (min 8 chars)" value={newPw} onChange={(e) => setNewPw(e.target.value)} required minLength={8} />
          {msg ? <p style={{ color: msg.includes("updated") ? "var(--green)" : "var(--red)", margin: 0, fontSize: 13 }}>{msg}</p> : null}
          <button type="submit" className="button-secondary" disabled={busy}>
            {busy ? "Saving..." : "Update password"}
          </button>
        </form>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ margin: "0 0 12px" }}>Sessions</h3>
        <p className="muted" style={{ margin: "0 0 12px", fontSize: 13 }}>Sign out of all other devices.</p>
        {sessionMsg ? <p style={{ color: "var(--amber)", margin: "0 0 8px", fontSize: 13 }}>{sessionMsg}</p> : null}
        <button className="button-secondary" onClick={revokeAllSessions} disabled={busy}>
          Revoke all sessions
        </button>
      </div>
    </div>
  );
}
