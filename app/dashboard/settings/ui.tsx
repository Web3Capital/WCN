"use client";

import { useState } from "react";
import Link from "next/link";

export function SettingsPage({ has2FA, hasPassword }: { has2FA: boolean; hasPassword: boolean }) {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState("");

  const [sessionBusy, setSessionBusy] = useState(false);
  const [sessionMsg, setSessionMsg] = useState("");

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwBusy(true);
    setPwMsg("");
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      setPwMsg(data.ok ? "Password updated." : (data.error?.message || data.error || "Failed."));
      if (data.ok) { setCurrentPw(""); setNewPw(""); }
    } catch { setPwMsg("Network error."); }
    finally { setPwBusy(false); }
  }

  async function revokeAllSessions() {
    setSessionBusy(true);
    setSessionMsg("");
    try {
      const res = await fetch("/api/account/sessions", { method: "DELETE" });
      const data = await res.json();
      setSessionMsg(
        data.ok
          ? `All sessions revoked. You will be signed out shortly.`
          : "Failed to revoke sessions.",
      );
      if (data.ok) {
        setTimeout(() => { window.location.href = "/login"; }, 2000);
      }
    } catch { setSessionMsg("Network error."); }
    finally { setSessionBusy(false); }
  }

  return (
    <div style={{ display: "grid", gap: 20, marginTop: 20 }}>
      {/* 2FA Section */}
      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ margin: "0 0 12px" }}>Two-Factor Authentication</h3>
        {has2FA ? (
          <div>
            <span className="badge badge-green">Enabled</span>
            <p className="muted" style={{ margin: "8px 0 0", fontSize: 13 }}>
              Your account is protected with an authenticator app.
            </p>
          </div>
        ) : (
          <div>
            <p className="muted" style={{ margin: "0 0 12px" }}>
              Add an extra layer of security to your account.
            </p>
            <Link href="/account/2fa" className="button" style={{ display: "inline-block" }}>
              Set up 2FA
            </Link>
          </div>
        )}
      </div>

      {/* Password Section */}
      {hasPassword && (
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ margin: "0 0 12px" }}>Change Password</h3>
          <form onSubmit={changePassword} className="form">
            <label className="field">
              <span className="label">Current password</span>
              <input
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
            <label className="field">
              <span className="label">New password (min 8 characters)</span>
              <input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
              />
            </label>
            {pwMsg && (
              <p style={{ color: pwMsg.includes("updated") ? "var(--green)" : "var(--red)", margin: 0, fontSize: 13 }} role="status">
                {pwMsg}
              </p>
            )}
            <button type="submit" className="button-secondary" disabled={pwBusy} style={{ width: "fit-content" }}>
              {pwBusy ? "Saving..." : "Update password"}
            </button>
          </form>
        </div>
      )}

      {!hasPassword && (
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ margin: "0 0 12px" }}>Password</h3>
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>
            You signed up with a social account and do not have a password set.
          </p>
        </div>
      )}

      {/* Sessions Section */}
      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ margin: "0 0 12px" }}>Active Sessions</h3>
        <p className="muted" style={{ margin: "0 0 12px", fontSize: 13 }}>
          Sign out of all devices. This will invalidate all active sessions including the current one.
        </p>
        {sessionMsg && (
          <p role="status" style={{ color: "var(--amber)", margin: "0 0 8px", fontSize: 13 }}>
            {sessionMsg}
          </p>
        )}
        <button className="button-secondary" onClick={revokeAllSessions} disabled={sessionBusy}>
          {sessionBusy ? "Revoking..." : "Revoke all sessions"}
        </button>
      </div>
    </div>
  );
}
