"use client";

import { useState } from "react";
import Link from "next/link";

type DealData = {
  id: string;
  title: string;
  stage: string;
  description: string | null;
  riskTags: string[];
  nextAction: string | null;
  nextActionDueAt: string | null;
  confidentialityLevel: string;
  project: { id: string; name: string; status: string; sector: string | null } | null;
  capital: { id: string; name: string; status: string } | null;
  leadNode: { id: string; name: string };
  participants: { id: string; role: string; node: { id: string; name: string } | null }[];
  milestones: { id: string; title: string; dueAt: string | null; doneAt: string | null }[];
  notes: { id: string; content: string; authorId: string; createdAt: string }[];
  tasks: { id: string; title: string; status: string; type: string }[];
  evidence: { id: string; title: string | null; type: string; reviewStatus: string }[];
  pobRecords: { id: string; businessType: string; status: string; score: number }[];
  _count: { participants: number; milestones: number; notes: number; tasks: number; evidence: number };
};

const STAGES = [
  "SOURCED", "MATCHED", "INTRO_SENT", "MEETING_DONE", "DD",
  "TERM_SHEET", "SIGNED", "FUNDED", "PASSED", "PAUSED",
];
const STAGE_COLOR: Record<string, string> = {
  SIGNED: "badge-green", FUNDED: "badge-green", PASSED: "badge-red", PAUSED: "",
  DD: "badge-purple", TERM_SHEET: "badge-purple",
};

export function DealDetail({ deal, nodes, isAdmin }: {
  deal: DealData;
  nodes: { id: string; name: string }[];
  isAdmin: boolean;
}) {
  const [stage, setStage] = useState(deal.stage);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [localNotes, setLocalNotes] = useState(deal.notes);
  const [milestones, setMilestones] = useState(deal.milestones);
  const [msTitle, setMsTitle] = useState("");
  const [participants, setParticipants] = useState(deal.participants);
  const [addNodeId, setAddNodeId] = useState("");

  async function transitionStage(s: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/deals/${deal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: s }),
      });
      const data = await res.json();
      if (data.ok) setStage(s);
      else setError(data.error || "Transition failed.");
    } finally { setBusy(false); }
  }

  async function addNote() {
    if (!noteText.trim()) return;
    const res = await fetch(`/api/deals/${deal.id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: noteText }),
    });
    const data = await res.json();
    if (data.ok) {
      setLocalNotes([{ ...data.data, createdAt: new Date().toISOString() }, ...localNotes]);
      setNoteText("");
    }
  }

  async function addMilestone() {
    if (!msTitle.trim()) return;
    const res = await fetch(`/api/deals/${deal.id}/milestones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: msTitle }),
    });
    const data = await res.json();
    if (data.ok) {
      setMilestones([...milestones, { ...data.data, dueAt: null, doneAt: null }]);
      setMsTitle("");
    }
  }

  async function completeMilestone(msId: string) {
    const res = await fetch(`/api/deals/${deal.id}/milestones`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ milestoneId: msId, doneAt: new Date().toISOString() }),
    });
    const data = await res.json();
    if (data.ok) {
      setMilestones(milestones.map((m) => m.id === msId ? { ...m, doneAt: new Date().toISOString() } : m));
    }
  }

  async function addParticipant() {
    if (!addNodeId) return;
    const res = await fetch(`/api/deals/${deal.id}/participants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nodeId: addNodeId, role: "participant" }),
    });
    const data = await res.json();
    if (data.ok) {
      setParticipants([...participants, data.data]);
      setAddNodeId("");
    }
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span className="eyebrow">Deal Room</span>
        <span className={`badge ${STAGE_COLOR[stage] ?? "badge-amber"}`}>{stage.replace(/_/g, " ")}</span>
        {deal.confidentialityLevel !== "PUBLIC" && (
          <span className="badge badge-purple">{deal.confidentialityLevel}</span>
        )}
      </div>
      <h1 style={{ marginTop: 4 }}>{deal.title}</h1>
      <p className="muted" style={{ margin: "4px 0 0" }}>
        Lead: {deal.leadNode.name}
        {deal.project ? <> · Project: <Link href={`/dashboard/projects/${deal.project.id}`} style={{ color: "var(--accent)" }}>{deal.project.name}</Link></> : null}
        {deal.capital ? <> · Capital: <Link href={`/dashboard/capital/${deal.capital.id}`} style={{ color: "var(--accent)" }}>{deal.capital.name}</Link></> : null}
      </p>

      {isAdmin && (
        <div className="card" style={{ padding: 18, marginTop: 16 }}>
          <h3 style={{ margin: "0 0 12px" }}>Stage Transition</h3>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {STAGES.map((s) => (
              <button key={s} className="button-secondary" style={{ fontSize: 12 }} disabled={busy || s === stage} onClick={() => transitionStage(s)}>
                {s.replace(/_/g, " ")}
              </button>
            ))}
          </div>
          {error && <p className="form-error" style={{ marginTop: 8 }}>{error}</p>}
        </div>
      )}

      <div className="grid-2" style={{ marginTop: 16, gap: 16 }}>
        {/* Participants */}
        <div className="card" style={{ padding: 18 }}>
          <h3 style={{ margin: "0 0 12px" }}>Participants ({participants.length})</h3>
          <div style={{ display: "grid", gap: 8 }}>
            {participants.map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                <span className="status-dot status-dot-accent" />
                <span style={{ fontWeight: 600 }}>{p.node?.name ?? "—"}</span>
                <span className="badge" style={{ fontSize: 11 }}>{p.role}</span>
              </div>
            ))}
          </div>
          {isAdmin && (
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <select value={addNodeId} onChange={(e) => setAddNodeId(e.target.value)} style={{ flex: 1 }}>
                <option value="">Add node...</option>
                {nodes.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
              </select>
              <button className="button-secondary" style={{ fontSize: 12 }} onClick={addParticipant} disabled={!addNodeId}>Add</button>
            </div>
          )}
        </div>

        {/* Milestones */}
        <div className="card" style={{ padding: 18 }}>
          <h3 style={{ margin: "0 0 12px" }}>Milestones ({milestones.length})</h3>
          <div style={{ display: "grid", gap: 8 }}>
            {milestones.map((m) => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                <span className={`status-dot ${m.doneAt ? "status-dot-green" : "status-dot-amber"}`} />
                <span style={{ fontWeight: 600, textDecoration: m.doneAt ? "line-through" : undefined }}>{m.title}</span>
                {m.dueAt && !m.doneAt && <span className="muted" style={{ fontSize: 11 }}>Due {new Date(m.dueAt).toLocaleDateString()}</span>}
                {!m.doneAt && isAdmin && (
                  <button className="button-secondary" style={{ fontSize: 11, padding: "2px 8px" }} onClick={() => completeMilestone(m.id)}>Done</button>
                )}
              </div>
            ))}
          </div>
          {isAdmin && (
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <input placeholder="New milestone" value={msTitle} onChange={(e) => setMsTitle(e.target.value)} style={{ flex: 1 }} />
              <button className="button-secondary" style={{ fontSize: 12 }} onClick={addMilestone} disabled={!msTitle.trim()}>Add</button>
            </div>
          )}
        </div>
      </div>

      {deal.description && (
        <div className="card" style={{ padding: 18, marginTop: 16 }}>
          <h3 style={{ margin: "0 0 8px" }}>Description</h3>
          <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{deal.description}</p>
        </div>
      )}

      {deal.nextAction && (
        <div className="card" style={{ padding: 18, marginTop: 16, borderLeft: "3px solid var(--accent)" }}>
          <h3 style={{ margin: "0 0 4px" }}>Next Action</h3>
          <p style={{ margin: 0 }}>{deal.nextAction}</p>
          {deal.nextActionDueAt && <p className="muted" style={{ margin: "4px 0 0", fontSize: 13 }}>Due: {new Date(deal.nextActionDueAt).toLocaleDateString()}</p>}
        </div>
      )}

      {/* Tasks */}
      {deal.tasks.length > 0 && (
        <div className="card" style={{ padding: 18, marginTop: 16 }}>
          <h3 style={{ margin: "0 0 12px" }}>Tasks ({deal._count.tasks})</h3>
          <div style={{ display: "grid", gap: 8 }}>
            {deal.tasks.map((t) => (
              <Link key={t.id} href={`/dashboard/tasks/${t.id}`} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                <span className={`status-dot ${t.status === "CLOSED" || t.status === "ACCEPTED" ? "status-dot-green" : t.status === "CANCELLED" ? "status-dot-red" : "status-dot-amber"}`} />
                <span style={{ fontWeight: 600 }}>{t.title}</span>
                <span className="badge" style={{ fontSize: 11 }}>{t.type}</span>
                <span className="badge" style={{ fontSize: 11 }}>{t.status}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Evidence & PoB */}
      <div className="grid-2" style={{ marginTop: 16, gap: 16 }}>
        {deal.evidence.length > 0 && (
          <div className="card" style={{ padding: 18 }}>
            <h3 style={{ margin: "0 0 12px" }}>Evidence ({deal._count.evidence})</h3>
            <div style={{ display: "grid", gap: 8 }}>
              {deal.evidence.map((e) => (
                <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                  <span className={`status-dot ${e.reviewStatus === "APPROVED" ? "status-dot-green" : e.reviewStatus === "REJECTED" ? "status-dot-red" : "status-dot-amber"}`} />
                  <span>{e.title || e.type}</span>
                  <span className="badge" style={{ fontSize: 11 }}>{e.reviewStatus}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {deal.pobRecords.length > 0 && (
          <div className="card" style={{ padding: 18 }}>
            <h3 style={{ margin: "0 0 12px" }}>PoB Records</h3>
            <div style={{ display: "grid", gap: 8 }}>
              {deal.pobRecords.map((p) => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                  <span className={`status-dot ${p.status === "EFFECTIVE" ? "status-dot-green" : p.status === "REJECTED" || p.status === "FROZEN" ? "status-dot-red" : "status-dot-amber"}`} />
                  <span>{p.businessType}</span>
                  <span className="badge badge-accent" style={{ fontSize: 11 }}>Score: {p.score}</span>
                  <span className="badge" style={{ fontSize: 11 }}>{p.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Risk tags */}
      {deal.riskTags.length > 0 && (
        <div style={{ marginTop: 16, display: "flex", gap: 6, flexWrap: "wrap" }}>
          {deal.riskTags.map((t) => <span key={t} className="badge badge-red" style={{ fontSize: 11 }}>{t}</span>)}
        </div>
      )}

      {/* Notes / Communication */}
      <div className="card" style={{ padding: 18, marginTop: 16 }}>
        <h3 style={{ margin: "0 0 12px" }}>Communication Notes ({localNotes.length})</h3>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <input placeholder="Add a note..." value={noteText} onChange={(e) => setNoteText(e.target.value)} style={{ flex: 1 }} onKeyDown={(e) => e.key === "Enter" && addNote()} />
          <button className="button-secondary" onClick={addNote} disabled={!noteText.trim()}>Add</button>
        </div>
        <div className="timeline">
          {localNotes.map((n) => (
            <div key={n.id} className="timeline-item">
              <span className="timeline-dot" />
              <div className="timeline-content">
                <div style={{ fontSize: 14 }}>{n.content}</div>
                <div className="timeline-meta">{new Date(n.createdAt).toLocaleString()}</div>
              </div>
            </div>
          ))}
          {localNotes.length === 0 && <p className="muted">No notes yet.</p>}
        </div>
      </div>
    </div>
  );
}
