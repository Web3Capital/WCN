"use client";

import { useMemo, useState } from "react";

type Application = {
  id: string;
  status: "PENDING" | "REVIEWING" | "APPROVED" | "REJECTED";
  applicantName: string;
  contact: string;
  organization: string | null;
  role: string | null;
  nodeType: string | null;
  resources: string | null;
  lookingFor: string | null;
  linkedin: string | null;
  whyWcn: string | null;
  notes: string | null;
  createdAt: string | Date;
};

function formatDate(v: string | Date) {
  const d = typeof v === "string" ? new Date(v) : v;
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString();
}

export function ApplicationsTable({ initial }: { initial: Application[] }) {
  const [items, setItems] = useState<Application[]>(initial);
  const [activeId, setActiveId] = useState<string | null>(initial[0]?.id ?? null);
  const active = useMemo(() => items.find((i) => i.id === activeId) ?? null, [items, activeId]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updateApplication(id: string, patch: Partial<Pick<Application, "status" | "notes">>) {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    });
    const json = await res.json().catch(() => null);
    setSaving(false);
    if (!res.ok || !json?.ok) {
      setError(json?.error ?? "Failed to save.");
      return;
    }
    setItems((prev) => prev.map((x) => (x.id === id ? json.application : x)));
  }

  return (
    <div className="apps-layout">
      <div className="apps-list">
        {items.map((a) => (
          <button
            key={a.id}
            type="button"
            className="apps-row"
            data-active={a.id === activeId ? "true" : "false"}
            onClick={() => setActiveId(a.id)}
          >
            <div style={{ display: "grid", gap: 4 }}>
              <div style={{ fontWeight: 800, color: "var(--text)" }}>{a.applicantName}</div>
              <div className="muted" style={{ fontSize: 13 }}>
                {a.organization ?? "—"} · {a.nodeType ?? "—"}
              </div>
            </div>
            <span className="pill">{a.status}</span>
          </button>
        ))}
      </div>

      <div className="apps-detail">
        {active ? (
          <>
            <div className="apps-detail-head">
              <div>
                <h3 style={{ marginBottom: 6 }}>{active.applicantName}</h3>
                <p className="muted" style={{ margin: 0 }}>
                  Submitted: {formatDate(active.createdAt)}
                </p>
              </div>
              <div className="cta-row" style={{ marginTop: 0 }}>
                <select
                  value={active.status}
                  onChange={(e) => updateApplication(active.id, { status: e.target.value as any })}
                  disabled={saving}
                  style={{ width: 180 }}
                >
                  <option value="PENDING">PENDING</option>
                  <option value="REVIEWING">REVIEWING</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>
            </div>

            <div className="grid-2" style={{ marginTop: 14 }}>
              <div className="kpi">
                <strong>Contact</strong>
                <span className="muted">{active.contact}</span>
              </div>
              <div className="kpi">
                <strong>Role</strong>
                <span className="muted">{active.role ?? "—"}</span>
              </div>
              <div className="kpi">
                <strong>Organization</strong>
                <span className="muted">{active.organization ?? "—"}</span>
              </div>
              <div className="kpi">
                <strong>LinkedIn</strong>
                <span className="muted">{active.linkedin ?? "—"}</span>
              </div>
            </div>

            <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
              <div>
                <div className="label">Resources</div>
                <p className="muted" style={{ margin: 0 }}>{active.resources ?? "—"}</p>
              </div>
              <div>
                <div className="label">Looking for</div>
                <p className="muted" style={{ margin: 0 }}>{active.lookingFor ?? "—"}</p>
              </div>
              <div>
                <div className="label">Why WCN</div>
                <p className="muted" style={{ margin: 0 }}>{active.whyWcn ?? "—"}</p>
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <div className="label">Internal notes</div>
              <textarea
                defaultValue={active.notes ?? ""}
                onBlur={(e) => updateApplication(active.id, { notes: e.target.value })}
                placeholder="Add review notes here…"
                disabled={saving}
              />
              <p className="muted" style={{ marginTop: 10, marginBottom: 0, fontSize: 13 }}>
                Notes auto-save on blur.
              </p>
              {error ? <p className="form-error" style={{ marginTop: 10 }}>{error}</p> : null}
            </div>
          </>
        ) : (
          <p className="muted" style={{ margin: 0 }}>No applications.</p>
        )}
      </div>
    </div>
  );
}

