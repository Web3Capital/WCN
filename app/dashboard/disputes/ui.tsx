"use client";

import { useState } from "react";
import Link from "next/link";

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
  OPEN: "badge-yellow",
  UNDER_REVIEW: "",
  RESOLVED: "badge-green",
  DISMISSED: "badge-red",
  ESCALATED: "badge-red",
  REJECTED: "badge-red",
};

export function DisputesUI({ disputes }: { disputes: Dispute[] }) {
  const [filter, setFilter] = useState("ALL");
  const [busy, setBusy] = useState<string | null>(null);

  const filtered = filter === "ALL" ? disputes : disputes.filter((d) => d.status === filter);

  async function resolve(id: string, resolution: string, status: string) {
    setBusy(id);
    try {
      await fetch(`/api/disputes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, resolution }),
      });
      window.location.reload();
    } catch { /* ignore */ }
    setBusy(null);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>Disputes</h1>
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>{disputes.length} total disputes</p>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {["ALL", "OPEN", "UNDER_REVIEW", "RESOLVED", "DISMISSED", "ESCALATED"].map((s) => (
            <button
              key={s}
              className={`badge ${filter === s ? "badge-green" : ""}`}
              style={{ cursor: "pointer", fontSize: 10, padding: "4px 8px" }}
              onClick={() => setFilter(s)}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ padding: 32, textAlign: "center" }}>
          <p className="muted">No disputes matching filter.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {filtered.map((d) => (
            <div key={d.id} className="card" style={{ padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                    <span className={`badge ${STATUS_COLORS[d.status] ?? ""}`} style={{ fontSize: 10 }}>{d.status}</span>
                    <span className="badge" style={{ fontSize: 10 }}>{d.targetType}</span>
                    {d.pob && <span className="muted" style={{ fontSize: 11 }}>PoB: {d.pob.businessType}</span>}
                  </div>
                  <p style={{ margin: "0 0 4px", fontWeight: 600, fontSize: 14 }}>{d.reason}</p>
                  {d.resolution && <p className="muted" style={{ margin: 0, fontSize: 12 }}>Resolution: {d.resolution}</p>}
                  <div className="muted" style={{ fontSize: 11, marginTop: 4, display: "flex", gap: 12 }}>
                    <span>Filed: {new Date(d.createdAt).toLocaleDateString()}</span>
                    {d.windowEndsAt && <span>Window ends: {new Date(d.windowEndsAt).toLocaleDateString()}</span>}
                    {d.resolvedAt && <span>Resolved: {new Date(d.resolvedAt).toLocaleDateString()}</span>}
                  </div>
                </div>
                {d.status === "OPEN" && (
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    <button
                      className="button"
                      style={{ fontSize: 10, padding: "3px 8px" }}
                      disabled={busy === d.id}
                      onClick={() => resolve(d.id, "Resolved by reviewer.", "RESOLVED")}
                    >
                      Resolve
                    </button>
                    <button
                      className="button"
                      style={{ fontSize: 10, padding: "3px 8px", background: "var(--red)", color: "#fff" }}
                      disabled={busy === d.id}
                      onClick={() => resolve(d.id, "Dismissed.", "DISMISSED")}
                    >
                      Dismiss
                    </button>
                    <button
                      className="button"
                      style={{ fontSize: 10, padding: "3px 8px", background: "var(--yellow)", color: "#000" }}
                      disabled={busy === d.id}
                      onClick={() => resolve(d.id, "Escalated for further review.", "ESCALATED")}
                    >
                      Escalate
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
