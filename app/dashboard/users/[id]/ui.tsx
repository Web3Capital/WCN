"use client";

import { useState } from "react";
import Link from "next/link";
import { DetailLayout, StatusBadge } from "../../_components";

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
    <DetailLayout
      backHref="/dashboard/users"
      backLabel="All Users"
      title={user.name || user.email || "Unknown"}
      badge={
        <span className="flex items-center gap-6">
          <span className="badge badge-accent">{role}</span>
          {isSelf && <span className="badge">(you)</span>}
        </span>
      }
      meta={<span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>}
    >
      <div className="card p-18">
        <div className="grid-2 gap-12">
          <div className="kpi">
            <strong>Email</strong>
            <span className="muted">{user.email ?? "—"}</span>
          </div>
          <div className="kpi">
            <strong>User ID</strong>
            <span className="muted text-xs" style={{ wordBreak: "break-all" }}>{user.id}</span>
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
        <div className="mt-16">
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
          {isSelf && <p className="muted mt-4 text-xs">Cannot change your own role.</p>}
          {error && <p className="form-error mt-8">{error}</p>}
        </div>
      </div>

      <div className="grid-2 gap-16">
        <div className="card p-18">
          <h3 className="mt-0 mb-12">Nodes ({user.nodes.length})</h3>
          {user.nodes.length === 0 ? (
            <p className="muted mt-0 mb-0">No nodes.</p>
          ) : (
            <div className="flex-col gap-8">
              {user.nodes.map((n) => (
                <div key={n.id} className="flex items-center gap-8 text-base">
                  <span className={`status-dot ${n.status === "LIVE" ? "status-dot-green" : n.status === "SUSPENDED" ? "status-dot-red" : "status-dot-amber"}`} />
                  <Link href={`/dashboard/nodes/${n.id}`} className="font-semibold" style={{ color: "var(--accent)" }}>{n.name}</Link>
                  <span className="badge text-xs">{n.type}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-18">
          <h3 className="mt-0 mb-12">Applications ({user.applications.length})</h3>
          {user.applications.length === 0 ? (
            <p className="muted mt-0 mb-0">No applications.</p>
          ) : (
            <div className="flex-col gap-8">
              {user.applications.map((a) => (
                <div key={a.id} className="flex-between text-base">
                  <div className="flex items-center gap-8">
                    <span className={`status-dot ${a.status === "APPROVED" ? "status-dot-green" : a.status === "REJECTED" ? "status-dot-red" : "status-dot-amber"}`} />
                    <Link href={`/dashboard/applications/${a.id}`} className="font-semibold" style={{ color: "var(--accent)" }}>{a.applicantName}</Link>
                    {a.nodeType && <span className="badge text-xs">{a.nodeType}</span>}
                  </div>
                  <span className="muted text-xs">{new Date(a.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {activity.length > 0 && (
        <div className="card p-18">
          <h3 className="mt-0 mb-12">Recent Activity</h3>
          <div className="timeline">
            {activity.map((log) => (
              <div key={log.id} className="timeline-item">
                <span className="timeline-dot" />
                <div className="timeline-content">
                  <div className="text-base">
                    <span className="font-bold">{log.action}</span>
                    {log.targetType && (
                      <span className="muted" style={{ marginLeft: 8 }}>
                        {log.targetType}
                        {log.targetId && <> · <span className="text-xs">{log.targetId.slice(0, 12)}…</span></>}
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
    </DetailLayout>
  );
}
