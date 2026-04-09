"use client";

import { useState } from "react";
import Link from "next/link";

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

const STATUS_BADGE: Record<string, string> = {
  PROSPECT: "", QUALIFIED: "badge-amber", ACTIVE: "badge-green",
  WARM: "badge-accent", IN_DD: "badge-purple", CLOSED: "badge-green",
  PASSED: "badge-red", DORMANT: "",
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
        setProfiles([{ ...data.profile, node: nodes.find((n) => n.id === nodeId) ?? null }, ...profiles]);
        setShowForm(false);
        setName(""); setEntity(""); setNodeId(""); setTicketMin(""); setTicketMax("");
      }
    } finally { setBusy(false); }
  }

  return (
    <div style={{ marginTop: 20 }}>
      {isAdmin && (
        <div style={{ marginBottom: 16 }}>
          {!showForm ? (
            <button className="button" onClick={() => setShowForm(true)}>Add capital profile</button>
          ) : (
            <div className="card" style={{ padding: 18 }}>
              <form onSubmit={createProfile} className="form">
                <div className="grid-2" style={{ gap: 12 }}>
                  <label className="field">
                    <span className="label">Name</span>
                    <input placeholder="Name *" value={name} onChange={(e) => setName(e.target.value)} required />
                  </label>
                  <label className="field">
                    <span className="label">Entity</span>
                    <input placeholder="Entity" value={entity} onChange={(e) => setEntity(e.target.value)} />
                  </label>
                </div>
                <div className="grid-3" style={{ gap: 12 }}>
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
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="submit" className="button" disabled={busy}>{busy ? "Creating..." : "Create"}</button>
                  <button type="button" className="button-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {!isAdmin && (
        <div className="card" style={{ padding: "10px 14px", marginBottom: 16, background: "var(--amber-bg)", border: "1px solid color-mix(in oklab, var(--amber) 25%, transparent)" }}>
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>Read-only view. Contact admin for changes.</p>
        </div>
      )}

      <div className="apps-list">
        {profiles.map((p) => (
          <Link
            key={p.id}
            href={`/dashboard/capital/${p.id}`}
            className="apps-row"
            style={{ display: "flex", alignItems: "center", gap: 12 }}
          >
            <span className={`status-dot ${p.status === "ACTIVE" || p.status === "CLOSED" ? "status-dot-green" : p.status === "PASSED" || p.status === "DORMANT" ? "status-dot-red" : "status-dot-amber"}`} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>{p.name}</div>
              <div className="muted" style={{ fontSize: 13 }}>
                {p.entity ?? "—"} {p.node ? `· ${p.node.name}` : ""}
                {p.ticketMin != null || p.ticketMax != null ? ` · $${p.ticketMin?.toLocaleString() ?? "?"}–${p.ticketMax?.toLocaleString() ?? "?"}` : ""}
              </div>
            </div>
            <span className={`badge ${STATUS_BADGE[p.status] ?? ""}`}>{p.status}</span>
            <span className="muted" style={{ fontSize: 12 }}>{new Date(p.createdAt).toLocaleDateString()}</span>
          </Link>
        ))}
        {profiles.length === 0 && <p className="muted" style={{ padding: 20, textAlign: "center" }}>No capital profiles yet.</p>}
      </div>
    </div>
  );
}
