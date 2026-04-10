"use client";

import { useState } from "react";
import Link from "next/link";
import { DetailLayout, StatusBadge } from "../../_components";

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
    <DetailLayout
      backHref="/dashboard/disputes"
      backLabel="All Disputes"
      title={dispute.reason}
      badge={
        <span className="flex items-center gap-6">
          <StatusBadge status={status} />
          <span className="badge text-xs">{dispute.targetType}</span>
        </span>
      }
      meta={
        <>
          <span>Filed: {new Date(dispute.createdAt).toLocaleString()}</span>
          {dispute.resolvedAt && <span>Resolved: {new Date(dispute.resolvedAt).toLocaleString()}</span>}
          {dispute.windowEndsAt && <span>Window ends: {new Date(dispute.windowEndsAt).toLocaleDateString()}</span>}
        </>
      }
    >
      {dispute.resolution && (
        <div className="card p-18" style={{ borderLeft: "3px solid var(--green)" }}>
          <h3 className="mt-0 mb-4">Resolution</h3>
          <p className="mt-0 mb-0" style={{ whiteSpace: "pre-wrap" }}>{dispute.resolution}</p>
        </div>
      )}

      {dispute.pob && (
        <div className="card p-18">
          <h3 className="mt-0 mb-12">Related PoB Record</h3>
          <div className="grid-2 gap-12">
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
              <StatusBadge status={dispute.pob.status} />
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
              <h4 className="mt-16 mb-8">Attribution</h4>
              <div className="flex-col gap-6">
                {dispute.pob.attributions.map((a) => (
                  <div key={a.id} className="flex items-center gap-8 text-base">
                    <span className="status-dot status-dot-accent" />
                    <span className="font-semibold">{a.node?.name ?? a.nodeId}</span>
                    <span className="badge text-xs">{a.role}</span>
                    <span className="badge badge-accent text-xs">{a.shareBps} bps</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {isAdmin && status === "OPEN" && (
        <div className="card p-18">
          <h3 className="mt-0 mb-12">Actions</h3>
          <label className="field">
            <span className="label">Resolution note</span>
            <textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="Enter resolution note..."
            />
          </label>
          <div className="flex gap-8 mt-8">
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
          {error && <p className="form-error mt-8">{error}</p>}
        </div>
      )}

      {auditLogs.length > 0 && (
        <div className="card p-18">
          <h3 className="mt-0 mb-12">Audit Trail</h3>
          <div className="timeline">
            {auditLogs.map((log) => (
              <div key={log.id} className="timeline-item">
                <span className="timeline-dot" />
                <div className="timeline-content">
                  <div className="text-base">
                    <span className="font-bold">{log.action}</span>
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
    </DetailLayout>
  );
}
