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

const STAGES = ["ALL", "SOURCED", "MATCHED", "DD", "TERM_SHEET", "SIGNED", "FUNDED", "PASSED", "PAUSED"] as const;

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
      <div className="page-toolbar">
        <div className="chip-group">
          {STAGES.map((s) => (
            <button key={s} className={`chip ${filter === s ? "chip-active" : ""}`} onClick={() => setFilter(s)}>
              {s === "ALL" ? `All (${deals.length})` : s.replace(/_/g, " ")}
            </button>
          ))}
        </div>
        {isAdmin && (
          <>
            <div className="page-toolbar-spacer" />
            <button className="button" onClick={() => setShowForm(!showForm)}>{showForm ? "Cancel" : "New deal"}</button>
          </>
        )}
      </div>

      {isAdmin && showForm && (
        <div className="card" style={{ padding: 18, marginBottom: 16 }}>
          <form onSubmit={createDeal} className="form">
            <label className="field">
              <span className="label">Deal title</span>
              <input placeholder="Deal title *" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </label>
            <div className="grid-2" style={{ gap: 12 }}>
              <label className="field">
                <span className="label">Lead node</span>
                <select value={leadNodeId} onChange={(e) => setLeadNodeId(e.target.value)} required>
                  <option value="">Lead node *</option>
                  {nodes.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
              </label>
              <label className="field">
                <span className="label">Project</span>
                <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                  <option value="">No project</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </label>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" className="button" disabled={busy}>{busy ? "Creating..." : "Create"}</button>
              <button type="button" className="button-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty-state"><p>No deals found.</p></div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 32 }}></th>
              <th>Deal</th>
              <th>Lead Node</th>
              <th>Stage</th>
              <th>Stats</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id}>
                <td>
                  <span className={`status-dot ${d.stage === "SIGNED" || d.stage === "FUNDED" ? "status-dot-green" : d.stage === "PASSED" ? "status-dot-red" : "status-dot-amber"}`} />
                </td>
                <td>
                  <Link href={`/dashboard/deals/${d.id}`} style={{ fontWeight: 700, fontSize: 13, color: "var(--accent)" }}>
                    {d.title}
                  </Link>
                  {d.nextAction && <div className="muted" style={{ fontSize: 11 }}>Next: {d.nextAction}</div>}
                </td>
                <td>
                  <div style={{ fontSize: 13 }}>{d.leadNode.name}</div>
                  {d.project && <div className="muted" style={{ fontSize: 11 }}>{d.project.name}</div>}
                </td>
                <td><span className={`badge ${STAGE_BADGE[d.stage] ?? ""}`}>{d.stage.replace(/_/g, " ")}</span></td>
                <td className="muted" style={{ fontSize: 11 }}>{d._count.tasks}T · {d._count.milestones}M · {d._count.participants}P</td>
                <td className="muted" style={{ fontSize: 11 }}>{new Date(d.updatedAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
