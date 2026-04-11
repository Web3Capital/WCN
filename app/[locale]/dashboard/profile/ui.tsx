"use client";

import { useState } from "react";
import { StatusBadge } from "../_components";
import { useAutoTranslate } from "@/lib/i18n/auto-translate-provider";

type UserProfile = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
  accountStatus: string;
  twoFactorEnabled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  _count: { nodes: number; applications: number };
};

export function ProfilePage({ user }: { user: UserProfile }) {
  const { t } = useAutoTranslate();
  const [name, setName] = useState(user.name ?? "");
  const [image, setImage] = useState(user.image ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const body: Record<string, string> = {};
      if (name !== (user.name ?? "")) body.name = name;
      if (image !== (user.image ?? "")) body.image = image;
      if (Object.keys(body).length === 0) { setMsg(t("No changes.")); setBusy(false); return; }

      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setMsg(data.ok ? t("Profile updated.") : (data.error?.message || t("Failed.")));
    } catch {
      setMsg(t("Network error."));
    }
    setBusy(false);
  }

  return (
    <div className="flex-col gap-20 mt-20">
      <div className="card p-20">
        <div className="flex items-center gap-16 mb-20">
          <span className="user-avatar" style={{ width: 56, height: 56, fontSize: 22 }}>
            {(user.name || user.email || "?").charAt(0).toUpperCase()}
          </span>
          <div>
            <h3 className="mt-0 mb-0">{user.name || t("Unnamed")}</h3>
            <p className="muted mt-0 mb-0" style={{ fontSize: 13 }}>{user.email}</p>
          </div>
        </div>

        <div className="grid-2 gap-12 mb-20">
          <div className="kpi">
            <strong>{t("Role")}</strong>
            <span className="badge badge-accent">{user.role}</span>
          </div>
          <div className="kpi">
            <strong>{t("Status")}</strong>
            <StatusBadge status={user.accountStatus} />
          </div>
          <div className="kpi">
            <strong>{t("2FA")}</strong>
            <span className={`badge ${user.twoFactorEnabled ? "badge-green" : ""}`}>
              {user.twoFactorEnabled ? t("Enabled") : t("Not set up")}
            </span>
          </div>
          <div className="kpi">
            <strong>{t("Last Login")}</strong>
            <span className="muted">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "—"}</span>
          </div>
          <div className="kpi">
            <strong>{t("Owned Nodes")}</strong>
            <span>{user._count.nodes}</span>
          </div>
          <div className="kpi">
            <strong>{t("Applications")}</strong>
            <span>{user._count.applications}</span>
          </div>
        </div>

        <p className="muted text-xs mt-0 mb-0">
          {t("Joined")} {new Date(user.createdAt).toLocaleDateString()}
        </p>
      </div>

      <div className="card p-20">
        <h3 className="mt-0 mb-16">{t("Edit Profile")}</h3>
        <form onSubmit={save} className="form">
          <label className="field">
            <span className="label">{t("Display name")}</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("Your name")}
              required
              minLength={1}
              maxLength={120}
            />
          </label>
          <label className="field">
            <span className="label">{t("Avatar URL")}</span>
            <input
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              type="url"
            />
          </label>
          {msg && (
            <p className="mt-0 mb-0" style={{ color: msg.includes("updated") ? "var(--green)" : "var(--amber)", fontSize: 13 }} role="status">
              {msg}
            </p>
          )}
          <button type="submit" className="button" disabled={busy} style={{ width: "fit-content" }}>
            {busy ? t("Saving...") : t("Save changes")}
          </button>
        </form>
      </div>
    </div>
  );
}
