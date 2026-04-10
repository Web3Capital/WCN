"use client";

import { useState } from "react";
import Link from "next/link";
import { StatusBadge, EmptyState, FormCard } from "../_components";

type CapitalRow = {
  id: string;
  name: string;
  status: string;
  entity: string | null;
  investmentFocus: string[];
  ticketMin: number | null;
  ticketMax: number | null;
  contactName: string | null;
  node: { id: string; name: string } | null;
  createdAt: string;
};

export function CapitalConsole({ initialProfiles, nodes, isAdmin }: {
  initialProfiles: CapitalRow[];
  nodes: { id: string; name: string }[];
  isAdmin: boolean;
}) {
  const [profiles, setProfiles] = useState(initialProfiles);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [entity, setEntity] = useState("");
  const [nodeId, setNodeId] = useState("");
  const [ticketMin, setTicketMin] = useState("");
  const [ticketMax, setTicketMax] = useState("");
  const [busy, setBusy] = useState(false);

  async function createProfile(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/capital", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, entity: entity || null,
          nodeId: nodeId || null,
          ticketMin: ticketMin ? Number(ticketMin) : null,
          ticketMax: ticketMax ? Number(ticketMax) : null,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setProfiles([{ ...data.data, node: nodes.find((n) => n.id === nodeId) ?? null }, ...profiles]);
        setShowForm(false);
        setName(""); setEntity(""); setNodeId(""); setTicketMin(""); setTicketMax("");
      }
    } finally { setBusy(false); }
  }

  return (
    <div className="mt-20">
      {isAdmin && (
        <FormCard open={showForm} onToggle={() => setShowForm(!showForm)} triggerLabel="Add capital profile">
          <form onSubmit={createProfile} className="form">
            <div className="grid-2 gap-12">
              <label className="field">
                <span className="label">Name</span>
                <input placeholder="Name *" value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
              <label className="field">
                <span className="label">Entity</span>
                <input placeholder="Entity" value={entity} onChange={(e) => setEntity(e.target.value)} />
              </label>
            </div>
            <div className="grid-3 gap-12">
              <label className="field">
                <span className="label">Linked node</span>
                <select value={nodeId} onChange={(e) => setNodeId(e.target.value)}>
                  <option value="">No linked node</option>
                  {nodes.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
              </label>
              <label className="field">
                <span className="label">Min ticket</span>
                <input type="number" placeholder="Min ticket" value={ticketMin} onChange={(e) => setTicketMin(e.target.value)} />
              </label>
              <label className="field">
                <span className="label">Max ticket</span>
                <input type="number" placeholder="Max ticket" value={ticketMax} onChange={(e) => setTicketMax(e.target.value)} />
              </label>
            </div>
            <div className="flex gap-8">
              <button type="submit" className="button" disabled={busy}>{busy ? "Creating..." : "Create"}</button>
              <button type="button" className="button-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </FormCard>
      )}

      {!isAdmin && (
        <div className="card mb-16" style={{ padding: "10px 14px", background: "var(--amber-bg)", border: "1px solid color-mix(in oklab, var(--amber) 25%, transparent)" }}>
          <p className="muted text-sm" style={{ margin: 0 }}>Read-only view. Contact admin for changes.</p>
        </div>
      )}

      <div className="apps-list">
        {profiles.map((p) => (
          <Link
            key={p.id}
            href={`/dashboard/capital/${p.id}`}
            className="apps-row flex items-center gap-12"
          >
            <span className={`status-dot ${p.status === "ACTIVE" || p.status === "CLOSED" ? "status-dot-green" : p.status === "PASSED" || p.status === "DORMANT" ? "status-dot-red" : "status-dot-amber"}`} />
            <div style={{ flex: 1 }}>
              <div className="font-bold">{p.name}</div>
              <div className="muted text-sm">
                {p.entity ?? "—"} {p.node ? `· ${p.node.name}` : ""}
                {p.ticketMin != null || p.ticketMax != null ? ` · $${p.ticketMin?.toLocaleString() ?? "?"}–${p.ticketMax?.toLocaleString() ?? "?"}` : ""}
              </div>
            </div>
            <StatusBadge status={p.status} />
            <span className="muted text-xs">{new Date(p.createdAt).toLocaleDateString()}</span>
          </Link>
        ))}
        {profiles.length === 0 && (
          <EmptyState message="No capital profiles yet." />
        )}
      </div>
    </div>
  );
}
