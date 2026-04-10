"use client";

import { useState } from "react";
import Link from "next/link";

type ApplicationData = {
  id: string;
  status: string;
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
  createdAt: string;
  userId: string | null;
  user: { id: string; name: string | null; email: string | null; role: string } | null;
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
  REJECTED: "badge-red",
  REVIEWING: "badge-amber",
  PENDING: "",
};

const STATUSES = ["PENDING", "REVIEWING", "APPROVED", "REJECTED"];

export function ApplicationDetail({
  application,
  reviews,
  isAdmin,
}: {
  application: ApplicationData;
  reviews: Review[];
  isAdmin: boolean;
}) {
  const [status, setStatus] = useState(application.status);
  const [notes, setNotes] = useState(application.notes ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updateApp(patch: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/applications/${application.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (data.ok) {
        if (patch.status) setStatus(patch.status as string);
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
        <span className="eyebrow">Application</span>
        <span className={`badge ${STATUS_COLOR[status] ?? ""}`}>{status}</span>
        {application.nodeType && <span className="badge">{application.nodeType}</span>}
      </div>
      <h1 style={{ marginTop: 4 }}>{application.applicantName}</h1>
      <p className="muted" style={{ margin: "4px 0 0" }}>
        Submitted {new Date(application.createdAt).toLocaleString()}
        {application.user && (
          <> · User: <Link href={`/dashboard/users/${application.user.id}`} style={{ color: "var(--accent)" }}>{application.user.name || application.user.email || application.user.id}</Link></>
        )}
      </p>

      {/* Contact & Profile Info */}
      <div className="card" style={{ padding: 18, marginTop: 16 }}>
        <h3 style={{ margin: "0 0 12px" }}>Applicant Information</h3>
        <div className="grid-2" style={{ gap: 12 }}>
          <div className="kpi">
            <strong>Contact</strong>
            <span className="muted">{application.contact}</span>
          </div>
          <div className="kpi">
            <strong>Organization</strong>
            <span className="muted">{application.organization ?? "—"}</span>
          </div>
          <div className="kpi">
            <strong>Role</strong>
            <span className="muted">{application.role ?? "—"}</span>
          </div>
          <div className="kpi">
            <strong>LinkedIn</strong>
            {application.linkedin ? (
              <a href={application.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>
                {application.linkedin}
              </a>
            ) : (
              <span className="muted">—</span>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Responses */}
      <div className="card" style={{ padding: 18, marginTop: 16 }}>
        <h3 style={{ margin: "0 0 12px" }}>Application Details</h3>
        <div style={{ display: "grid", gap: 14 }}>
          <div>
            <div className="label">Resources & Expertise</div>
            <p style={{ margin: "4px 0 0", whiteSpace: "pre-wrap" }}>{application.resources ?? "—"}</p>
          </div>
          <div>
            <div className="label">Looking For</div>
            <p style={{ margin: "4px 0 0", whiteSpace: "pre-wrap" }}>{application.lookingFor ?? "—"}</p>
          </div>
          <div>
            <div className="label">Why WCN</div>
            <p style={{ margin: "4px 0 0", whiteSpace: "pre-wrap" }}>{application.whyWcn ?? "—"}</p>
          </div>
        </div>
      </div>

      {/* Admin Actions */}
      {isAdmin && (
        <div className="card" style={{ padding: 18, marginTop: 16 }}>
          <h3 style={{ margin: "0 0 12px" }}>Review Actions</h3>
          <div className="grid-2" style={{ gap: 12 }}>
            <label className="field">
              <span className="label">Status</span>
              <select
                value={status}
                onChange={(e) => updateApp({ status: e.target.value })}
                disabled={busy}
              >
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          </div>
          <label className="field" style={{ marginTop: 10 }}>
            <span className="label">Internal Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => updateApp({ reviewNote: notes || null })}
              placeholder="Add review notes..."
            />
          </label>
          <p className="muted" style={{ marginTop: 4, fontSize: 12 }}>Notes auto-save on blur.</p>
          {error && <p className="form-error" style={{ marginTop: 8 }}>{error}</p>}
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
    </div>
  );
}
