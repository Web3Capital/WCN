"use client";

import { useState } from "react";
import { ConfirmDialog } from "../_components/confirm-dialog";

type RiskFlagRow = {
  id: string;
  entityType: string;
  entityId: string;
  severity: string;
  reason: string;
  resolution: string | null;
  resolvedAt: string | null;
  createdAt: string;
};

const SEV_BADGE: Record<string, string> = {
  CRITICAL: "badge-red", HIGH: "badge-red", MEDIUM: "badge-amber", LOW: "",
};

export function RiskConsole({ initialFlags }: { initialFlags: RiskFlagRow[] }) {
  const [flags, setFlags] = useState(initialFlags);
  const [filter, setFilter] = useState<"all" | "open" | "resolved">("open");
  const [showForm, setShowForm] = useState(false);
  const [entityType, setEntityType] = useState("NODE");
  const [entityId, setEntityId] = useState("");
  const [severity, setSeverity] = useState("MEDIUM");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [resolveTarget, setResolveTarget] = useState<string | null>(null);

  const displayed = filter === "all" ? flags : filter === "open" ? flags.filter((f) => !f.resolvedAt) : flags.filter((f) => !!f.resolvedAt);

  async function createFlag(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType, entityId, severity, reason }),
      });
      const data = await res.json();
      if (data.ok) {
        setFlags([{ ...data.data, createdAt: new Date().toISOString() }, ...flags]);
        setShowForm(false);
        setEntityId("");
        setReason("");
      }
    } finally { setBusy(false); }
  }

  async function resolveFlag(id: string, resolution: string) {
    const res = await fetch(`/api/risk/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolve: true, resolution }),
    });
    const data = await res.json();
    if (data.ok) {
      setFlags(flags.map((f) => f.id === id ? { ...f, resolvedAt: new Date().toISOString(), resolution } : f));
    }
  }

  return (
    <div style={{ marginTop: 20 }}>
      <div className="page-toolbar">
        <div className="chip-group">
          <button className={`chip ${filter === "open" ? "chip-active" : ""}`} onClick={() => setFilter("open")}>
            Open ({flags.filter((f) => !f.resolvedAt).length})
          </button>
          <button className={`chip ${filter === "all" ? "chip-active" : ""}`} onClick={() => setFilter("all")}>
            All ({flags.length})
          </button>
          <button className={`chip ${filter === "resolved" ? "chip-active" : ""}`} onClick={() => setFilter("resolved")}>
            Resolved ({flags.filter((f) => !!f.resolvedAt).length})
          </button>
        </div>
        <div className="page-toolbar-spacer" />
        <button className="button" onClick={() => setShowForm(!showForm)}>Flag risk</button>
      </div>

      {showForm && (
        <div className="card" style={{ padding: 18, marginBottom: 16 }}>
          <form onSubmit={createFlag} className="form">
            <div className="grid-3" style={{ gap: 12 }}>
              <label className="field">
                <span className="label">Entity type</span>
                <select value={entityType} onChange={(e) => setEntityType(e.target.value)}>
                  {["NODE", "PROJECT", "DEAL", "TASK", "AGENT", "EVIDENCE", "POB", "CAPITAL", "USER"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="label">Entity ID</span>
                <input placeholder="Entity ID *" value={entityId} onChange={(e) => setEntityId(e.target.value)} required />
              </label>
              <label className="field">
                <span className="label">Severity</span>
                <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
                  {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
            </div>
            <label className="field">
              <span className="label">Reason</span>
              <textarea placeholder="Reason *" value={reason} onChange={(e) => setReason(e.target.value)} required rows={2} />
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" className="button" disabled={busy}>{busy ? "Creating..." : "Create flag"}</button>
              <button type="button" className="button-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {displayed.length === 0 ? (
        <div className="empty-state"><p>No risk flags.</p></div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 32 }}></th>
              <th>Entity</th>
              <th>Reason</th>
              <th>Severity</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((f) => (
              <tr key={f.id}>
                <td>
                  <span className={`status-dot ${f.resolvedAt ? "status-dot-green" : f.severity === "CRITICAL" || f.severity === "HIGH" ? "status-dot-red" : "status-dot-amber"}`} />
                </td>
                <td>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{f.entityType}</div>
                  <div className="muted" style={{ fontSize: 11 }}>{f.entityId.slice(0, 12)}…</div>
                </td>
                <td>
                  <div style={{ fontSize: 13 }}>{f.reason}</div>
                  {f.resolution && <div style={{ fontSize: 12, color: "var(--green)", marginTop: 2 }}>Resolution: {f.resolution}</div>}
                </td>
                <td><span className={`badge ${SEV_BADGE[f.severity] ?? ""}`}>{f.severity}</span></td>
                <td className="muted" style={{ fontSize: 11 }}>{new Date(f.createdAt).toLocaleDateString()}</td>
                <td>
                  {!f.resolvedAt && (
                    <button className="button-secondary" style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => setResolveTarget(f.id)}>Resolve</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <ConfirmDialog
        open={!!resolveTarget}
        title="Resolve Risk Flag"
        description="Provide a resolution note for this risk flag."
        confirmLabel="Resolve"
        withInput
        inputLabel="Resolution"
        inputPlaceholder="Resolution note..."
        onConfirm={(val) => { if (resolveTarget && val) resolveFlag(resolveTarget, val); setResolveTarget(null); }}
        onCancel={() => setResolveTarget(null)}
      />
    </div>
  );
}
