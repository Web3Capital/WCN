"use client";

import { useState } from "react";
import Link from "next/link";

type Attribution = {
  id: string;
  nodeId: string;
  role: string;
  shareBps: number;
  node?: { id: string; name: string } | null;
};

type Confirmation = {
  id: string;
  decision: string;
  partyType: string;
  partyUserId: string | null;
  partyNodeId: string | null;
  notes: string | null;
  createdAt: string;
};

type Dispute = {
  id: string;
  status: string;
  reason: string;
  resolution: string | null;
  createdAt: string;
  resolvedAt: string | null;
};

type PobData = {
  id: string;
  businessType: string;
  baseValue: number;
  weight: number;
  qualityMult: number;
  timeMult: number;
  riskDiscount: number;
  score: number;
  status: string;
  pobEventStatus: string;
  notes: string | null;
  frozenAt: string | null;
  frozenReason: string | null;
  task: { id: string; title: string; status: string } | null;
  project: { id: string; name: string } | null;
  node: { id: string; name: string } | null;
  deal: { id: string; title: string; stage: string } | null;
  attributions: Attribution[];
  confirmations: Confirmation[];
  disputes: Dispute[];
  createdAt: string;
  updatedAt: string;
};

type Review = {
  id: string;
  decision: string;
  notes: string | null;
  createdAt: string;
  reviewer: { name: string | null; email: string | null } | null;
};

const STATUS_COLOR: Record<string, string> = {
  APPROVED: "badge-green",
  EFFECTIVE: "badge-green",
  REJECTED: "badge-red",
  FROZEN: "badge-red",
  REVIEWING: "badge-amber",
  SUBMITTED: "badge-amber",
  PENDING: "",
};

const POB_STATUSES = ["PENDING", "REVIEWING", "APPROVED", "REJECTED"];
const EVENT_STATUSES = ["SUBMITTED", "UNDER_REVIEW", "EFFECTIVE", "REJECTED", "FROZEN"];

export function PobDetail({
  record,
  reviews,
  isAdmin,
}: {
  record: PobData;
  reviews: Review[];
  isAdmin: boolean;
}) {
  const [status, setStatus] = useState(record.status);
  const [eventStatus, setEventStatus] = useState(record.pobEventStatus);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function patchRecord(patch: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/pob/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (data.ok) {
        if (patch.status) setStatus(patch.status as string);
        if (patch.pobEventStatus) setEventStatus(patch.pobEventStatus as string);
      } else {
        setError(data.error?.message || data.error || "Update failed.");
      }
    } catch {
      setError("Network error.");
    }
    setBusy(false);
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span className="eyebrow">PoB Record</span>
        <span className={`badge ${STATUS_COLOR[status] ?? ""}`}>{status}</span>
        <span className={`badge ${STATUS_COLOR[eventStatus] ?? ""}`}>{eventStatus}</span>
      </div>
      <h1 style={{ marginTop: 4 }}>{record.businessType}</h1>
      <p className="muted" style={{ margin: "4px 0 0" }}>
        Score: <strong>{record.score}</strong>
        {record.node && <> · Node: <Link href={`/dashboard/nodes/${record.node.id}`} style={{ color: "var(--accent)" }}>{record.node.name}</Link></>}
        {record.project && <> · Project: <Link href={`/dashboard/projects/${record.project.id}`} style={{ color: "var(--accent)" }}>{record.project.name}</Link></>}
        {record.deal && <> · Deal: <Link href={`/dashboard/deals/${record.deal.id}`} style={{ color: "var(--accent)" }}>{record.deal.title}</Link></>}
        {record.task && <> · Task: <Link href={`/dashboard/tasks/${record.task.id}`} style={{ color: "var(--accent)" }}>{record.task.title}</Link></>}
      </p>

      {/* Score Breakdown */}
      <div className="card" style={{ padding: 18, marginTop: 16 }}>
        <h3 style={{ margin: "0 0 12px" }}>Score Breakdown</h3>
        <div className="grid-2" style={{ gap: 12 }}>
          <div className="kpi"><strong>Base Value</strong><span>{record.baseValue}</span></div>
          <div className="kpi"><strong>Weight</strong><span>{record.weight}</span></div>
          <div className="kpi"><strong>Quality Mult</strong><span>{record.qualityMult}</span></div>
          <div className="kpi"><strong>Time Mult</strong><span>{record.timeMult}</span></div>
          <div className="kpi"><strong>Risk Discount</strong><span>{record.riskDiscount}</span></div>
          <div className="kpi"><strong>Final Score</strong><span style={{ fontWeight: 700, color: "var(--accent)" }}>{record.score}</span></div>
        </div>
      </div>

      {/* Status Controls */}
      {isAdmin && (
        <div className="card" style={{ padding: 18, marginTop: 16 }}>
          <h3 style={{ margin: "0 0 12px" }}>Status Transition</h3>
          <div className="grid-2" style={{ gap: 12 }}>
            <label className="field">
              <span className="label">Review Status</span>
              <select
                value={status}
                onChange={(e) => patchRecord({ status: e.target.value })}
                disabled={busy}
              >
                {POB_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className="field">
              <span className="label">Event Status</span>
              <select
                value={eventStatus}
                onChange={(e) => patchRecord({ pobEventStatus: e.target.value })}
                disabled={busy}
              >
                {EVENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          </div>
          {error && <p className="form-error" style={{ marginTop: 8 }}>{error}</p>}
        </div>
      )}

      {record.frozenAt && (
        <div className="card" style={{ padding: 18, marginTop: 16, borderLeft: "3px solid var(--red)" }}>
          <h3 style={{ margin: "0 0 4px", color: "var(--red)" }}>Frozen</h3>
          <p className="muted" style={{ margin: 0 }}>
            Frozen at {new Date(record.frozenAt).toLocaleString()}
            {record.frozenReason && <> — {record.frozenReason}</>}
          </p>
        </div>
      )}

      {record.notes && (
        <div className="card" style={{ padding: 18, marginTop: 16 }}>
          <h3 style={{ margin: "0 0 8px" }}>Notes</h3>
          <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{record.notes}</p>
        </div>
      )}

      <div className="grid-2" style={{ marginTop: 16, gap: 16 }}>
        {/* Attribution */}
        <div className="card" style={{ padding: 18 }}>
          <h3 style={{ margin: "0 0 12px" }}>Attribution ({record.attributions.length})</h3>
          {record.attributions.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>No attributions recorded.</p>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {record.attributions.map((a) => (
                <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                  <span className="status-dot status-dot-accent" />
                  <span style={{ fontWeight: 600 }}>{a.node?.name ?? a.nodeId}</span>
                  <span className="badge" style={{ fontSize: 11 }}>{a.role}</span>
                  <span className="badge badge-accent" style={{ fontSize: 11 }}>{a.shareBps} bps ({Math.round(a.shareBps / 100)}%)</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Confirmations */}
        <div className="card" style={{ padding: 18 }}>
          <h3 style={{ margin: "0 0 12px" }}>Confirmations ({record.confirmations.length})</h3>
          {record.confirmations.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>No confirmations yet.</p>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {record.confirmations.map((c) => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className={`status-dot ${c.decision === "CONFIRM" ? "status-dot-green" : "status-dot-red"}`} />
                    <span style={{ fontWeight: 600 }}>{c.decision}</span>
                    <span className="badge" style={{ fontSize: 11 }}>{c.partyType}</span>
                  </div>
                  <span className="muted" style={{ fontSize: 11 }}>{new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Disputes */}
      {record.disputes.length > 0 && (
        <div className="card" style={{ padding: 18, marginTop: 16 }}>
          <h3 style={{ margin: "0 0 12px" }}>Disputes ({record.disputes.length})</h3>
          <div style={{ display: "grid", gap: 8 }}>
            {record.disputes.map((d) => (
              <div key={d.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className={`badge ${d.status === "OPEN" ? "badge-red" : d.status === "RESOLVED" ? "badge-green" : ""}`}>{d.status}</span>
                  <span>{d.reason}</span>
                </div>
                <Link href={`/dashboard/disputes/${d.id}`} style={{ fontSize: 12, color: "var(--accent)" }}>
                  View
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review History */}
      {reviews.length > 0 && (
        <div className="card" style={{ padding: 18, marginTop: 16 }}>
          <h3 style={{ margin: "0 0 12px" }}>Review History</h3>
          <div className="timeline">
            {reviews.map((r) => (
              <div key={r.id} className="timeline-item">
                <span className="timeline-dot" />
                <div className="timeline-content">
                  <div style={{ fontSize: 14 }}>
                    <span style={{ fontWeight: 700 }}>{r.decision}</span>
                    {r.notes && <> — {r.notes}</>}
                  </div>
                  <div className="timeline-meta">
                    {r.reviewer?.name || r.reviewer?.email || "system"} · {new Date(r.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="muted" style={{ marginTop: 16, fontSize: 12 }}>
        Created: {new Date(record.createdAt).toLocaleString()} · Updated: {new Date(record.updatedAt).toLocaleString()}
      </div>
    </div>
  );
}
