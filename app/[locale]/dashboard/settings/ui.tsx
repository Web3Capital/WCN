"use client";

import { useState, useEffect } from "react";
import { Link } from "@/i18n/routing";
import { useAutoTranslate } from "@/lib/i18n/auto-translate-provider";

type NotifPref = { channel: string; enabled: boolean };

function NotificationPreferences() {
  const { t } = useAutoTranslate();
  const [prefs, setPrefs] = useState<NotifPref[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/account/notifications").then((r) => r.json()).then((d) => {
      if (d.ok) setPrefs(d.data);
    });
  }, []);

  async function toggle(channel: string, enabled: boolean) {
    setBusy(true);
    const res = await fetch("/api/account/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel, enabled }),
    });
    const d = await res.json();
    if (d.ok) {
      setPrefs((p) => {
        const exists = p.find((x) => x.channel === channel);
        if (exists) return p.map((x) => (x.channel === channel ? { ...x, enabled } : x));
        return [...p, { channel, enabled }];
      });
    }
    setBusy(false);
  }

  const channels = ["EMAIL", "IN_APP", "TELEGRAM", "SLACK"];
  return (
    <div className="card p-20">
      <h3 className="mt-0 mb-12">{t("Notification Preferences")}</h3>
      <div className="flex-col gap-8">
        {channels.map((ch) => {
          const pref = prefs.find((p) => p.channel === ch);
          const enabled = pref?.enabled ?? (ch === "EMAIL" || ch === "IN_APP");
          return (
            <label key={ch} className="flex items-center gap-10" style={{ fontSize: 13 }}>
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => toggle(ch, e.target.checked)}
                disabled={busy}
              />
              {ch.replace(/_/g, " ")}
            </label>
          );
        })}
      </div>
    </div>
  );
}

export function SettingsPage({ has2FA, hasPassword }: { has2FA: boolean; hasPassword: boolean }) {
  const { t } = useAutoTranslate();
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
      setPwMsg(data.ok ? t("Password updated.") : (data.error?.message || data.error || t("Failed.")));
      if (data.ok) { setCurrentPw(""); setNewPw(""); }
    } catch { setPwMsg(t("Network error.")); }
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
          ? t("All sessions revoked. You will be signed out shortly.")
          : t("Failed to revoke sessions."),
      );
      if (data.ok) {
        setTimeout(() => { window.location.href = "/login"; }, 2000);
      }
    } catch { setSessionMsg(t("Network error.")); }
    finally { setSessionBusy(false); }
  }

  return (
    <div className="flex-col gap-20 mt-20">
      <div className="card p-20">
        <h3 className="mt-0 mb-12">{t("Two-Factor Authentication")}</h3>
        {has2FA ? (
          <div>
            <span className="badge badge-green">{t("Enabled")}</span>
            <p className="muted mt-8 mb-0" style={{ fontSize: 13 }}>
              {t("Your account is protected with an authenticator app.")}
            </p>
          </div>
        ) : (
          <div>
            <p className="muted mt-0 mb-12">
              {t("Add an extra layer of security to your account.")}
            </p>
            <Link href="/account/2fa" className="button" style={{ display: "inline-block" }}>
              {t("Set up 2FA")}
            </Link>
          </div>
        )}
      </div>

      {hasPassword && (
        <div className="card p-20">
          <h3 className="mt-0 mb-12">{t("Change Password")}</h3>
          <form onSubmit={changePassword} className="form">
            <label className="field">
              <span className="label">{t("Current password")}</span>
              <input
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
            <label className="field">
              <span className="label">{t("New password (min 8 characters)")}</span>
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
              <p className="mt-0 mb-0" style={{ color: pwMsg.includes("updated") ? "var(--green)" : "var(--red)", fontSize: 13 }} role="status">
                {pwMsg}
              </p>
            )}
            <button type="submit" className="button-secondary" disabled={pwBusy} style={{ width: "fit-content" }}>
              {pwBusy ? t("Saving...") : t("Update password")}
            </button>
          </form>
        </div>
      )}

      {!hasPassword && (
        <div className="card p-20">
          <h3 className="mt-0 mb-12">{t("Password")}</h3>
          <p className="muted mt-0 mb-0" style={{ fontSize: 13 }}>
            {t("You signed up with a social account and do not have a password set.")}
          </p>
        </div>
      )}

      <NotificationPreferences />

      <div className="card p-20">
        <h3 className="mt-0 mb-12">{t("Active Sessions")}</h3>
        <p className="muted mt-0 mb-12" style={{ fontSize: 13 }}>
          {t("Sign out of all devices. This will invalidate all active sessions including the current one.")}
        </p>
        {sessionMsg && (
          <p role="status" className="mt-0 mb-8" style={{ color: "var(--amber)", fontSize: 13 }}>
            {sessionMsg}
          </p>
        )}
        <button className="button-secondary" onClick={revokeAllSessions} disabled={sessionBusy}>
          {sessionBusy ? t("Revoking...") : t("Revoke all sessions")}
        </button>
      </div>
    </div>
  );
}
