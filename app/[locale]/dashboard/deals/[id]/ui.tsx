"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";
import { useAutoTranslate } from "@/lib/i18n/auto-translate-provider";
import { DetailLayout, StatusBadge } from "../../_components";

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

export function DealDetail({ deal, nodes, isAdmin }: {
  deal: DealData;
  nodes: { id: string; name: string }[];
  isAdmin: boolean;
}) {
  const { t } = useAutoTranslate();
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
      else setError(data.error || t("Transition failed."));
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
    <DetailLayout
      backHref="/dashboard/deals"
      backLabel={t("All Deals")}
      title={deal.title}
      badge={
        <span className="flex items-center gap-6">
          <StatusBadge status={stage} />
          {deal.confidentialityLevel !== "PUBLIC" && (
            <span className="badge badge-purple">{deal.confidentialityLevel}</span>
          )}
        </span>
      }
      meta={
        <>
          <span>{t("Lead:")} {deal.leadNode.name}</span>
          {deal.project && (
            <span>{t("Project:")} <Link href={`/dashboard/projects/${deal.project.id}`} style={{ color: "var(--accent)" }}>{deal.project.name}</Link></span>
          )}
          {deal.capital && (
            <span>{t("Capital:")} <Link href={`/dashboard/capital/${deal.capital.id}`} style={{ color: "var(--accent)" }}>{deal.capital.name}</Link></span>
          )}
        </>
      }
    >
      {isAdmin && (
        <div className="card p-18">
          <h3 className="mt-0 mb-12">{t("Stage Transition")}</h3>
          <div className="flex flex-wrap gap-6">
            {STAGES.map((s) => (
              <button key={s} className="button-secondary text-xs" disabled={busy || s === stage} onClick={() => transitionStage(s)}>
                {s.replace(/_/g, " ")}
              </button>
            ))}
          </div>
          {error && <p className="form-error mt-8">{error}</p>}
        </div>
      )}

      <div className="grid-2 gap-16">
        <div className="card p-18">
          <h3 className="mt-0 mb-12">{t("Participants")} ({participants.length})</h3>
          <div className="flex-col gap-8">
            {participants.map((p) => (
              <div key={p.id} className="flex items-center gap-8 text-base">
                <span className="status-dot status-dot-accent" />
                <span className="font-semibold">{p.node?.name ?? "—"}</span>
                <span className="badge text-xs">{p.role}</span>
              </div>
            ))}
          </div>
          {isAdmin && (
            <div className="flex gap-8 mt-8">
              <select value={addNodeId} onChange={(e) => setAddNodeId(e.target.value)} style={{ flex: 1 }}>
                <option value="">{t("Add node...")}</option>
                {nodes.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
              </select>
              <button className="button-secondary text-xs" onClick={addParticipant} disabled={!addNodeId}>{t("Add")}</button>
            </div>
          )}
        </div>

        <div className="card p-18">
          <h3 className="mt-0 mb-12">{t("Milestones")} ({milestones.length})</h3>
          <div className="flex-col gap-8">
            {milestones.map((m) => (
              <div key={m.id} className="flex items-center gap-8 text-base">
                <span className={`status-dot ${m.doneAt ? "status-dot-green" : "status-dot-amber"}`} />
                <span className="font-semibold" style={{ textDecoration: m.doneAt ? "line-through" : undefined }}>{m.title}</span>
                {m.dueAt && !m.doneAt && <span className="muted text-xs">{t("Due")} {new Date(m.dueAt).toLocaleDateString()}</span>}
                {!m.doneAt && isAdmin && (
                  <button className="button-secondary text-xs" style={{ padding: "2px 8px" }} onClick={() => completeMilestone(m.id)}>{t("Done")}</button>
                )}
              </div>
            ))}
          </div>
          {isAdmin && (
            <div className="flex gap-8 mt-8">
              <input placeholder={t("New milestone")} value={msTitle} onChange={(e) => setMsTitle(e.target.value)} style={{ flex: 1 }} />
              <button className="button-secondary text-xs" onClick={addMilestone} disabled={!msTitle.trim()}>{t("Add")}</button>
            </div>
          )}
        </div>
      </div>

      {deal.description && (
        <div className="card p-18">
          <h3 className="mt-0 mb-8">{t("Description")}</h3>
          <p className="mt-0 mb-0" style={{ whiteSpace: "pre-wrap" }}>{deal.description}</p>
        </div>
      )}

      {deal.nextAction && (
        <div className="card p-18" style={{ borderLeft: "3px solid var(--accent)" }}>
          <h3 className="mt-0 mb-4">{t("Next Action")}</h3>
          <p className="mt-0 mb-0">{deal.nextAction}</p>
          {deal.nextActionDueAt && <p className="muted mt-4 mb-0 text-sm">{t("Due:")} {new Date(deal.nextActionDueAt).toLocaleDateString()}</p>}
        </div>
      )}

      {deal.tasks.length > 0 && (
        <div className="card p-18">
          <h3 className="mt-0 mb-12">{t("Tasks")} ({deal._count.tasks})</h3>
          <div className="flex-col gap-8">
            {deal.tasks.map((task) => (
              <Link key={task.id} href={`/dashboard/tasks/${task.id}`} className="flex items-center gap-8 text-base">
                <span className={`status-dot ${task.status === "CLOSED" || task.status === "ACCEPTED" ? "status-dot-green" : task.status === "CANCELLED" ? "status-dot-red" : "status-dot-amber"}`} />
                <span className="font-semibold">{task.title}</span>
                <span className="badge text-xs">{task.type}</span>
                <StatusBadge status={task.status} className="text-xs" />
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid-2 gap-16">
        {deal.evidence.length > 0 && (
          <div className="card p-18">
            <h3 className="mt-0 mb-12">{t("Evidence")} ({deal._count.evidence})</h3>
            <div className="flex-col gap-8">
              {deal.evidence.map((e) => (
                <div key={e.id} className="flex items-center gap-8 text-base">
                  <span className={`status-dot ${e.reviewStatus === "APPROVED" ? "status-dot-green" : e.reviewStatus === "REJECTED" ? "status-dot-red" : "status-dot-amber"}`} />
                  <span>{e.title || e.type}</span>
                  <StatusBadge status={e.reviewStatus} className="text-xs" />
                </div>
              ))}
            </div>
          </div>
        )}
        {deal.pobRecords.length > 0 && (
          <div className="card p-18">
            <h3 className="mt-0 mb-12">{t("PoB Records")}</h3>
            <div className="flex-col gap-8">
              {deal.pobRecords.map((p) => (
                <div key={p.id} className="flex items-center gap-8 text-base">
                  <span className={`status-dot ${p.status === "EFFECTIVE" ? "status-dot-green" : p.status === "REJECTED" || p.status === "FROZEN" ? "status-dot-red" : "status-dot-amber"}`} />
                  <span>{p.businessType}</span>
                  <span className="badge badge-accent text-xs">{t("Score:")} {p.score}</span>
                  <StatusBadge status={p.status} className="text-xs" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {deal.riskTags.length > 0 && (
        <div className="flex flex-wrap gap-6">
          {deal.riskTags.map((tag) => <span key={tag} className="badge badge-red text-xs">{tag}</span>)}
        </div>
      )}

      <div className="card p-18">
        <h3 className="mt-0 mb-12">{t("Communication Notes")} ({localNotes.length})</h3>
        <div className="flex gap-8 mb-16">
          <input placeholder={t("Add a note...")} value={noteText} onChange={(e) => setNoteText(e.target.value)} style={{ flex: 1 }} onKeyDown={(e) => e.key === "Enter" && addNote()} />
          <button className="button-secondary" onClick={addNote} disabled={!noteText.trim()}>{t("Add")}</button>
        </div>
        <div className="timeline">
          {localNotes.map((n) => (
            <div key={n.id} className="timeline-item">
              <span className="timeline-dot" />
              <div className="timeline-content">
                <div className="text-base">{n.content}</div>
                <div className="timeline-meta">{new Date(n.createdAt).toLocaleString()}</div>
              </div>
            </div>
          ))}
          {localNotes.length === 0 && <p className="muted">{t("No notes yet.")}</p>}
        </div>
      </div>
    </DetailLayout>
  );
}
