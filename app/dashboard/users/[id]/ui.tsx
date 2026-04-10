"use client";

import { useState } from "react";
import Link from "next/link";

type NodeRow = { id: string; name: string; type: string; status: string };
type ApplicationRow = { id: string; status: string; applicantName: string; nodeType: string | null; createdAt: string };
type ActivityRow = { id: string; action: string; targetType: string | null; targetId: string | null; createdAt: string };

type UserData = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  createdAt: string;
  nodes: NodeRow[];
  applications: ApplicationRow[];
  _count: { nodes: number; applications: number };
};

const ROLES = ["USER", "ADMIN", "FOUNDER", "FINANCE_ADMIN", "NODE_OWNER", "PROJECT_OWNER", "CAPITAL_NODE", "SERVICE_NODE", "REVIEWER", "RISK_DESK", "AGENT_OWNER", "OBSERVER", "SYSTEM"];

const NODE_STATUS_COLOR: Record<string, string> = {
  LIVE: "badge-green",
  PENDING: "badge-amber",
  SUSPENDED: "badge-red",
};

export function UserDetail({
  user,
  activity,
  currentUserId,
}: {
  user: UserData;
  activity: ActivityRow[];
  currentUserId: string;
}) {
  const [role, setRole] = useState(user.role);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSelf = user.id === currentUserId;

  async function changeRole(newRole: string) {
    if (isSelf) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (data.ok) {
        setRole(data.data.role);
      } else {
        setError(data.error?.message || data.error || "Failed to update role.");
      }
    } catch {
      setError("Network error.");
    }
    setBusy(false);
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span className="eyebrow">User Profile</span>
        <span className="badge badge-accent">{role}</span>
        {isSelf && <span className="badge">(you)</span>}
      </div>
      <h1 style={{ marginTop: 4 }}>{user.name || user.email || "Unknown"}</h1>
      <p className="muted" style={{ margin: "4px 0 0" }}>
        Joined {new Date(user.createdAt).toLocaleDateString()}
      </p>

      {/* Profile Info & Role */}
      <div className="card" style={{ padding: 18, marginTop: 16 }}>
        <div className="grid-2" style={{ gap: 12 }}>
          <div className="kpi">
            <strong>Email</strong>
            <span className="muted">{user.email ?? "—"}</span>
          </div>
          <div className="kpi">
            <strong>User ID</strong>
            <span className="muted" style={{ fontSize: 12, wordBreak: "break-all" }}>{user.id}</span>
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
        <div style={{ marginTop: 14 }}>
          <label className="field">
            <span className="label">Role</span>
            <select
              value={role}
              onChange={(e) => changeRole(e.target.value)}
              disabled={busy || isSelf}
              style={{ width: 200 }}
            >
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
          {isSelf && <p className="muted" style={{ margin: "6px 0 0", fontSize: 12 }}>Cannot change your own role.</p>}
          {error && <p className="form-error" style={{ marginTop: 8 }}>{error}</p>}
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: 16, gap: 16 }}>
        {/* Nodes */}
        <div className="card" style={{ padding: 18 }}>
          <h3 style={{ margin: "0 0 12px" }}>Nodes ({user.nodes.length})</h3>
          {user.nodes.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>No nodes.</p>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {user.nodes.map((n) => (
                <div key={n.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                  <span className={`status-dot ${n.status === "LIVE" ? "status-dot-green" : n.status === "SUSPENDED" ? "status-dot-red" : "status-dot-amber"}`} />
                  <Link href={`/dashboard/nodes/${n.id}`} style={{ fontWeight: 600, color: "var(--accent)" }}>{n.name}</Link>
                  <span className={`badge ${NODE_STATUS_COLOR[n.status] ?? ""}`} style={{ fontSize: 11 }}>{n.type}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Applications */}
        <div className="card" style={{ padding: 18 }}>
          <h3 style={{ margin: "0 0 12px" }}>Applications ({user.applications.length})</h3>
          {user.applications.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>No applications.</p>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {user.applications.map((a) => (
                <div key={a.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className={`status-dot ${a.status === "APPROVED" ? "status-dot-green" : a.status === "REJECTED" ? "status-dot-red" : "status-dot-amber"}`} />
                    <Link href={`/dashboard/applications/${a.id}`} style={{ fontWeight: 600, color: "var(--accent)" }}>{a.applicantName}</Link>
                    {a.nodeType && <span className="badge" style={{ fontSize: 11 }}>{a.nodeType}</span>}
                  </div>
                  <span className="muted" style={{ fontSize: 11 }}>{new Date(a.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Activity Log */}
      {activity.length > 0 && (
        <div className="card" style={{ padding: 18, marginTop: 16 }}>
          <h3 style={{ margin: "0 0 12px" }}>Recent Activity</h3>
          <div className="timeline">
            {activity.map((log) => (
              <div key={log.id} className="timeline-item">
                <span className="timeline-dot" />
                <div className="timeline-content">
                  <div style={{ fontSize: 14 }}>
                    <span style={{ fontWeight: 700 }}>{log.action}</span>
                    {log.targetType && (
                      <span className="muted" style={{ marginLeft: 8 }}>
                        {log.targetType}
                        {log.targetId && <> · <span style={{ fontSize: 11 }}>{log.targetId.slice(0, 12)}…</span></>}
                      </span>
                    )}
                  </div>
                  <div className="timeline-meta">{new Date(log.createdAt).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
