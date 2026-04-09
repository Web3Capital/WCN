"use client";

import { useState } from "react";
import Link from "next/link";

type NodeData = {
  id: string;
  name: string;
  type: string;
  status: string;
  level: number;
  region: string | null;
  city: string | null;
  jurisdiction: string | null;
  description: string | null;
  tags: string[];
  entityName: string | null;
  entityType: string | null;
  contactName: string | null;
  contactEmail: string | null;
  resourcesOffered: string | null;
  pastCases: string | null;
  recommendation: string | null;
  allowedServices: string[];
  riskLevel: string | null;
  billingStatus: string | null;
  depositStatus: string | null;
  seatFeeStatus: string | null;
  onboardingScore: number | null;
  owner: { id: string; name: string | null; email: string | null } | null;
  projects: { id: string; name: string; status: string }[];
  tasksAsOwner: { id: string; title: string; status: string }[];
  ownedAgents: { id: string; name: string; status: string; type: string }[];
  _count: { pobRecords: number; settlementLines: number };
};

const LIFECYCLE = [
  "DRAFT", "SUBMITTED", "UNDER_REVIEW", "NEED_MORE_INFO", "APPROVED",
  "CONTRACTING", "LIVE", "PROBATION", "SUSPENDED", "OFFBOARDED", "REJECTED",
];

const STATUS_COLOR: Record<string, string> = {
  LIVE: "badge-green", APPROVED: "badge-green",
  SUSPENDED: "badge-red", REJECTED: "badge-red", OFFBOARDED: "badge-red",
  SUBMITTED: "badge-amber", UNDER_REVIEW: "badge-amber", CONTRACTING: "badge-amber", PROBATION: "badge-amber",
};

export function NodeDetail({ node, isAdmin }: { node: NodeData; isAdmin: boolean }) {
  const [status, setStatus] = useState(node.status);
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function transition(newStatus: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/nodes/${node.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, notes: notes || undefined }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatus(newStatus);
        setNotes("");
      } else {
        setError(data.error || "Transition failed.");
      }
    } finally { setBusy(false); }
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span className="eyebrow">Node</span>
        <span className={`badge ${STATUS_COLOR[status] ?? ""}`}>{status}</span>
        <span className="badge">{node.type}</span>
        <span className="badge">L{node.level}</span>
        {node.riskLevel && <span className="badge badge-red">{node.riskLevel}</span>}
      </div>
      <h1 style={{ marginTop: 4 }}>{node.name}</h1>
      {node.owner && (
        <p className="muted" style={{ margin: "4px 0 0" }}>
          Owner: {node.owner.name || node.owner.email}
        </p>
      )}

      <div className="grid-2" style={{ marginTop: 20, gap: 16 }}>
        <div className="card" style={{ padding: 18 }}>
          <h3 style={{ margin: "0 0 12px" }}>Profile</h3>
          <div style={{ display: "grid", gap: 8, fontSize: 14 }}>
            {node.region && <div><span className="muted">Region:</span> {node.region}</div>}
            {node.city && <div><span className="muted">City:</span> {node.city}</div>}
            {node.jurisdiction && <div><span className="muted">Jurisdiction:</span> {node.jurisdiction}</div>}
            {node.entityName && <div><span className="muted">Entity:</span> {node.entityName} {node.entityType ? `(${node.entityType})` : ""}</div>}
            {node.contactName && <div><span className="muted">Contact:</span> {node.contactName}</div>}
            {node.contactEmail && <div><span className="muted">Email:</span> {node.contactEmail}</div>}
            {node.resourcesOffered && <div><span className="muted">Resources:</span> {node.resourcesOffered}</div>}
            {node.pastCases && <div><span className="muted">Past cases:</span> {node.pastCases}</div>}
            {node.recommendation && <div><span className="muted">Recommendation:</span> {node.recommendation}</div>}
            {node.description && <div style={{ marginTop: 8 }}><span className="muted">Description:</span><p style={{ margin: "4px 0 0" }}>{node.description}</p></div>}
          </div>
          {node.tags.length > 0 && (
            <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
              {node.tags.map((t) => <span key={t} className="badge" style={{ fontSize: 11 }}>{t}</span>)}
            </div>
          )}
          {node.allowedServices.length > 0 && (
            <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
              <span className="muted" style={{ fontSize: 12 }}>Services:</span>
              {node.allowedServices.map((s) => <span key={s} className="badge badge-accent" style={{ fontSize: 11 }}>{s}</span>)}
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 18 }}>
          <h3 style={{ margin: "0 0 12px" }}>Stats & Billing</h3>
          <div className="grid-2" style={{ gap: 12, marginBottom: 14 }}>
            <div><div className="stat-number">{node.projects.length}</div><div className="stat-label">Projects</div></div>
            <div><div className="stat-number">{node.tasksAsOwner.length}</div><div className="stat-label">Tasks</div></div>
            <div><div className="stat-number">{node._count.pobRecords}</div><div className="stat-label">PoB records</div></div>
            <div><div className="stat-number">{node.ownedAgents.length}</div><div className="stat-label">Agents</div></div>
          </div>
          {isAdmin && (
            <div style={{ display: "grid", gap: 6, fontSize: 13 }}>
              <div><span className="muted">Billing:</span> {node.billingStatus ?? "—"}</div>
              <div><span className="muted">Deposit:</span> {node.depositStatus ?? "—"}</div>
              <div><span className="muted">Seat fee:</span> {node.seatFeeStatus ?? "—"}</div>
              {node.onboardingScore != null && <div><span className="muted">Onboarding score:</span> {node.onboardingScore}</div>}
            </div>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="card" style={{ padding: 18, marginTop: 16 }}>
          <h3 style={{ margin: "0 0 12px" }}>Lifecycle Actions</h3>
          <input
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ marginBottom: 10, width: "100%", maxWidth: 400 }}
          />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {LIFECYCLE.map((s) => (
              <button
                key={s}
                className="button-secondary"
                style={{ fontSize: 12 }}
                disabled={busy || s === status}
                onClick={() => transition(s)}
              >
                {s.replace(/_/g, " ")}
              </button>
            ))}
          </div>
          {error && <p className="form-error" style={{ marginTop: 8 }}>{error}</p>}
        </div>
      )}

      {node.projects.length > 0 && (
        <div className="card" style={{ padding: 18, marginTop: 16 }}>
          <h3 style={{ margin: "0 0 12px" }}>Projects</h3>
          <div style={{ display: "grid", gap: 8 }}>
            {node.projects.map((p) => (
              <Link key={p.id} href={`/dashboard/projects/${p.id}`} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                <span className={`status-dot ${p.status === "ACTIVE" || p.status === "APPROVED" ? "status-dot-green" : p.status === "REJECTED" ? "status-dot-red" : "status-dot-amber"}`} />
                <span style={{ fontWeight: 600 }}>{p.name}</span>
                <span className="badge" style={{ fontSize: 11 }}>{p.status}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {node.tasksAsOwner.length > 0 && (
        <div className="card" style={{ padding: 18, marginTop: 16 }}>
          <h3 style={{ margin: "0 0 12px" }}>Tasks</h3>
          <div style={{ display: "grid", gap: 8 }}>
            {node.tasksAsOwner.map((t) => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                <span className={`status-dot ${t.status === "CLOSED" || t.status === "ACCEPTED" ? "status-dot-green" : t.status === "CANCELLED" ? "status-dot-red" : "status-dot-amber"}`} />
                <span style={{ fontWeight: 600 }}>{t.title}</span>
                <span className="badge" style={{ fontSize: 11 }}>{t.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {node.ownedAgents.length > 0 && (
        <div className="card" style={{ padding: 18, marginTop: 16 }}>
          <h3 style={{ margin: "0 0 12px" }}>Agents</h3>
          <div style={{ display: "grid", gap: 8 }}>
            {node.ownedAgents.map((a) => (
              <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                <span className={`status-dot ${a.status === "ACTIVE" ? "status-dot-green" : a.status === "SUSPENDED" ? "status-dot-red" : "status-dot-amber"}`} />
                <span style={{ fontWeight: 600 }}>{a.name}</span>
                <span className="badge badge-purple" style={{ fontSize: 11 }}>{a.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
