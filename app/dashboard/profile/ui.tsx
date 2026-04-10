"use client";

import { useState } from "react";

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
      if (Object.keys(body).length === 0) { setMsg("No changes."); setBusy(false); return; }

      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setMsg(data.ok ? "Profile updated." : (data.error?.message || "Failed."));
    } catch {
      setMsg("Network error.");
    }
    setBusy(false);
  }

  return (
    <div style={{ display: "grid", gap: 20, marginTop: 20 }}>
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <span className="user-avatar" style={{ width: 56, height: 56, fontSize: 22 }}>
            {(user.name || user.email || "?").charAt(0).toUpperCase()}
          </span>
          <div>
            <h3 style={{ margin: 0 }}>{user.name || "Unnamed"}</h3>
            <p className="muted" style={{ margin: "2px 0 0", fontSize: 13 }}>{user.email}</p>
          </div>
        </div>

        <div className="grid-2" style={{ gap: 12, marginBottom: 20 }}>
          <div className="kpi">
            <strong>Role</strong>
            <span className="badge badge-accent">{user.role}</span>
          </div>
          <div className="kpi">
            <strong>Status</strong>
            <span className={`badge ${user.accountStatus === "ACTIVE" ? "badge-green" : "badge-amber"}`}>{user.accountStatus}</span>
          </div>
          <div className="kpi">
            <strong>2FA</strong>
            <span className={`badge ${user.twoFactorEnabled ? "badge-green" : ""}`}>
              {user.twoFactorEnabled ? "Enabled" : "Not set up"}
            </span>
          </div>
          <div className="kpi">
            <strong>Last Login</strong>
            <span className="muted">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "—"}</span>
          </div>
          <div className="kpi">
            <strong>Owned Nodes</strong>
            <span>{user._count.nodes}</span>
          </div>
          <div className="kpi">
            <strong>Applications</strong>
            <span>{user._count.applications}</span>
          </div>
        </div>

        <p className="muted" style={{ fontSize: 12, margin: 0 }}>
          Joined {new Date(user.createdAt).toLocaleDateString()}
        </p>
      </div>

      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ margin: "0 0 16px" }}>Edit Profile</h3>
        <form onSubmit={save} className="form">
          <label className="field">
            <span className="label">Display name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
              minLength={1}
              maxLength={120}
            />
          </label>
          <label className="field">
            <span className="label">Avatar URL</span>
            <input
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              type="url"
            />
          </label>
          {msg && (
            <p style={{ color: msg.includes("updated") ? "var(--green)" : "var(--amber)", margin: 0, fontSize: 13 }} role="status">
              {msg}
            </p>
          )}
          <button type="submit" className="button" disabled={busy} style={{ width: "fit-content" }}>
            {busy ? "Saving..." : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
