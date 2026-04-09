"use client";

import { useState } from "react";

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
        setFlags([{ ...data.flag, createdAt: new Date().toISOString() }, ...flags]);
        setShowForm(false);
        setEntityId("");
        setReason("");
      }
    } finally { setBusy(false); }
  }

  async function resolveFlag(id: string) {
    const resolution = prompt("Resolution note:");
    if (!resolution) return;
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
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <button className={filter === "open" ? "button" : "button-secondary"} onClick={() => setFilter("open")}>
          Open ({flags.filter((f) => !f.resolvedAt).length})
        </button>
        <button className={filter === "all" ? "button" : "button-secondary"} onClick={() => setFilter("all")}>
          All ({flags.length})
        </button>
        <button className={filter === "resolved" ? "button" : "button-secondary"} onClick={() => setFilter("resolved")}>
          Resolved ({flags.filter((f) => !!f.resolvedAt).length})
        </button>
        <div style={{ flex: 1 }} />
        <button className="button" onClick={() => setShowForm(!showForm)}>Flag risk</button>
      </div>

      {showForm && (
        <div className="card" style={{ padding: 18, marginBottom: 16 }}>
          <form onSubmit={createFlag} style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <select value={entityType} onChange={(e) => setEntityType(e.target.value)} style={{ width: 140 }}>
                {["NODE", "PROJECT", "DEAL", "TASK", "AGENT", "EVIDENCE", "POB", "CAPITAL", "USER"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <input placeholder="Entity ID *" value={entityId} onChange={(e) => setEntityId(e.target.value)} required style={{ flex: 1, minWidth: 160 }} />
              <select value={severity} onChange={(e) => setSeverity(e.target.value)} style={{ width: 120 }}>
                {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <textarea placeholder="Reason *" value={reason} onChange={(e) => setReason(e.target.value)} required rows={2} />
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" className="button" disabled={busy}>{busy ? "Creating..." : "Create flag"}</button>
              <button type="button" className="button-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="apps-list">
        {displayed.map((f) => (
          <div key={f.id} className="apps-row" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className={`status-dot ${f.resolvedAt ? "status-dot-green" : f.severity === "CRITICAL" || f.severity === "HIGH" ? "status-dot-red" : "status-dot-amber"}`} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>{f.entityType} · {f.entityId.slice(0, 12)}...</div>
              <div className="muted" style={{ fontSize: 13 }}>{f.reason}</div>
              {f.resolution && <div style={{ fontSize: 12, color: "var(--green)", marginTop: 2 }}>Resolution: {f.resolution}</div>}
            </div>
            <span className={`badge ${SEV_BADGE[f.severity] ?? ""}`}>{f.severity}</span>
            <span className="muted" style={{ fontSize: 11 }}>{new Date(f.createdAt).toLocaleDateString()}</span>
            {!f.resolvedAt && (
              <button className="button-secondary" style={{ fontSize: 11, padding: "2px 8px" }} onClick={() => resolveFlag(f.id)}>Resolve</button>
            )}
          </div>
        ))}
        {displayed.length === 0 && <p className="muted" style={{ padding: 20, textAlign: "center" }}>No risk flags.</p>}
      </div>
    </div>
  );
}
