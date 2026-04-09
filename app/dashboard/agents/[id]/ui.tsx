"use client";

import { useState } from "react";
import Link from "next/link";

type Permission = { id: string; scope: string; canWrite: boolean; auditLevel: number };
type Log = { id: string; actionType: string; taskId: string | null; modelVersion: string | null; exceptionFlag: boolean; createdAt: string };
type Run = { id: string; status: string; cost: number | null; startedAt: string; finishedAt: string | null; task: { id: string; title: string } | null };
type AgentData = {
  id: string;
  name: string;
  type: string;
  status: string;
  version: number;
  endpoint: string | null;
  freezeLevel: string | null;
  ownerNode: { id: string; name: string };
  permissions: Permission[];
  logs: Log[];
  runs: Run[];
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "badge-green",
  DISABLED: "",
  SUSPENDED: "badge-yellow",
  FROZEN: "badge-red",
};

export function AgentDetailUI({ agent, isAdmin }: { agent: AgentData; isAdmin: boolean }) {
  const [tab, setTab] = useState<"overview" | "logs" | "runs">("overview");
  const [busy, setBusy] = useState(false);

  async function toggleStatus(newStatus: string) {
    setBusy(true);
    try {
      await fetch(`/api/agents/${agent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      window.location.reload();
    } catch { /* ignore */ }
    setBusy(false);
  }

  return (
    <div>
      <Link href="/dashboard/agents" style={{ fontSize: 13, color: "var(--accent)" }}>
        &larr; All Agents
      </Link>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>{agent.name}</h1>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span className={`badge ${STATUS_COLORS[agent.status] ?? ""}`} style={{ fontSize: 11 }}>{agent.status}</span>
            <span className="badge" style={{ fontSize: 10 }}>{agent.type}</span>
            <span className="muted" style={{ fontSize: 12 }}>v{agent.version}</span>
            {agent.freezeLevel && <span className="badge badge-red" style={{ fontSize: 10 }}>{agent.freezeLevel}</span>}
          </div>
          <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            Owner: <Link href={`/dashboard/nodes/${agent.ownerNode.id}`}>{agent.ownerNode.name}</Link>
          </p>
        </div>
        {isAdmin && (
          <div style={{ display: "flex", gap: 6 }}>
            {agent.status !== "FROZEN" && (
              <button className="button" style={{ fontSize: 11, padding: "4px 12px", background: "var(--red)", color: "#fff" }} disabled={busy} onClick={() => toggleStatus("FROZEN")}>
                Freeze
              </button>
            )}
            {agent.status === "FROZEN" && (
              <button className="button" style={{ fontSize: 11, padding: "4px 12px" }} disabled={busy} onClick={() => toggleStatus("ACTIVE")}>
                Unfreeze
              </button>
            )}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {(["overview", "logs", "runs"] as const).map((t) => (
          <button
            key={t}
            className={`badge ${tab === t ? "badge-green" : ""}`}
            style={{ cursor: "pointer", fontSize: 12, padding: "5px 14px" }}
            onClick={() => setTab(t)}
          >
            {t === "overview" ? "Overview" : t === "logs" ? `Logs (${agent.logs.length})` : `Runs (${agent.runs.length})`}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Permissions ({agent.permissions.length})</h2>
          {agent.permissions.length === 0 ? (
            <p className="muted" style={{ fontSize: 13 }}>No permissions configured.</p>
          ) : (
            <table style={{ width: "100%", fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid var(--line)" }}>
                  <th style={{ padding: "6px 0" }}>Scope</th>
                  <th>Write</th>
                  <th>Audit Level</th>
                </tr>
              </thead>
              <tbody>
                {agent.permissions.map((p) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid var(--line)" }}>
                    <td style={{ padding: "6px 0" }}>{p.scope}</td>
                    <td>{p.canWrite ? "Yes" : "No"}</td>
                    <td>{p.auditLevel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {agent.endpoint && (
            <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>Endpoint: <code>{agent.endpoint}</code></p>
          )}
        </div>
      )}

      {tab === "logs" && (
        <div className="card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Execution Logs</h2>
          {agent.logs.length === 0 ? (
            <p className="muted" style={{ fontSize: 13 }}>No logs yet.</p>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {agent.logs.map((l) => (
                <div key={l.id} style={{ padding: "8px 0", borderBottom: "1px solid var(--line)", display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
                  <span className={`badge ${l.exceptionFlag ? "badge-red" : ""}`} style={{ fontSize: 10 }}>{l.actionType}</span>
                  {l.modelVersion && <span className="muted" style={{ fontSize: 11 }}>{l.modelVersion}</span>}
                  {l.taskId && <Link href={`/dashboard/tasks/${l.taskId}`} style={{ fontSize: 11, color: "var(--accent)" }}>Task</Link>}
                  <span className="muted" style={{ marginLeft: "auto", fontSize: 11 }}>{new Date(l.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "runs" && (
        <div className="card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Agent Runs</h2>
          {agent.runs.length === 0 ? (
            <p className="muted" style={{ fontSize: 13 }}>No runs yet.</p>
          ) : (
            <table style={{ width: "100%", fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid var(--line)" }}>
                  <th style={{ padding: "6px 0" }}>Status</th>
                  <th>Task</th>
                  <th>Cost</th>
                  <th>Started</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {agent.runs.map((r) => {
                  const duration = r.finishedAt
                    ? `${Math.round((new Date(r.finishedAt).getTime() - new Date(r.startedAt).getTime()) / 1000)}s`
                    : "—";
                  return (
                    <tr key={r.id} style={{ borderBottom: "1px solid var(--line)" }}>
                      <td style={{ padding: "6px 0" }}>
                        <span className={`badge ${r.status === "SUCCESS" ? "badge-green" : r.status === "FAILED" ? "badge-red" : ""}`} style={{ fontSize: 10 }}>
                          {r.status}
                        </span>
                      </td>
                      <td>{r.task ? <Link href={`/dashboard/tasks/${r.task.id}`}>{r.task.title}</Link> : "—"}</td>
                      <td>{r.cost != null ? `$${r.cost.toFixed(2)}` : "—"}</td>
                      <td className="muted">{new Date(r.startedAt).toLocaleString()}</td>
                      <td className="muted">{duration}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
