"use client";

import { useState } from "react";
import Link from "next/link";

type ProjectData = {
  id: string;
  name: string;
  status: string;
  stage: string;
  sector: string | null;
  website: string | null;
  description: string | null;
  confidentialityLevel: string;
  riskTags: string[];
  internalScore: number | null;
  internalNotes: string | null;
  contactName: string | null;
  contactEmail: string | null;
  fundraisingNeed: string | null;
  node: { id: string; name: string } | null;
  tasks: { id: string; title: string; status: string; type: string }[];
  evidence: { id: string; title: string | null; type: string; reviewStatus: string; createdAt: string }[];
  deals: { id: string; title: string; stage: string }[];
  pobRecords: { id: string; businessType: string; score: number; status: string }[];
  _count: { tasks: number; pobRecords: number; evidence: number; deals: number };
};

const STATUS_BADGE: Record<string, string> = {
  DRAFT: "", SUBMITTED: "badge-amber", SCREENED: "badge-amber",
  CURATED: "badge-accent", IN_DEAL_ROOM: "badge-purple", ACTIVE: "badge-green",
  ON_HOLD: "badge-amber", APPROVED: "badge-green", REJECTED: "badge-red", ARCHIVED: "",
};

export function ProjectDetail({ project, isAdmin }: { project: ProjectData; isAdmin: boolean }) {
  const [status, setStatus] = useState(project.status);
  const [busy, setBusy] = useState(false);

  async function updateStatus(newStatus: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.ok) setStatus(newStatus);
    } finally { setBusy(false); }
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span className="eyebrow">Project</span>
        <span className={`badge ${STATUS_BADGE[status] ?? ""}`}>{status}</span>
        <span className="badge">{project.stage}</span>
        {project.confidentialityLevel !== "PUBLIC" && (
          <span className="badge badge-purple">{project.confidentialityLevel}</span>
        )}
      </div>
      <h1 style={{ marginTop: 4 }}>{project.name}</h1>
      {project.node && (
        <p className="muted" style={{ margin: "4px 0 0" }}>
          Node: <Link href={`/dashboard/nodes/${project.node.id}`} style={{ color: "var(--accent)" }}>{project.node.name}</Link>
        </p>
      )}

      <div className="grid-2" style={{ marginTop: 20, gap: 16 }}>
        <div className="card" style={{ padding: 18 }}>
          <h3 style={{ margin: "0 0 12px" }}>Details</h3>
          <div style={{ display: "grid", gap: 8, fontSize: 14 }}>
            {project.sector && <div><span className="muted">Sector:</span> {project.sector}</div>}
            {project.website && <div><span className="muted">Website:</span> <a href={project.website} target="_blank" rel="noopener noreferrer">{project.website}</a></div>}
            {project.fundraisingNeed && <div><span className="muted">Fundraising:</span> {project.fundraisingNeed}</div>}
            {project.contactName && <div><span className="muted">Contact:</span> {project.contactName}</div>}
            {project.contactEmail && <div><span className="muted">Email:</span> {project.contactEmail}</div>}
            {project.description && <div style={{ marginTop: 8 }}><span className="muted">Description:</span><p style={{ margin: "4px 0 0" }}>{project.description}</p></div>}
          </div>
          {project.riskTags.length > 0 && (
            <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
              {project.riskTags.map((t) => <span key={t} className="badge badge-red" style={{ fontSize: 11 }}>{t}</span>)}
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 18 }}>
          <h3 style={{ margin: "0 0 12px" }}>Stats</h3>
          <div className="grid-2" style={{ gap: 12 }}>
            <div><div className="stat-number">{project._count.tasks}</div><div className="stat-label">Tasks</div></div>
            <div><div className="stat-number">{project._count.evidence}</div><div className="stat-label">Evidence</div></div>
            <div><div className="stat-number">{project._count.pobRecords}</div><div className="stat-label">PoB records</div></div>
            <div><div className="stat-number">{project._count.deals}</div><div className="stat-label">Deals</div></div>
          </div>
          {isAdmin && project.internalScore != null && (
            <div style={{ marginTop: 14 }}>
              <span className="muted" style={{ fontSize: 13 }}>Internal score:</span>
              <span style={{ fontWeight: 700, marginLeft: 8 }}>{project.internalScore}</span>
            </div>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="card" style={{ padding: 18, marginTop: 16 }}>
          <h3 style={{ margin: "0 0 12px" }}>Actions</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["SUBMITTED", "SCREENED", "CURATED", "IN_DEAL_ROOM", "ACTIVE", "ON_HOLD", "REJECTED", "ARCHIVED"].map((s) => (
              <button
                key={s}
                className="button-secondary"
                style={{ fontSize: 12 }}
                disabled={busy || s === status}
                onClick={() => updateStatus(s)}
              >
                {s.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>
      )}

      {project.tasks.length > 0 && (
        <div className="card" style={{ padding: 18, marginTop: 16 }}>
          <h3 style={{ margin: "0 0 12px" }}>Tasks</h3>
          <div style={{ display: "grid", gap: 8 }}>
            {project.tasks.map((t) => (
              <Link key={t.id} href={`/dashboard/tasks`} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                <span className={`status-dot ${t.status === "CLOSED" || t.status === "ACCEPTED" ? "status-dot-green" : t.status === "CANCELLED" ? "status-dot-red" : "status-dot-amber"}`} />
                <span style={{ fontWeight: 600 }}>{t.title}</span>
                <span className="badge" style={{ fontSize: 11 }}>{t.type}</span>
                <span className="badge" style={{ fontSize: 11 }}>{t.status}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {project.deals.length > 0 && (
        <div className="card" style={{ padding: 18, marginTop: 16 }}>
          <h3 style={{ margin: "0 0 12px" }}>Deals</h3>
          <div style={{ display: "grid", gap: 8 }}>
            {project.deals.map((d) => (
              <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                <span className="status-dot status-dot-accent" />
                <span style={{ fontWeight: 600 }}>{d.title}</span>
                <span className="badge badge-purple" style={{ fontSize: 11 }}>{d.stage}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isAdmin && project.internalNotes && (
        <div className="card" style={{ padding: 18, marginTop: 16, borderLeft: "3px solid var(--amber)" }}>
          <h3 style={{ margin: "0 0 8px" }}>Internal Notes</h3>
          <p className="muted" style={{ margin: 0, whiteSpace: "pre-wrap" }}>{project.internalNotes}</p>
        </div>
      )}
    </div>
  );
}
