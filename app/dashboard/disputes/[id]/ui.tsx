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

type PobData = {
  id: string;
  businessType: string;
  score: number;
  status: string;
  node: { id: string; name: string } | null;
  project: { id: string; name: string } | null;
  deal: { id: string; title: string } | null;
  attributions: Attribution[];
} | null;

type DisputeData = {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  resolution: string | null;
  windowEndsAt: string | null;
  createdAt: string;
  resolvedAt: string | null;
  pob: PobData;
};

type AuditEntry = {
  id: string;
  action: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actorUserId: string | null;
};

const STATUS_COLOR: Record<string, string> = {
  OPEN: "badge-red",
  UNDER_REVIEW: "badge-amber",
  RESOLVED: "badge-green",
  DISMISSED: "badge-red",
  ESCALATED: "badge-purple",
};

export function DisputeDetail({
  dispute,
  auditLogs,
  isAdmin,
}: {
  dispute: DisputeData;
  auditLogs: AuditEntry[];
  isAdmin: boolean;
}) {
  const [status, setStatus] = useState(dispute.status);
  const [resolution, setResolution] = useState(dispute.resolution ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updateDispute(newStatus: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/disputes/${dispute.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, resolution: resolution || null }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatus(newStatus);
      } else {
        setError(data.error?.message || data.error || "Action failed.");
      }
    } catch {
      setError("Network error.");
    }
    setBusy(false);
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span className="eyebrow">Dispute</span>
        <span className={`badge ${STATUS_COLOR[status] ?? ""}`}>{status}</span>
        <span className="badge" style={{ fontSize: 11 }}>{dispute.targetType}</span>
      </div>
      <h1 style={{ marginTop: 4, fontSize: 20 }}>{dispute.reason}</h1>
      <p className="muted" style={{ margin: "4px 0 0" }}>
        Filed: {new Date(dispute.createdAt).toLocaleString()}
        {dispute.resolvedAt && <> · Resolved: {new Date(dispute.resolvedAt).toLocaleString()}</>}
        {dispute.windowEndsAt && <> · Window ends: {new Date(dispute.windowEndsAt).toLocaleDateString()}</>}
      </p>

      {dispute.resolution && (
        <div className="card" style={{ padding: 18, marginTop: 16, borderLeft: "3px solid var(--green)" }}>
          <h3 style={{ margin: "0 0 4px" }}>Resolution</h3>
          <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{dispute.resolution}</p>
        </div>
      )}

      {/* Related PoB */}
      {dispute.pob && (
        <div className="card" style={{ padding: 18, marginTop: 16 }}>
          <h3 style={{ margin: "0 0 12px" }}>Related PoB Record</h3>
          <div className="grid-2" style={{ gap: 12 }}>
            <div className="kpi">
              <strong>Business Type</strong>
              <Link href={`/dashboard/pob/${dispute.pob.id}`} style={{ color: "var(--accent)" }}>{dispute.pob.businessType}</Link>
            </div>
            <div className="kpi">
              <strong>Score</strong>
              <span>{dispute.pob.score}</span>
            </div>
            <div className="kpi">
              <strong>Status</strong>
              <span className="badge">{dispute.pob.status}</span>
            </div>
            {dispute.pob.node && (
              <div className="kpi">
                <strong>Node</strong>
                <Link href={`/dashboard/nodes/${dispute.pob.node.id}`} style={{ color: "var(--accent)" }}>{dispute.pob.node.name}</Link>
              </div>
            )}
            {dispute.pob.project && (
              <div className="kpi">
                <strong>Project</strong>
                <Link href={`/dashboard/projects/${dispute.pob.project.id}`} style={{ color: "var(--accent)" }}>{dispute.pob.project.name}</Link>
              </div>
            )}
            {dispute.pob.deal && (
              <div className="kpi">
                <strong>Deal</strong>
                <Link href={`/dashboard/deals/${dispute.pob.deal.id}`} style={{ color: "var(--accent)" }}>{dispute.pob.deal.title}</Link>
              </div>
            )}
          </div>

          {dispute.pob.attributions.length > 0 && (
            <>
              <h4 style={{ margin: "14px 0 8px" }}>Attribution</h4>
              <div style={{ display: "grid", gap: 6 }}>
                {dispute.pob.attributions.map((a) => (
                  <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                    <span className="status-dot status-dot-accent" />
                    <span style={{ fontWeight: 600 }}>{a.node?.name ?? a.nodeId}</span>
                    <span className="badge" style={{ fontSize: 11 }}>{a.role}</span>
                    <span className="badge badge-accent" style={{ fontSize: 11 }}>{a.shareBps} bps</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Admin actions */}
      {isAdmin && status === "OPEN" && (
        <div className="card" style={{ padding: 18, marginTop: 16 }}>
          <h3 style={{ margin: "0 0 12px" }}>Actions</h3>
          <label className="field">
            <span className="label">Resolution note</span>
            <textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="Enter resolution note..."
            />
          </label>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button className="button" disabled={busy || !resolution.trim()} onClick={() => updateDispute("RESOLVED")}>
              {busy ? "Working..." : "Resolve"}
            </button>
            <button className="button-secondary" disabled={busy} onClick={() => updateDispute("DISMISSED")} style={{ color: "var(--red)" }}>
              Dismiss
            </button>
            <button className="button-secondary" disabled={busy} onClick={() => updateDispute("ESCALATED")} style={{ color: "var(--amber)" }}>
              Escalate
            </button>
          </div>
          {error && <p className="form-error" style={{ marginTop: 8 }}>{error}</p>}
        </div>
      )}

      {/* Audit Log */}
      {auditLogs.length > 0 && (
        <div className="card" style={{ padding: 18, marginTop: 16 }}>
          <h3 style={{ margin: "0 0 12px" }}>Audit Trail</h3>
          <div className="timeline">
            {auditLogs.map((log) => (
              <div key={log.id} className="timeline-item">
                <span className="timeline-dot" />
                <div className="timeline-content">
                  <div style={{ fontSize: 14 }}>
                    <span style={{ fontWeight: 700 }}>{log.action}</span>
                    {log.metadata && (log.metadata as Record<string, string>).previousStatus && (
                      <span className="muted" style={{ marginLeft: 8 }}>
                        {String((log.metadata as Record<string, string>).previousStatus)} → {String((log.metadata as Record<string, string>).newStatus)}
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
