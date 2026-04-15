"use client";

import { useEffect, useState, useCallback } from "react";
import { Link } from "@/i18n/routing";
import { Clock } from "lucide-react";
import { useAutoTranslate } from "@/lib/i18n/auto-translate-provider";
import {
  DetailLayout,
  StatusBadge,
  StatCard,
  CapitalNotesComposerRow,
  CapitalNotesFeed,
} from "../../_components";

type DealData = {
  id: string;
  title: string;
  stage: string;
  description: string | null;
  riskTags: string[];
  nextAction: string | null;
  nextActionDueAt: string | null;
  confidentialityLevel: string;
  createdAt?: string;
  updatedAt?: string;
  project: { id: string; name: string; status: string; sector: string | null } | null;
  capital: { id: string; name: string; status: string } | null;
  leadNode: { id: string; name: string };
  participants: { id: string; role: string; node: { id: string; name: string } | null }[];
  milestones: { id: string; title: string; dueAt: string | null; doneAt: string | null; createdAt?: string }[];
  notes: { id: string; content: string; authorId: string; createdAt: string }[];
  tasks: { id: string; title: string; status: string; type: string }[];
  evidence: { id: string; title: string | null; type: string; reviewStatus: string }[];
  pobRecords: { id: string; businessType: string; status: string; score: number }[];
  _count: { participants: number; milestones: number; notes: number; tasks: number; evidence: number };
};

const DEAL_FLOW = [
  "SOURCED", "MATCHED", "INTRO_SENT", "MEETING_DONE",
  "DD", "TERM_SHEET", "SIGNED", "FUNDED",
] as const;

const VALID_TRANSITIONS: Record<string, string[]> = {
  SOURCED: ["MATCHED", "PASSED"],
  MATCHED: ["INTRO_SENT", "PASSED"],
  INTRO_SENT: ["MEETING_DONE", "PASSED"],
  MEETING_DONE: ["DD", "PASSED", "PAUSED"],
  DD: ["TERM_SHEET", "PASSED", "PAUSED"],
  TERM_SHEET: ["SIGNED", "PASSED", "PAUSED"],
  SIGNED: ["FUNDED", "PASSED", "PAUSED"],
  FUNDED: [],
  PASSED: [],
  PAUSED: ["DD", "TERM_SHEET", "SIGNED", "PASSED"],
};

type ActivityEntry = {
  id: string;
  action: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor: { name: string | null; email: string | null } | null;
};

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function DealDetail({ deal, nodes, isAdmin }: {
  deal: DealData;
  nodes: { id: string; name: string }[];
  isAdmin: boolean;
}) {
  const { t } = useAutoTranslate();
  const [stage, setStage] = useState(deal.stage);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmTransition, setConfirmTransition] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [localNotes, setLocalNotes] = useState(deal.notes);
  const [milestones, setMilestones] = useState(deal.milestones);
  const [msTitle, setMsTitle] = useState("");
  const [participants, setParticipants] = useState(deal.participants);
  const [addNodeId, setAddNodeId] = useState("");
  const [adminSaving, setAdminSaving] = useState(false);
  const [adminMsg, setAdminMsg] = useState<string | null>(null);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);

  const nextStages = VALID_TRANSITIONS[stage] ?? [];

  useEffect(() => {
    if (!isAdmin) return;
    fetch(`/api/deals/${deal.id}/activity`)
      .then((r) => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then((d) => { if (d.ok) setActivity(d.data?.activity ?? []); })
      .catch((err) => console.error("[Deal] activity fetch failed", err));
  }, [deal.id, isAdmin]);

  const transitionStage = useCallback(async (s: string) => {
    setBusy(true);
    setError(null);
    setConfirmTransition(null);
    try {
      const res = await fetch(`/api/deals/${deal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: s }),
      });
      const data = await res.json();
      if (data.ok) setStage(s);
      else setError(data.error || t("Transition failed."));
    } catch {
      setError(t("Transition failed."));
    } finally { setBusy(false); }
  }, [deal.id, t]);

  const adminPatch = useCallback(async (patch: Record<string, unknown>) => {
    setAdminSaving(true);
    setAdminMsg(null);
    try {
      const res = await fetch(`/api/deals/${deal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!data.ok) setAdminMsg(data.error ?? t("Save failed."));
      else setAdminMsg(t("Saved"));
      setTimeout(() => setAdminMsg(null), 2000);
    } catch {
      setAdminMsg(t("Save failed."));
    } finally { setAdminSaving(false); }
  }, [deal.id, t]);

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
        <span className="flex items-center gap-12 flex-wrap">
          <span>{t("Lead:")} {deal.leadNode.name}</span>
          {deal.project && (
            <span>{t("Project:")} <Link href={`/dashboard/projects/${deal.project.id}`} style={{ color: "var(--accent)" }}>{deal.project.name}</Link></span>
          )}
          {deal.capital && (
            <span>{t("Capital:")} <Link href={`/dashboard/capital/${deal.capital.id}`} style={{ color: "var(--accent)" }}>{deal.capital.name}</Link></span>
          )}
          {deal.createdAt && (
            <span className="flex items-center gap-4 muted text-xs">
              <Clock size={12} /> {t("Created")} {relativeTime(deal.createdAt)}
            </span>
          )}
          {deal.updatedAt && (
            <span className="muted text-xs">
              · {t("Updated")} {relativeTime(deal.updatedAt)}
            </span>
          )}
        </span>
      }
    >
      {/* Pipeline Visualization */}
      <div className="card-glass p-18 reveal">
        <h3 className="mt-0 mb-12">{t("Pipeline")}</h3>
        <div className="flex items-center gap-4 flex-wrap mb-12">
          {DEAL_FLOW.map((s, i) => {
            const idx = DEAL_FLOW.indexOf(stage as typeof DEAL_FLOW[number]);
            const isCurrent = s === stage;
            const isPast = idx >= 0 && i < idx;
            return (
              <span key={s} className="flex items-center gap-4">
                {i > 0 && <span className="muted">→</span>}
                <span
                  className="badge text-xs"
                  style={{
                    borderRadius: "var(--radius-pill)",
                    background: isCurrent ? "var(--accent)" : isPast ? "var(--green)" : "var(--bg-elev)",
                    color: isCurrent || isPast ? "#fff" : "var(--muted)",
                    fontWeight: isCurrent ? 700 : 400,
                    padding: "4px 12px",
                  }}
                >
                  {s.replace(/_/g, " ")}
                </span>
              </span>
            );
          })}
          {(stage === "PASSED" || stage === "PAUSED") && (
            <span className="flex items-center gap-4">
              <span className="muted">·</span>
              <span className="badge text-xs" style={{
                borderRadius: "var(--radius-pill)",
                background: stage === "PASSED" ? "var(--red)" : "var(--amber)",
                color: "#fff", fontWeight: 700, padding: "4px 12px",
              }}>
                {stage.replace(/_/g, " ")}
              </span>
            </span>
          )}
        </div>
        {isAdmin && nextStages.length > 0 && (
          <div className="flex flex-wrap gap-8 items-center">
            <span className="muted text-sm">{t("Next:")}</span>
            {nextStages.map((s) => (
              confirmTransition === s ? (
                <span key={s} className="flex items-center gap-4">
                  <button className="button text-xs" disabled={busy} onClick={() => transitionStage(s)}>
                    {t("Confirm")} → {s.replace(/_/g, " ")}
                  </button>
                  <button className="button-secondary text-xs" onClick={() => setConfirmTransition(null)}>
                    {t("Cancel")}
                  </button>
                </span>
              ) : (
                <button key={s} className="button-secondary text-xs" disabled={busy} onClick={() => setConfirmTransition(s)}>
                  → {s.replace(/_/g, " ")}
                </button>
              )
            ))}
          </div>
        )}
        {error && <p className="form-error mt-8">{error}</p>}
      </div>

      {/* Stats + Details grid */}
      <div className="grid-2 gap-16 reveal reveal-delay-1">
        <div className="flex-col gap-12">
          <div className="grid-2 gap-12">
            <StatCard label={t("Participants")} value={deal._count.participants} />
            <StatCard label={t("Milestones")} value={deal._count.milestones} />
            <StatCard label={t("Tasks")} value={deal._count.tasks} />
            <StatCard label={t("Evidence")} value={deal._count.evidence} />
          </div>
          <StatCard label={t("Notes")} value={deal._count.notes} />
        </div>

        <div className="flex-col gap-12">
          {deal.description && (
            <div className="card-glass p-18">
              <h3 className="mt-0 mb-8">{t("Description")}</h3>
              <p className="mt-0 mb-0" style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{deal.description}</p>
            </div>
          )}
          {deal.nextAction && (
            <div className="card-glass p-18" style={{ borderLeft: "3px solid var(--accent)" }}>
              <h3 className="mt-0 mb-4">{t("Next Action")}</h3>
              <p className="mt-0 mb-0">{deal.nextAction}</p>
              {deal.nextActionDueAt && (
                <p className="muted mt-4 mb-0 text-sm">{t("Due:")} {new Date(deal.nextActionDueAt).toLocaleDateString()}</p>
              )}
            </div>
          )}
          {deal.riskTags.length > 0 && (
            <div className="flex flex-wrap gap-6">
              {deal.riskTags.map((tag) => <span key={tag} className="badge badge-red text-xs">{tag}</span>)}
            </div>
          )}
        </div>
      </div>

      {/* Participants & Milestones */}
      <div className="grid-2 gap-16 reveal reveal-delay-2">
        <div className="card-glass p-18">
          <h3 className="mt-0 mb-12">{t("Participants")} ({participants.length})</h3>
          <div className="flex-col gap-8">
            {participants.map((p) => (
              <div key={p.id} className="flex items-center gap-8 text-base">
                <span className="status-dot status-dot-accent" />
                <span className="font-semibold">{p.node?.name ?? "—"}</span>
                <span className="badge text-xs">{p.role}</span>
              </div>
            ))}
            {participants.length === 0 && <p className="muted text-sm">{t("No participants yet.")}</p>}
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

        <div className="card-glass p-18">
          <h3 className="mt-0 mb-12">{t("Milestones")} ({milestones.length})</h3>
          <div className="flex-col gap-8">
            {milestones.map((m) => (
              <div key={m.id} className="flex items-center gap-8 text-base">
                <span className={`status-dot ${m.doneAt ? "status-dot-green" : "status-dot-amber"}`} />
                <span className="font-semibold" style={{ textDecoration: m.doneAt ? "line-through" : undefined }}>{m.title}</span>
                {m.dueAt && !m.doneAt && <span className="muted text-xs">{t("Due")} {new Date(m.dueAt).toLocaleDateString()}</span>}
                {m.doneAt && <span className="muted text-xs">{relativeTime(m.doneAt)}</span>}
                {!m.doneAt && isAdmin && (
                  <button className="button-secondary text-xs" style={{ padding: "2px 8px" }} onClick={() => completeMilestone(m.id)}>{t("Done")}</button>
                )}
              </div>
            ))}
            {milestones.length === 0 && <p className="muted text-sm">{t("No milestones yet.")}</p>}
          </div>
          {isAdmin && (
            <div className="flex gap-8 mt-8">
              <input placeholder={t("New milestone")} value={msTitle} onChange={(e) => setMsTitle(e.target.value)} style={{ flex: 1 }} />
              <button className="button-secondary text-xs" onClick={addMilestone} disabled={!msTitle.trim()}>{t("Add")}</button>
            </div>
          )}
        </div>
      </div>

      {/* Tasks */}
      {deal.tasks.length > 0 && (
        <div className="card-glass p-18 reveal reveal-delay-2">
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

      {/* Evidence & PoB */}
      <div className="grid-2 gap-16 reveal reveal-delay-3">
        {deal.evidence.length > 0 && (
          <div className="card-glass p-18">
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
          <div className="card-glass p-18">
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

      {/* Communication Notes — Capital-aligned: card p-18, Activity-style feed */}
      <div className="card p-18 reveal reveal-delay-3">
        <h3 className="mt-0 mb-12">{t("Communication Notes")} ({localNotes.length})</h3>
        <CapitalNotesComposerRow
          value={noteText}
          onChange={setNoteText}
          onSubmit={addNote}
          placeholder={t("Add a note...")}
          submitLabel={t("Add")}
        />
        <CapitalNotesFeed
          items={localNotes.map((n) => ({
            id: n.id,
            body: n.content,
            meta: relativeTime(n.createdAt),
          }))}
          empty={<p className="muted mb-0">{t("No notes yet.")}</p>}
        />
      </div>

      {/* Admin Panel */}
      {isAdmin && (
        <div className="card p-18 reveal" style={{ borderLeft: "3px solid var(--amber)" }}>
          <div className="flex items-center justify-between mb-12">
            <h3 className="mt-0 mb-0">{t("Admin Panel")}</h3>
            {adminSaving && <span className="muted text-xs">{t("Saving...")}</span>}
            {adminMsg && !adminSaving && <span className="text-xs" style={{ color: adminMsg === t("Saved") ? "var(--green)" : "var(--red)" }}>{adminMsg}</span>}
          </div>
          <div className="grid-2 gap-12">
            <label className="field">
              <span className="label">{t("Confidentiality")}</span>
              <select
                defaultValue={deal.confidentialityLevel}
                onChange={(e) => adminPatch({ confidentialityLevel: e.target.value })}
              >
                {["PUBLIC", "CERTIFIED_NODE", "DEAL_ROOM", "RESTRICTED"].map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </label>
            <label className="field">
              <span className="label">{t("Next action due")}</span>
              <input
                type="date"
                defaultValue={deal.nextActionDueAt ? new Date(deal.nextActionDueAt).toISOString().split("T")[0] : ""}
                onBlur={(e) => adminPatch({ nextActionDueAt: e.target.value ? new Date(e.target.value).toISOString() : null })}
              />
            </label>
          </div>
          <label className="field">
            <span className="label">{t("Risk tags")} <span className="muted text-xs">({t("comma-separated")})</span></span>
            <input
              defaultValue={deal.riskTags.join(", ")}
              onBlur={(e) => adminPatch({ riskTags: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) })}
            />
          </label>
          <label className="field">
            <span className="label">{t("Next action")}</span>
            <input
              defaultValue={deal.nextAction ?? ""}
              onBlur={(e) => adminPatch({ nextAction: e.target.value || null })}
            />
          </label>
          <label className="field">
            <span className="label">{t("Description")}</span>
            <textarea
              defaultValue={deal.description ?? ""}
              rows={4}
              onBlur={(e) => adminPatch({ description: e.target.value || null })}
            />
          </label>
        </div>
      )}

      {/* Activity */}
      {isAdmin && activity.length > 0 && (
        <div className="card-glass p-18 reveal">
          <h3 className="mt-0 mb-12">{t("Activity")}</h3>
          <div className="flex-col gap-8">
            {activity.map((a) => (
              <div key={a.id} className="flex items-start gap-8 text-sm" style={{ borderLeft: "2px solid var(--line)", paddingLeft: 12 }}>
                <div>
                  <span className="font-semibold">{a.action.replace(/_/g, " ")}</span>
                  {a.metadata && (a.metadata as Record<string, string>).previousStage ? (
                    <span className="muted"> {(a.metadata as Record<string, string>).previousStage} → {(a.metadata as Record<string, string>).newStage}</span>
                  ) : null}
                  <div className="muted text-xs">
                    {a.actor?.name || a.actor?.email || t("System")} · {relativeTime(a.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </DetailLayout>
  );
}
