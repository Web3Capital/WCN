"use client";

import { useState } from "react";
import Link from "next/link";

type Permission = { id: string; scope: string; canWrite: boolean; auditLevel: number };
type Log = { id: string; actionType: string; taskId: string | null; modelVersion: string | null; exceptionFlag: boolean; createdAt: string };
type Run = {
  id: string; status: string; cost: number | null; startedAt: string; finishedAt: string | null;
  outputType: string | null; reviewStatus: string | null; tokenCount: number | null; modelId: string | null;
  outputs: any; inputs: any;
  task: { id: string; title: string } | null;
};
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
  ACTIVE: "badge-green", DISABLED: "", SUSPENDED: "badge-yellow", FROZEN: "badge-red",
};

const REVIEW_COLORS: Record<string, string> = {
  PENDING: "badge-yellow", APPROVED: "badge-green", MODIFIED: "", REJECTED: "badge-red",
};

const RUN_PARAM_HINTS: Record<string, string> = {
  RESEARCH: "projectId", DEAL: "matchId", EXECUTION: "dealId + transcript", GROWTH: "projectId",
};

export function AgentDetailUI({ agent, isAdmin }: { agent: AgentData; isAdmin: boolean }) {
  const [tab, setTab] = useState<"overview" | "logs" | "runs">("overview");
  const [busy, setBusy] = useState(false);
  const [runInput, setRunInput] = useState("");
  const [runResult, setRunResult] = useState<string | null>(null);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);

  async function toggleStatus(newStatus: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/agents/${agent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) window.location.reload();
    } catch { /* ignore */ }
    setBusy(false);
  }

  async function triggerRun() {
    setBusy(true);
    setRunResult(null);
    try {
      const body = JSON.parse(runInput || "{}");
      const res = await fetch(`/api/agents/${agent.id}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.ok) {
        setRunResult(`Run ${data.data.runId} completed (${data.data.tokenCount} tokens, $${data.data.cost?.toFixed(4) ?? "0"})`);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setRunResult(`Error: ${data.error?.message ?? "Unknown"}`);
      }
    } catch (e) {
      setRunResult(`Error: ${e instanceof Error ? e.message : "Invalid JSON"}`);
    }
    setBusy(false);
  }

  async function reviewRun(runId: string, reviewStatus: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/agents/runs/${runId}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewStatus }),
      });
      if (res.ok) window.location.reload();
    } catch { /* ignore */ }
    setBusy(false);
  }

  return (
    <div>
      <Link href="/dashboard/agents" style={{ fontSize: 13, color: "var(--accent)" }}>
        &larr; All Agents
      </Link>

      <div className="detail-header" style={{ marginTop: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>{agent.name}</h1>
          <div className="detail-header-meta">
            <span className={`badge ${STATUS_COLORS[agent.status] ?? ""}`}>{agent.status}</span>
            <span className="badge">{agent.type}</span>
            <span className="muted" style={{ fontSize: 12 }}>v{agent.version}</span>
            {agent.freezeLevel && <span className="badge badge-red">{agent.freezeLevel}</span>}
          </div>
          <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            Owner: <Link href={`/dashboard/nodes/${agent.ownerNode.id}`} style={{ color: "var(--accent)" }}>{agent.ownerNode.name}</Link>
          </p>
        </div>
        <div className="detail-actions" style={{ display: "flex", gap: 8 }}>
          {isAdmin && agent.status !== "FROZEN" && (
            <button className="button" style={{ fontSize: 11, padding: "4px 12px", background: "var(--red)", color: "#fff" }} disabled={busy} onClick={() => toggleStatus("FROZEN")}>
              Freeze
            </button>
          )}
          {isAdmin && agent.status === "FROZEN" && (
            <button className="button" style={{ fontSize: 11, padding: "4px 12px" }} disabled={busy} onClick={() => toggleStatus("ACTIVE")}>
              Unfreeze
            </button>
          )}
        </div>
      </div>

      <div className="tab-nav">
        {(["overview", "runs", "logs"] as const).map((t) => (
          <button key={t} className={`tab-btn ${tab === t ? "tab-btn-active" : ""}`} onClick={() => setTab(t)}>
            {t === "overview" ? "Overview" : t === "logs" ? `Logs (${agent.logs.length})` : `Runs (${agent.runs.length})`}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {agent.status === "ACTIVE" && (
            <div className="card" style={{ padding: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Run Agent</h2>
              <p className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
                Required params: <code>{RUN_PARAM_HINTS[agent.type] ?? "varies"}</code>
              </p>
              <textarea
                value={runInput}
                onChange={(e) => setRunInput(e.target.value)}
                placeholder={`{"${RUN_PARAM_HINTS[agent.type]?.split(" ")[0] ?? "projectId"}": "..."}`}
                style={{ width: "100%", minHeight: 60, fontFamily: "monospace", fontSize: 12, padding: 8, borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--foreground)", resize: "vertical" }}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
                <button className="button" style={{ fontSize: 12, padding: "6px 16px" }} disabled={busy} onClick={triggerRun}>
                  {busy ? "Running..." : "Execute"}
                </button>
                {runResult && <span style={{ fontSize: 12 }}>{runResult}</span>}
              </div>
            </div>
          )}

          <div className="card" style={{ padding: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Permissions ({agent.permissions.length})</h2>
            {agent.permissions.length === 0 ? (
              <div className="empty-state"><p>No permissions configured.</p></div>
            ) : (
              <table className="data-table">
                <thead><tr><th>Scope</th><th>Write</th><th>Audit Level</th></tr></thead>
                <tbody>
                  {agent.permissions.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.scope}</td>
                      <td>{p.canWrite ? <span className="badge badge-green" style={{ fontSize: 10 }}>Yes</span> : "No"}</td>
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
        </div>
      )}

      {tab === "runs" && (
        <div className="card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Agent Runs</h2>
          {agent.runs.length === 0 ? (
            <div className="empty-state"><p>No runs yet. Use the Run Agent panel on the Overview tab.</p></div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {agent.runs.map((r) => {
                const duration = r.finishedAt
                  ? `${((new Date(r.finishedAt).getTime() - new Date(r.startedAt).getTime()) / 1000).toFixed(1)}s`
                  : "running...";
                const isExpanded = expandedRun === r.id;
                return (
                  <div key={r.id} className="card" style={{ padding: 14, border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <span className={`badge ${r.status === "SUCCESS" ? "badge-green" : r.status === "FAILED" ? "badge-red" : "badge-yellow"}`} style={{ fontSize: 10 }}>{r.status}</span>
                        {r.outputType && <span className="badge" style={{ fontSize: 10 }}>{r.outputType}</span>}
                        {r.reviewStatus && <span className={`badge ${REVIEW_COLORS[r.reviewStatus] ?? ""}`} style={{ fontSize: 10 }}>Review: {r.reviewStatus}</span>}
                        <span className="muted" style={{ fontSize: 11 }}>{duration} | {r.tokenCount ?? 0} tokens | ${r.cost?.toFixed(4) ?? "0"}</span>
                        {r.modelId && <span className="muted" style={{ fontSize: 10 }}>{r.modelId}</span>}
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="button" style={{ fontSize: 10, padding: "2px 8px" }} onClick={() => setExpandedRun(isExpanded ? null : r.id)}>
                          {isExpanded ? "Collapse" : "View Output"}
                        </button>
                        {isAdmin && r.status === "SUCCESS" && r.reviewStatus === "PENDING" && (
                          <>
                            <button className="button" style={{ fontSize: 10, padding: "2px 8px", background: "var(--green, #22c55e)", color: "#fff" }} disabled={busy} onClick={() => reviewRun(r.id, "APPROVED")}>Approve</button>
                            <button className="button" style={{ fontSize: 10, padding: "2px 8px", background: "var(--red)", color: "#fff" }} disabled={busy} onClick={() => reviewRun(r.id, "REJECTED")}>Reject</button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>
                      {new Date(r.startedAt).toLocaleString()}
                      {r.task && <> | Task: <Link href={`/dashboard/tasks/${r.task.id}`} style={{ color: "var(--accent)" }}>{r.task.title}</Link></>}
                    </div>
                    {isExpanded && r.outputs && (
                      <pre style={{ marginTop: 10, padding: 12, borderRadius: 6, background: "var(--surface)", border: "1px solid var(--border)", fontSize: 11, overflow: "auto", maxHeight: 400, whiteSpace: "pre-wrap" }}>
                        {JSON.stringify(r.outputs, null, 2)}
                      </pre>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "logs" && (
        <div className="card" style={{ padding: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Execution Logs</h2>
          {agent.logs.length === 0 ? (
            <div className="empty-state"><p>No logs yet.</p></div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Action</th><th>Model</th><th>Task</th><th>Time</th></tr></thead>
              <tbody>
                {agent.logs.map((l) => (
                  <tr key={l.id}>
                    <td><span className={`badge ${l.exceptionFlag ? "badge-red" : ""}`} style={{ fontSize: 10 }}>{l.actionType}</span></td>
                    <td className="muted" style={{ fontSize: 11 }}>{l.modelVersion ?? "—"}</td>
                    <td>{l.taskId ? <Link href={`/dashboard/tasks/${l.taskId}`} style={{ fontSize: 11, color: "var(--accent)" }}>View task</Link> : "—"}</td>
                    <td className="muted" style={{ fontSize: 11 }}>{new Date(l.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
