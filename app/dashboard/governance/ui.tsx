"use client";

import { useState } from "react";

type Vote = { id: string; voterId: string; option: string; weight: number };
type Proposal = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  options: string[];
  quorum: number;
  deadline: string | null;
  votes: Vote[];
  createdAt: string;
};

const STATUS_BADGE: Record<string, string> = {
  DRAFT: "", ACTIVE: "badge-green", PASSED: "badge-green", REJECTED: "badge-red", EXECUTED: "badge-green", CANCELLED: "badge-red",
};

export function GovernanceDashboard({ proposals: initial, userId }: { proposals: Proposal[]; userId: string }) {
  const [proposals, setProposals] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("GENERAL");
  const [options, setOptions] = useState("Yes,No");
  const [quorum, setQuorum] = useState("3");
  const [busy, setBusy] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/governance/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || undefined,
          type,
          options: options.split(",").map((o) => o.trim()).filter(Boolean),
          quorum: parseInt(quorum) || 3,
        }),
      });
      const d = await res.json();
      if (d.ok) {
        setProposals([{ ...d.data, votes: [] }, ...proposals]);
        setShowForm(false);
        setTitle(""); setDescription("");
      }
    } finally { setBusy(false); }
  }

  async function vote(proposalId: string, option: string) {
    const res = await fetch("/api/governance/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "vote", proposalId, option }),
    });
    const d = await res.json();
    if (d.ok) {
      setProposals(proposals.map((p) => {
        if (p.id !== proposalId) return p;
        const existingVote = p.votes.find((v) => v.voterId === userId);
        if (existingVote) {
          return { ...p, votes: p.votes.map((v) => v.voterId === userId ? { ...v, option } : v) };
        }
        return { ...p, votes: [...p.votes, { id: d.data.id, voterId: userId, option, weight: 1 }] };
      }));
    }
  }

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button className="button" onClick={() => setShowForm(!showForm)}>New Proposal</button>
      </div>

      {showForm && (
        <div className="card" style={{ padding: 18, marginBottom: 16 }}>
          <form onSubmit={create} className="form">
            <label className="field">
              <span className="label">Title</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </label>
            <label className="field">
              <span className="label">Description</span>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </label>
            <div className="grid-3" style={{ gap: 12 }}>
              <label className="field">
                <span className="label">Type</span>
                <select value={type} onChange={(e) => setType(e.target.value)}>
                  {["GENERAL", "PARAMETER_CHANGE", "BUDGET", "POLICY"].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <label className="field">
                <span className="label">Options (comma-separated)</span>
                <input value={options} onChange={(e) => setOptions(e.target.value)} required />
              </label>
              <label className="field">
                <span className="label">Quorum</span>
                <input type="number" value={quorum} onChange={(e) => setQuorum(e.target.value)} min={1} />
              </label>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" className="button" disabled={busy}>{busy ? "Creating..." : "Create Proposal"}</button>
              <button type="button" className="button-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {proposals.length === 0 ? (
        <div className="empty-state"><p>No proposals yet.</p></div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {proposals.map((p) => {
            const userVote = p.votes.find((v) => v.voterId === userId);
            const voteCounts: Record<string, number> = {};
            for (const opt of p.options) voteCounts[opt] = 0;
            for (const v of p.votes) voteCounts[v.option] = (voteCounts[v.option] ?? 0) + 1;

            return (
              <div key={p.id} className="card" style={{ padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h3 style={{ margin: 0 }}>{p.title}</h3>
                    {p.description && <p className="muted" style={{ margin: "4px 0 0", fontSize: 13 }}>{p.description}</p>}
                  </div>
                  <span className={`badge ${STATUS_BADGE[p.status] ?? ""}`}>{p.status}</span>
                </div>

                <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
                  {p.options.map((opt) => (
                    <button
                      key={opt}
                      className={`chip ${userVote?.option === opt ? "chip-active" : ""}`}
                      onClick={() => p.status === "ACTIVE" && vote(p.id, opt)}
                      disabled={p.status !== "ACTIVE"}
                    >
                      {opt} ({voteCounts[opt] ?? 0})
                    </button>
                  ))}
                </div>

                <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>
                  {p.votes.length} vote{p.votes.length !== 1 ? "s" : ""} · Quorum: {p.quorum}
                  {p.deadline && ` · Deadline: ${new Date(p.deadline).toLocaleDateString()}`}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
