"use client";

import { useState } from "react";
import Link from "next/link";
import { DetailLayout, StatusBadge, StatCard } from "../../_components";

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
    <DetailLayout
      backHref="/dashboard/nodes"
      backLabel="All Nodes"
      title={node.name}
      subtitle={node.owner ? `Owner: ${node.owner.name || node.owner.email}` : undefined}
      badge={
        <span className="flex items-center gap-6">
          <StatusBadge status={status} />
          <span className="badge">{node.type}</span>
          <span className="badge">L{node.level}</span>
          {node.riskLevel && <span className="badge badge-red">{node.riskLevel}</span>}
        </span>
      }
    >
      <div className="grid-2 gap-16">
        <div className="card p-18">
          <h3 className="mt-0 mb-12">Profile</h3>
          <div className="flex-col gap-8 text-base">
            {node.region && <div><span className="muted">Region:</span> {node.region}</div>}
            {node.city && <div><span className="muted">City:</span> {node.city}</div>}
            {node.jurisdiction && <div><span className="muted">Jurisdiction:</span> {node.jurisdiction}</div>}
            {node.entityName && <div><span className="muted">Entity:</span> {node.entityName} {node.entityType ? `(${node.entityType})` : ""}</div>}
            {node.contactName && <div><span className="muted">Contact:</span> {node.contactName}</div>}
            {node.contactEmail && <div><span className="muted">Email:</span> {node.contactEmail}</div>}
            {node.resourcesOffered && <div><span className="muted">Resources:</span> {node.resourcesOffered}</div>}
            {node.pastCases && <div><span className="muted">Past cases:</span> {node.pastCases}</div>}
            {node.recommendation && <div><span className="muted">Recommendation:</span> {node.recommendation}</div>}
            {node.description && <div className="mt-8"><span className="muted">Description:</span><p className="mt-4 mb-0">{node.description}</p></div>}
          </div>
          {node.tags.length > 0 && (
            <div className="flex flex-wrap gap-6 mt-12">
              {node.tags.map((t) => <span key={t} className="badge text-xs">{t}</span>)}
            </div>
          )}
          {node.allowedServices.length > 0 && (
            <div className="flex flex-wrap gap-6 items-center mt-8">
              <span className="muted text-xs">Services:</span>
              {node.allowedServices.map((s) => <span key={s} className="badge badge-accent text-xs">{s}</span>)}
            </div>
          )}
        </div>

        <div className="flex-col gap-16">
          <div className="grid-2 gap-12">
            <StatCard label="Projects" value={node.projects.length} />
            <StatCard label="Tasks" value={node.tasksAsOwner.length} />
            <StatCard label="PoB records" value={node._count.pobRecords} />
            <StatCard label="Agents" value={node.ownedAgents.length} />
          </div>
          {isAdmin && (
            <div className="card p-18">
              <h3 className="mt-0 mb-12">Billing</h3>
              <div className="flex-col gap-6 text-sm">
                <div><span className="muted">Billing:</span> {node.billingStatus ?? "—"}</div>
                <div><span className="muted">Deposit:</span> {node.depositStatus ?? "—"}</div>
                <div><span className="muted">Seat fee:</span> {node.seatFeeStatus ?? "—"}</div>
                {node.onboardingScore != null && <div><span className="muted">Onboarding score:</span> {node.onboardingScore}</div>}
              </div>
            </div>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="card p-18">
          <h3 className="mt-0 mb-12">Lifecycle Actions</h3>
          <input
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full mb-8"
            style={{ maxWidth: 400 }}
          />
          <div className="flex flex-wrap gap-8">
            {LIFECYCLE.map((s) => (
              <button
                key={s}
                className="button-secondary text-xs"
                disabled={busy || s === status}
                onClick={() => transition(s)}
              >
                {s.replace(/_/g, " ")}
              </button>
            ))}
          </div>
          {error && <p className="form-error mt-8">{error}</p>}
        </div>
      )}

      {node.projects.length > 0 && (
        <div className="card p-18">
          <h3 className="mt-0 mb-12">Projects</h3>
          <div className="flex-col gap-8">
            {node.projects.map((p) => (
              <Link key={p.id} href={`/dashboard/projects/${p.id}`} className="flex items-center gap-8 text-base">
                <span className={`status-dot ${p.status === "ACTIVE" || p.status === "APPROVED" ? "status-dot-green" : p.status === "REJECTED" ? "status-dot-red" : "status-dot-amber"}`} />
                <span className="font-semibold">{p.name}</span>
                <StatusBadge status={p.status} className="text-xs" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {node.tasksAsOwner.length > 0 && (
        <div className="card p-18">
          <h3 className="mt-0 mb-12">Tasks</h3>
          <div className="flex-col gap-8">
            {node.tasksAsOwner.map((t) => (
              <div key={t.id} className="flex items-center gap-8 text-base">
                <span className={`status-dot ${t.status === "CLOSED" || t.status === "ACCEPTED" ? "status-dot-green" : t.status === "CANCELLED" ? "status-dot-red" : "status-dot-amber"}`} />
                <span className="font-semibold">{t.title}</span>
                <StatusBadge status={t.status} className="text-xs" />
              </div>
            ))}
          </div>
        </div>
      )}

      {node.ownedAgents.length > 0 && (
        <div className="card p-18">
          <h3 className="mt-0 mb-12">Agents</h3>
          <div className="flex-col gap-8">
            {node.ownedAgents.map((a) => (
              <div key={a.id} className="flex items-center gap-8 text-base">
                <span className={`status-dot ${a.status === "ACTIVE" ? "status-dot-green" : a.status === "SUSPENDED" ? "status-dot-red" : "status-dot-amber"}`} />
                <span className="font-semibold">{a.name}</span>
                <span className="badge badge-purple text-xs">{a.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </DetailLayout>
  );
}
