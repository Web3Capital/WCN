"use client";

import { useState, useCallback } from "react";
import { Link } from "@/i18n/routing";
import { Clock } from "lucide-react";
import { DetailLayout, StatusBadge, StatCard, EmptyState } from "../../_components";
import { useAutoTranslate } from "@/lib/i18n/auto-translate-provider";

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
  createdAt?: string;
  updatedAt?: string;
  ownerNode: { id: string; name: string };
  permissions: Permission[];
  logs: Log[];
  runs: Run[];
  _count?: { runs: number; logs: number; permissions: number };
};

const AGENT_FLOW = ["ACTIVE", "DISABLED", "SUSPENDED", "FROZEN"] as const;

const VALID_TRANSITIONS: Record<string, string[]> = {
  ACTIVE: ["DISABLED", "SUSPENDED", "FROZEN"],
  DISABLED: ["ACTIVE"],
  SUSPENDED: ["ACTIVE", "FROZEN"],
  FROZEN: ["ACTIVE"],
};

const REVIEW_COLORS: Record<string, string> = {
  PENDING: "badge-yellow", APPROVED: "badge-green", MODIFIED: "", REJECTED: "badge-red",
};

const RUN_PARAM_HINTS: Record<string, string> = {
  RESEARCH: "projectId", DEAL: "matchId", EXECUTION: "dealId + transcript", GROWTH: "projectId",
};

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function AgentDetailUI({ agent, isAdmin }: { agent: AgentData; isAdmin: boolean }) {
  const { t } = useAutoTranslate();
  const [tab, setTab] = useState<"overview" | "logs" | "runs">("overview");
  const [status, setStatus] = useState(agent.status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmTransition, setConfirmTransition] = useState<string | null>(null);
  const [runInput, setRunInput] = useState("");
  const [runResult, setRunResult] = useState<string | null>(null);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const [adminSaving, setAdminSaving] = useState(false);
  const [adminMsg, setAdminMsg] = useState<string | null>(null);

  const nextStatuses = VALID_TRANSITIONS[status] ?? [];
  const totalTokens = agent.runs.reduce((s, r) => s + (r.tokenCount ?? 0), 0);
  const totalCost = agent.runs.reduce((s, r) => s + (r.cost ?? 0), 0);

  const updateStatus = useCallback(async (newStatus: string) => {
    setBusy(true);
    setError(null);
    setConfirmTransition(null);
    try {
      const res = await fetch(`/api/agents/${agent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.ok) setStatus(newStatus);
      else setError(data.error ?? t("Status change failed."));
    } catch (e: any) {
      setError(e?.message ?? t("Status change failed."));
    } finally { setBusy(false); }
  }, [agent.id, t]);

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
        setRunResult(`${t("Error:")} ${data.error?.message ?? t("Unknown")}`);
      }
    } catch (e) {
      setRunResult(`${t("Error:")} ${e instanceof Error ? e.message : t("Invalid JSON")}`);
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

  const adminPatch = useCallback(async (patch: Record<string, unknown>) => {
    setAdminSaving(true);
    setAdminMsg(null);
    try {
      const res = await fetch(`/api/agents/${agent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!data.ok) setAdminMsg(data.error ?? t("Save failed."));
      else setAdminMsg(t("Saved"));
      setTimeout(() => setAdminMsg(null), 2000);
    } catch (e: any) {
      setAdminMsg(e?.message ?? t("Save failed."));
    } finally { setAdminSaving(false); }
  }, [agent.id, t]);

  return (
    <DetailLayout
      backHref="/dashboard/agents"
      backLabel={t("All Agents")}
      title={agent.name}
      badge={
        <span className="flex items-center gap-6">
          <StatusBadge status={status} />
          <span className="badge">{agent.type}</span>
          <span className="muted text-xs">v{agent.version}</span>
          {agent.freezeLevel && <span className="badge badge-red">{agent.freezeLevel}</span>}
        </span>
      }
      meta={
        <span className="flex items-center gap-12 flex-wrap">
          <span>{t("Owner:")} <Link href={`/dashboard/nodes/${agent.ownerNode.id}`} style={{ color: "var(--accent)" }}>{agent.ownerNode.name}</Link></span>
          {agent.createdAt && (
            <span className="flex items-center gap-4 muted text-xs">
              <Clock size={12} /> {t("Created")} {relativeTime(agent.createdAt)}
            </span>
          )}
          {agent.updatedAt && (
            <span className="muted text-xs">
              · {t("Updated")} {relativeTime(agent.updatedAt)}
            </span>
          )}
        </span>
      }
    >
      {/* Status Pipeline */}
      <div className="card-glass p-18 reveal">
        <h3 className="mt-0 mb-12">{t("Status")}</h3>
        <div className="flex items-center gap-4 flex-wrap mb-12">
          {AGENT_FLOW.map((s, i) => {
            const idx = AGENT_FLOW.indexOf(status as any);
            const isCurrent = s === status;
            const isPast = idx >= 0 && i < idx;
            return (
              <span key={s} className="flex items-center gap-4">
                {i > 0 && <span className="muted">→</span>}
                <span
                  className="badge text-xs"
                  style={{
                    borderRadius: "var(--radius-pill)",
                    background: isCurrent ? "var(--accent)" : isPast ? "var(--green)" : "var(--bg-elev)",
                    color: isCurrent || isPast ? "#fff" : "var(--muted)",
                    fontWeight: isCurrent ? 700 : 400,
                    padding: "4px 12px",
                  }}
                >
                  {s}
                </span>
              </span>
            );
          })}
        </div>
        {isAdmin && nextStatuses.length > 0 && (
          <div className="flex flex-wrap gap-8 items-center">
            <span className="muted text-sm">{t("Transition:")}</span>
            {nextStatuses.map((s) =>
              confirmTransition === s ? (
                <span key={s} className="flex items-center gap-4">
                  <button className="button text-xs" disabled={busy} onClick={() => updateStatus(s)}>
                    {t("Confirm")} → {s}
                  </button>
                  <button className="button-secondary text-xs" onClick={() => setConfirmTransition(null)}>
                    {t("Cancel")}
                  </button>
                </span>
              ) : (
                <button key={s} className="button-secondary text-xs" disabled={busy} onClick={() => setConfirmTransition(s)}>
                  → {s}
                </button>
              ),
            )}
          </div>
        )}
        {error && <p className="form-error mt-8">{error}</p>}
      </div>

      {/* Stats Grid */}
      <div className="grid-2 gap-16 reveal reveal-delay-1">
        <div className="grid-2 gap-12">
          <StatCard label={t("Runs")} value={agent._count?.runs ?? agent.runs.length} />
          <StatCard label={t("Logs")} value={agent._count?.logs ?? agent.logs.length} />
          <StatCard label={t("Permissions")} value={agent._count?.permissions ?? agent.permissions.length} />
          <StatCard label={t("Total Tokens")} value={totalTokens.toLocaleString()} />
        </div>
        <div className="flex-col gap-12">
          <div className="card-glass p-18" style={{ textAlign: "center" }}>
            <span className="muted text-sm">{t("Total Cost")}</span>
            <div className="font-bold" style={{ fontSize: 28, color: "var(--accent)" }}>${totalCost.toFixed(4)}</div>
            <span className="muted text-xs">{agent.runs.length} {t("runs")}</span>
          </div>
          {agent.endpoint && (
            <div className="card-glass p-18">
              <span className="muted text-sm">{t("Endpoint")}</span>
              <div className="mt-4"><code style={{ fontSize: 12, wordBreak: "break-all" }}>{agent.endpoint}</code></div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="reveal reveal-delay-2">
        <div className="tab-nav">
          {(["overview", "runs", "logs"] as const).map((tabKey) => (
            <button key={tabKey} className={`tab-btn ${tab === tabKey ? "tab-btn-active" : ""}`} onClick={() => setTab(tabKey)}>
              {tabKey === "overview" ? t("Overview") : tabKey === "logs" ? `${t("Logs")} (${agent.logs.length})` : `${t("Runs")} (${agent.runs.length})`}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="flex-col gap-16">
            {status === "ACTIVE" && (
              <div className="card-glass p-20">
                <h2 className="text-lg font-semibold mb-8 mt-0">{t("Run Agent")}</h2>
                <p className="muted text-xs mb-8">
                  {t("Required params:")} <code>{RUN_PARAM_HINTS[agent.type] ?? t("varies")}</code>
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
                    {busy ? t("Running...") : t("Execute")}
                  </button>
                  {runResult && <span className="text-xs">{runResult}</span>}
                </div>
              </div>
            )}

            <div className="card-glass p-20">
              <h2 className="text-lg font-semibold mb-12 mt-0">{t("Permissions")} ({agent.permissions.length})</h2>
              {agent.permissions.length === 0 ? (
                <EmptyState message={t("No permissions configured.")} />
              ) : (
                <table className="data-table">
                  <thead><tr><th>{t("Scope")}</th><th>{t("Write")}</th><th>{t("Audit Level")}</th></tr></thead>
                  <tbody>
                    {agent.permissions.map((p) => (
                      <tr key={p.id}>
                        <td className="font-semibold">{p.scope}</td>
                        <td>{p.canWrite ? <span className="badge badge-green" style={{ fontSize: 10 }}>{t("Yes")}</span> : t("No")}</td>
                        <td>{p.auditLevel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {tab === "runs" && (
          <div className="card-glass p-20">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-lg font-semibold mt-0 mb-0">{t("Agent Runs")}</h2>
              {isAdmin && agent.runs.some((r) => r.reviewStatus === "PENDING") && (
                <Link href="/dashboard/agents/review" className="button text-xs" style={{ padding: "4px 12px" }}>
                  {t("Review Queue")} →
                </Link>
              )}
            </div>
            {agent.runs.length === 0 ? (
              <EmptyState message={t("No runs yet. Use the Run Agent panel on the Overview tab.")} />
            ) : (
              <div className="flex-col gap-12">
                {agent.runs.map((r) => {
                  const duration = r.finishedAt
                    ? `${((new Date(r.finishedAt).getTime() - new Date(r.startedAt).getTime()) / 1000).toFixed(1)}s`
                    : t("running...");
                  const isExpanded = expandedRun === r.id;
                  return (
                    <div key={r.id} className="card p-14" style={{ border: "1px solid var(--border)" }}>
                      <div className="flex-between flex-wrap gap-8">
                        <div className="flex gap-8 items-center flex-wrap">
                          <StatusBadge status={r.status} className="text-xs" />
                          {r.outputType && <span className="badge" style={{ fontSize: 10 }}>{r.outputType}</span>}
                          {r.reviewStatus && <span className={`badge ${REVIEW_COLORS[r.reviewStatus] ?? ""}`} style={{ fontSize: 10 }}>{t("Review:")} {r.reviewStatus}</span>}
                          <span className="muted text-xs">{duration} | {r.tokenCount ?? 0} {t("tokens")} | ${r.cost?.toFixed(4) ?? "0"}</span>
                          {r.modelId && <span className="muted" style={{ fontSize: 10 }}>{r.modelId}</span>}
                        </div>
                        <div className="flex gap-6">
                          <button className="button" style={{ fontSize: 10, padding: "2px 8px" }} onClick={() => setExpandedRun(isExpanded ? null : r.id)}>
                            {isExpanded ? t("Collapse") : t("View Output")}
                          </button>
                          {isAdmin && r.status === "SUCCESS" && r.reviewStatus === "PENDING" && (
                            <>
                              <button className="button" style={{ fontSize: 10, padding: "2px 8px", background: "var(--green, #22c55e)", color: "#fff" }} disabled={busy} onClick={() => reviewRun(r.id, "APPROVED")}>{t("Approve")}</button>
                              <button className="button" style={{ fontSize: 10, padding: "2px 8px", background: "var(--red)", color: "#fff" }} disabled={busy} onClick={() => reviewRun(r.id, "REJECTED")}>{t("Reject")}</button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="muted text-xs mt-4">
                        {relativeTime(r.startedAt)}
                        {r.task && <> | {t("Task:")} <Link href={`/dashboard/tasks/${r.task.id}`} style={{ color: "var(--accent)" }}>{r.task.title}</Link></>}
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
          <div className="card-glass p-20">
            <h2 className="text-lg font-semibold mb-12 mt-0">{t("Execution Logs")}</h2>
            {agent.logs.length === 0 ? (
              <EmptyState message={t("No logs yet.")} />
            ) : (
              <table className="data-table">
                <thead><tr><th>{t("Action")}</th><th>{t("Model")}</th><th>{t("Task")}</th><th>{t("Time")}</th></tr></thead>
                <tbody>
                  {agent.logs.map((l) => (
                    <tr key={l.id}>
                      <td><span className={`badge ${l.exceptionFlag ? "badge-red" : ""}`} style={{ fontSize: 10 }}>{l.actionType}</span></td>
                      <td className="muted text-xs">{l.modelVersion ?? "—"}</td>
                      <td>{l.taskId ? <Link href={`/dashboard/tasks/${l.taskId}`} className="text-xs" style={{ color: "var(--accent)" }}>{t("View task")}</Link> : "—"}</td>
                      <td className="muted text-xs">{relativeTime(l.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Admin Panel */}
      {isAdmin && (
        <div className="card p-18 reveal reveal-delay-3" style={{ borderLeft: "3px solid var(--amber)" }}>
          <div className="flex items-center justify-between mb-12">
            <h3 className="mt-0 mb-0">{t("Admin Panel")}</h3>
            {adminSaving && <span className="muted text-xs">{t("Saving...")}</span>}
            {adminMsg && !adminSaving && <span className="text-xs" style={{ color: adminMsg === t("Saved") ? "var(--green)" : "var(--red)" }}>{adminMsg}</span>}
          </div>
          <div className="grid-2 gap-12">
            <label className="field">
              <span className="label">{t("Name")}</span>
              <input
                key={agent.id + "name"}
                defaultValue={agent.name}
                onBlur={(e) => adminPatch({ name: e.target.value })}
              />
            </label>
            <label className="field">
              <span className="label">{t("Endpoint")}</span>
              <input
                key={agent.id + "ep"}
                defaultValue={agent.endpoint ?? ""}
                onBlur={(e) => adminPatch({ endpoint: e.target.value || null })}
                placeholder="https://"
              />
            </label>
          </div>
          <div className="grid-2 gap-12">
            <label className="field">
              <span className="label">{t("Freeze level")}</span>
              <select
                key={agent.id + "fl"}
                defaultValue={agent.freezeLevel ?? ""}
                onChange={(e) => adminPatch({ freezeLevel: e.target.value || null })}
              >
                <option value="">{t("None")}</option>
                <option value="SOFT">SOFT</option>
                <option value="HARD">HARD</option>
              </select>
            </label>
            <label className="field">
              <span className="label">{t("Version")}</span>
              <input value={`v${agent.version}`} disabled readOnly />
            </label>
          </div>
        </div>
      )}
    </DetailLayout>
  );
}
