"use client";

import { useState } from "react";
import Link from "next/link";
import { ConfirmDialog } from "../_components/confirm-dialog";

type Dispute = {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  resolution: string | null;
  windowEndsAt: string | null;
  createdAt: string;
  resolvedAt: string | null;
  pob: { id: string; businessType: string; loopType: string | null } | null;
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: "badge-yellow", UNDER_REVIEW: "badge-amber",
  RESOLVED: "badge-green", DISMISSED: "badge-red", ESCALATED: "badge-red",
  REJECTED: "badge-red",
};

const FILTERS = ["ALL", "OPEN", "UNDER_REVIEW", "RESOLVED", "DISMISSED", "ESCALATED"] as const;

export function DisputesUI({ disputes: initialDisputes }: { disputes: Dispute[] }) {
  const [disputes, setDisputes] = useState(initialDisputes);
  const [filter, setFilter] = useState("ALL");
  const [busy, setBusy] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ id: string; status: string; defaultResolution: string } | null>(null);

  const filtered = filter === "ALL" ? disputes : disputes.filter((d) => d.status === filter);

  async function resolve(id: string, resolution: string, status: string) {
    setBusy(id);
    try {
      const res = await fetch(`/api/disputes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, resolution }),
      });
      const data = await res.json();
      if (data.ok) {
        setDisputes((prev) => prev.map((d) =>
          d.id === id ? { ...d, status, resolution, resolvedAt: new Date().toISOString() } : d
        ));
      }
    } catch { /* ignore */ }
    setBusy(null);
  }

  return (
    <div>
      <div className="page-toolbar" style={{ marginBottom: 20 }}>
        <p className="muted" style={{ margin: 0, fontSize: 13 }}>{disputes.length} total disputes</p>
        <div className="page-toolbar-spacer" />
        <div className="chip-group">
          {FILTERS.map((s) => (
            <button key={s} className={`chip ${filter === s ? "chip-active" : ""}`} onClick={() => setFilter(s)}>
              {s.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state card"><p>No disputes matching filter.</p></div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Target</th>
              <th>Reason</th>
              <th>Filed</th>
              <th>Window</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id}>
                <td>
                  <span className={`badge ${STATUS_COLORS[d.status] ?? ""}`}>{d.status}</span>
                  {d.pob && <div className="muted" style={{ fontSize: 10, marginTop: 2 }}>PoB: {d.pob.businessType}</div>}
                </td>
                <td>
                  <span className="badge" style={{ fontSize: 10 }}>{d.targetType}</span>
                </td>
                <td>
                  <Link href={`/dashboard/disputes/${d.id}`} style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)" }}>{d.reason}</Link>
                  {d.resolution && <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{d.resolution}</div>}
                </td>
                <td className="muted" style={{ fontSize: 11 }}>{new Date(d.createdAt).toLocaleDateString()}</td>
                <td className="muted" style={{ fontSize: 11 }}>
                  {d.windowEndsAt ? new Date(d.windowEndsAt).toLocaleDateString() : "—"}
                </td>
                <td>
                  {d.status === "OPEN" && (
                    <div style={{ display: "flex", gap: 4 }}>
                      <button className="button" style={{ fontSize: 10, padding: "3px 8px" }} disabled={busy === d.id}
                        onClick={() => setDialog({ id: d.id, status: "RESOLVED", defaultResolution: "Resolved by reviewer." })}>
                        Resolve
                      </button>
                      <button className="button-secondary" style={{ fontSize: 10, padding: "3px 8px", color: "var(--red)" }} disabled={busy === d.id}
                        onClick={() => resolve(d.id, "Dismissed.", "DISMISSED")}>
                        Dismiss
                      </button>
                      <button className="button-secondary" style={{ fontSize: 10, padding: "3px 8px", color: "var(--amber)" }} disabled={busy === d.id}
                        onClick={() => resolve(d.id, "Escalated for further review.", "ESCALATED")}>
                        Escalate
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <ConfirmDialog
        open={!!dialog}
        title="Resolve Dispute"
        description="Provide a resolution note."
        confirmLabel="Resolve"
        withInput
        inputLabel="Resolution"
        inputPlaceholder={dialog?.defaultResolution ?? "Resolution note..."}
        onConfirm={(val) => {
          if (dialog && val) resolve(dialog.id, val, dialog.status);
          setDialog(null);
        }}
        onCancel={() => setDialog(null)}
      />
    </div>
  );
}
