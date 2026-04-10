"use client";

import { useEffect, useMemo, useState } from "react";

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

type ReviewRow = {
  id: string;
  decision: string;
  notes: string | null;
  createdAt: string | Date;
  reviewer: { name: string | null; email: string | null } | null;
};

function formatDate(v: string | Date) {
  const d = typeof v === "string" ? new Date(v) : v;
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString();
}

export function ApplicationsTable({
  initial,
  readOnly = false
}: {
  initial: Application[];
  readOnly?: boolean;
}) {
  const [items, setItems] = useState<Application[]>(initial);
  const [activeId, setActiveId] = useState<string | null>(initial[0]?.id ?? null);
  const active = useMemo(() => items.find((i) => i.id === activeId) ?? null, [items, activeId]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);

  useEffect(() => {
    if (!activeId || readOnly) { setReviews([]); return; }
    fetch(`/api/reviews?targetType=APPLICATION&targetId=${activeId}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (d?.ok) setReviews(d.data ?? []); })
      .catch(() => {});
  }, [activeId, readOnly]);

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
    setItems((prev) => prev.map((x) => (x.id === id ? json.data : x)));
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
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className={`status-dot ${a.status === "APPROVED" ? "status-dot-green" : a.status === "REJECTED" ? "status-dot-red" : a.status === "REVIEWING" ? "status-dot-amber" : ""}`} />
              <div>
                <div style={{ fontWeight: 800, color: "var(--text)" }}>{a.applicantName}</div>
                <div className="muted" style={{ fontSize: 13 }}>{a.organization ?? "—"} · {a.nodeType ?? "—"}</div>
              </div>
            </div>
            <span className={`badge ${a.status === "APPROVED" ? "badge-green" : a.status === "REJECTED" ? "badge-red" : a.status === "REVIEWING" ? "badge-amber" : ""}`}>{a.status}</span>
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
              {readOnly ? (
                <span className="pill">{active.status}</span>
              ) : (
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
              )}
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

            {!readOnly ? (
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
            ) : null}

            {!readOnly && reviews.length > 0 ? (
              <div style={{ marginTop: 14 }}>
                <div className="label">Review history</div>
                <div className="apps-list" style={{ marginTop: 6 }}>
                  {reviews.map((r) => (
                    <div key={r.id} className="apps-row" style={{ cursor: "default" }}>
                      <div style={{ display: "grid", gap: 2 }}>
                        <div style={{ fontWeight: 800, color: "var(--text)" }}>{r.decision}</div>
                        <div className="muted" style={{ fontSize: 13 }}>
                          {r.reviewer?.name || r.reviewer?.email || "system"}
                          {r.notes ? ` — ${r.notes}` : ""}
                        </div>
                      </div>
                      <span className="muted" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                        {formatDate(r.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <p className="muted" style={{ margin: 0 }}>No applications.</p>
        )}
      </div>
    </div>
  );
}

