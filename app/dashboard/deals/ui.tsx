"use client";

import { useState } from "react";
import Link from "next/link";

type DealRow = {
  id: string;
  title: string;
  stage: string;
  description: string | null;
  nextAction: string | null;
  project: { id: string; name: string } | null;
  capital: { id: string; name: string } | null;
  leadNode: { id: string; name: string };
  _count: { participants: number; milestones: number; tasks: number };
  updatedAt: string;
};

const STAGE_BADGE: Record<string, string> = {
  SOURCED: "", MATCHED: "badge-amber", INTRO_SENT: "badge-amber",
  MEETING_DONE: "badge-accent", DD: "badge-purple", TERM_SHEET: "badge-purple",
  SIGNED: "badge-green", FUNDED: "badge-green", PASSED: "badge-red", PAUSED: "",
};

export function DealsConsole({ initialDeals, nodes, projects, isAdmin }: {
  initialDeals: DealRow[];
  nodes: { id: string; name: string }[];
  projects: { id: string; name: string }[];
  isAdmin: boolean;
}) {
  const [deals, setDeals] = useState(initialDeals);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [leadNodeId, setLeadNodeId] = useState(nodes[0]?.id ?? "");
  const [projectId, setProjectId] = useState("");
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("ALL");

  const filtered = filter === "ALL" ? deals : deals.filter((d) => d.stage === filter);

  async function createDeal(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, leadNodeId, projectId: projectId || null }),
      });
      const data = await res.json();
      if (data.ok) {
        setDeals([{ ...data.deal, _count: { participants: 0, milestones: 0, tasks: 0 }, capital: null, updatedAt: new Date().toISOString() }, ...deals]);
        setShowForm(false);
        setTitle("");
      }
    } finally { setBusy(false); }
  }

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {["ALL", "SOURCED", "MATCHED", "DD", "TERM_SHEET", "SIGNED", "FUNDED", "PASSED", "PAUSED"].map((s) => (
          <button
            key={s}
            className={filter === s ? "button" : "button-secondary"}
            style={{ fontSize: 12 }}
            onClick={() => setFilter(s)}
          >
            {s === "ALL" ? `All (${deals.length})` : s.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {isAdmin && (
        <div style={{ marginBottom: 16 }}>
          {!showForm ? (
            <button className="button" onClick={() => setShowForm(true)}>New deal</button>
          ) : (
            <div className="card" style={{ padding: 18 }}>
              <form onSubmit={createDeal} style={{ display: "grid", gap: 10 }}>
                <input placeholder="Deal title *" value={title} onChange={(e) => setTitle(e.target.value)} required />
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <select value={leadNodeId} onChange={(e) => setLeadNodeId(e.target.value)} required style={{ flex: 1, minWidth: 160 }}>
                    <option value="">Lead node *</option>
                    {nodes.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
                  </select>
                  <select value={projectId} onChange={(e) => setProjectId(e.target.value)} style={{ flex: 1, minWidth: 160 }}>
                    <option value="">No project</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
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

      <div className="apps-list">
        {filtered.map((d) => (
          <Link
            key={d.id}
            href={`/dashboard/deals/${d.id}`}
            className="apps-row"
            style={{ display: "flex", alignItems: "center", gap: 12 }}
          >
            <span className={`status-dot ${d.stage === "SIGNED" || d.stage === "FUNDED" ? "status-dot-green" : d.stage === "PASSED" ? "status-dot-red" : "status-dot-amber"}`} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>{d.title}</div>
              <div className="muted" style={{ fontSize: 13 }}>
                {d.leadNode.name}
                {d.project ? ` · ${d.project.name}` : ""}
                {d.capital ? ` · ${d.capital.name}` : ""}
                {d.nextAction ? ` · Next: ${d.nextAction}` : ""}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span className={`badge ${STAGE_BADGE[d.stage] ?? ""}`}>{d.stage.replace(/_/g, " ")}</span>
              <span className="muted" style={{ fontSize: 11 }}>{d._count.tasks}T · {d._count.milestones}M · {d._count.participants}P</span>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && <p className="muted" style={{ padding: 20, textAlign: "center" }}>No deals found.</p>}
      </div>
    </div>
  );
}
