"use client";

import { useState } from "react";
import Link from "next/link";
import { StatusBadge, FilterToolbar, EmptyState, FormCard } from "../_components";
import { useAutoTranslate } from "@/lib/i18n/auto-translate-provider";

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

const STAGES = ["ALL", "SOURCED", "MATCHED", "DD", "TERM_SHEET", "SIGNED", "FUNDED", "PASSED", "PAUSED"] as const;

export function DealsConsole({ initialDeals, nodes, projects, isAdmin }: {
  initialDeals: DealRow[];
  nodes: { id: string; name: string }[];
  projects: { id: string; name: string }[];
  isAdmin: boolean;
}) {
  const { t } = useAutoTranslate();
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
        setDeals([{ ...data.data, _count: { participants: 0, milestones: 0, tasks: 0 }, capital: null, updatedAt: new Date().toISOString() }, ...deals]);
        setShowForm(false);
        setTitle("");
      }
    } finally { setBusy(false); }
  }

  return (
    <div className="mt-20">
      <FilterToolbar filters={STAGES} active={filter} onChange={setFilter} totalCount={deals.length} />

      {isAdmin && (
        <FormCard open={showForm} onToggle={() => setShowForm(!showForm)} triggerLabel={t("New deal")}>
          <form onSubmit={createDeal} className="form">
            <label className="field">
              <span className="label">{t("Deal title")}</span>
              <input placeholder={t("Deal title *")} value={title} onChange={(e) => setTitle(e.target.value)} required />
            </label>
            <div className="grid-2 gap-12">
              <label className="field">
                <span className="label">{t("Lead node")}</span>
                <select value={leadNodeId} onChange={(e) => setLeadNodeId(e.target.value)} required>
                  <option value="">{t("Lead node *")}</option>
                  {nodes.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
              </label>
              <label className="field">
                <span className="label">{t("Project")}</span>
                <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                  <option value="">{t("No project")}</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </label>
            </div>
            <div className="flex gap-8">
              <button type="submit" className="button" disabled={busy}>{busy ? t("Creating...") : t("Create")}</button>
              <button type="button" className="button-secondary" onClick={() => setShowForm(false)}>{t("Cancel")}</button>
            </div>
          </form>
        </FormCard>
      )}

      {filtered.length === 0 ? (
        <EmptyState message={t("No deals found.")} />
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 32 }}></th>
              <th>{t("Deal")}</th>
              <th>{t("Lead Node")}</th>
              <th>{t("Stage")}</th>
              <th>{t("Stats")}</th>
              <th>{t("Updated")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id}>
                <td>
                  <span className={`status-dot ${d.stage === "SIGNED" || d.stage === "FUNDED" ? "status-dot-green" : d.stage === "PASSED" ? "status-dot-red" : "status-dot-amber"}`} />
                </td>
                <td>
                  <Link href={`/dashboard/deals/${d.id}`} className="font-bold text-sm" style={{ color: "var(--accent)" }}>
                    {d.title}
                  </Link>
                  {d.nextAction && <div className="muted text-xs">{t("Next:")} {d.nextAction}</div>}
                </td>
                <td>
                  <div className="text-sm">{d.leadNode.name}</div>
                  {d.project && <div className="muted text-xs">{d.project.name}</div>}
                </td>
                <td><StatusBadge status={d.stage} /></td>
                <td className="muted text-xs">{d._count.tasks}T · {d._count.milestones}M · {d._count.participants}P</td>
                <td className="muted text-xs">{new Date(d.updatedAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
