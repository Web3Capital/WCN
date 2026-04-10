"use client";

import { useState } from "react";
import Link from "next/link";
import { DetailLayout, StatusBadge, EmptyState } from "../../_components";

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
    <DetailLayout
      backHref="/dashboard/agents"
      backLabel="All Agents"
      title={agent.name}
      badge={
        <span className="flex items-center gap-6">
          <StatusBadge status={agent.status} />
          <span className="badge">{agent.type}</span>
          <span className="muted text-xs">v{agent.version}</span>
          {agent.freezeLevel && <span className="badge badge-red">{agent.freezeLevel}</span>}
        </span>
      }
      meta={
        <span>Owner: <Link href={`/dashboard/nodes/${agent.ownerNode.id}`} style={{ color: "var(--accent)" }}>{agent.ownerNode.name}</Link></span>
      }
      actions={
        <>
          {isAdmin && agent.status !== "FROZEN" && (
            <button className="button text-xs" style={{ padding: "4px 12px", background: "var(--red)", color: "#fff" }} disabled={busy} onClick={() => toggleStatus("FROZEN")}>
              Freeze
            </button>
          )}
          {isAdmin && agent.status === "FROZEN" && (
            <button className="button text-xs" style={{ padding: "4px 12px" }} disabled={busy} onClick={() => toggleStatus("ACTIVE")}>
              Unfreeze
            </button>
          )}
        </>
      }
    >
      <div>
        <div className="tab-nav">
          {(["overview", "runs", "logs"] as const).map((t) => (
            <button key={t} className={`tab-btn ${tab === t ? "tab-btn-active" : ""}`} onClick={() => setTab(t)}>
              {t === "overview" ? "Overview" : t === "logs" ? `Logs (${agent.logs.length})` : `Runs (${agent.runs.length})`}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="flex-col gap-16">
            {agent.status === "ACTIVE" && (
              <div className="card p-20">
                <h2 className="text-lg font-semibold mb-8 mt-0">Run Agent</h2>
                <p className="muted text-xs mb-8">
                  Required params: <code>{RUN_PARAM_HINTS[agent.type] ?? "varies"}</code>
                </p>
                <textarea
                  value={runInput}
                  onChange={(e) => setRunInput(e.target.value)}
                  placeholder={`{"${RUN_PARAM_HINTS[agent.type]?.split(" ")[0] ?? "projectId"}": "..."}`}
                  className="w-full font-mono text-xs"
                  style={{ minHeight: 60, padding: 8, borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--foreground)", resize: "vertical" }}
                />
                <div className="flex gap-8 items-center mt-8">
                  <button className="button text-xs" style={{ padding: "6px 16px" }} disabled={busy} onClick={triggerRun}>
                    {busy ? "Running..." : "Execute"}
                  </button>
                  {runResult && <span className="text-xs">{runResult}</span>}
                </div>
              </div>
            )}

            <div className="card p-20">
              <h2 className="text-lg font-semibold mb-12 mt-0">Permissions ({agent.permissions.length})</h2>
              {agent.permissions.length === 0 ? (
                <EmptyState message="No permissions configured." />
              ) : (
                <table className="data-table">
                  <thead><tr><th>Scope</th><th>Write</th><th>Audit Level</th></tr></thead>
                  <tbody>
                    {agent.permissions.map((p) => (
                      <tr key={p.id}>
                        <td className="font-semibold">{p.scope}</td>
                        <td>{p.canWrite ? <span className="badge badge-green" style={{ fontSize: 10 }}>Yes</span> : "No"}</td>
                        <td>{p.auditLevel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {agent.endpoint && (
                <p className="muted text-xs mt-12">Endpoint: <code>{agent.endpoint}</code></p>
              )}
            </div>
          </div>
        )}

        {tab === "runs" && (
          <div className="card p-20">
            <h2 className="text-lg font-semibold mb-12 mt-0">Agent Runs</h2>
            {agent.runs.length === 0 ? (
              <EmptyState message="No runs yet. Use the Run Agent panel on the Overview tab." />
            ) : (
              <div className="flex-col gap-12">
                {agent.runs.map((r) => {
                  const duration = r.finishedAt
                    ? `${((new Date(r.finishedAt).getTime() - new Date(r.startedAt).getTime()) / 1000).toFixed(1)}s`
                    : "running...";
                  const isExpanded = expandedRun === r.id;
                  return (
                    <div key={r.id} className="card p-14" style={{ border: "1px solid var(--border)" }}>
                      <div className="flex-between flex-wrap gap-8">
                        <div className="flex gap-8 items-center flex-wrap">
                          <StatusBadge status={r.status} className="text-xs" />
                          {r.outputType && <span className="badge" style={{ fontSize: 10 }}>{r.outputType}</span>}
                          {r.reviewStatus && <span className={`badge ${REVIEW_COLORS[r.reviewStatus] ?? ""}`} style={{ fontSize: 10 }}>Review: {r.reviewStatus}</span>}
                          <span className="muted text-xs">{duration} | {r.tokenCount ?? 0} tokens | ${r.cost?.toFixed(4) ?? "0"}</span>
                          {r.modelId && <span className="muted" style={{ fontSize: 10 }}>{r.modelId}</span>}
                        </div>
                        <div className="flex gap-6">
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
                      <div className="muted text-xs mt-4">
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
          <div className="card p-20">
            <h2 className="text-lg font-semibold mb-12 mt-0">Execution Logs</h2>
            {agent.logs.length === 0 ? (
              <EmptyState message="No logs yet." />
            ) : (
              <table className="data-table">
                <thead><tr><th>Action</th><th>Model</th><th>Task</th><th>Time</th></tr></thead>
                <tbody>
                  {agent.logs.map((l) => (
                    <tr key={l.id}>
                      <td><span className={`badge ${l.exceptionFlag ? "badge-red" : ""}`} style={{ fontSize: 10 }}>{l.actionType}</span></td>
                      <td className="muted text-xs">{l.modelVersion ?? "—"}</td>
                      <td>{l.taskId ? <Link href={`/dashboard/tasks/${l.taskId}`} className="text-xs" style={{ color: "var(--accent)" }}>View task</Link> : "—"}</td>
                      <td className="muted text-xs">{new Date(l.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </DetailLayout>
  );
}
