"use client";

import { useMemo, useState } from "react";
import { StatusBadge, FilterToolbar, EmptyState, FormCard, StatCard, DashboardDistributionPie, DashboardPipelineBar } from "../_components";
import { useAutoTranslate } from "@/lib/i18n/auto-translate-provider";

type Vote = { id: string; voterId: string; option: string; weight: number };
type OptionItem = string | { id: string; label: string };
type Proposal = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  options: OptionItem[];
  quorum: number;
  deadline: string | null;
  votes: Vote[];
  createdAt: string;
};

function optionLabel(opt: OptionItem): string {
  return typeof opt === "string" ? opt : opt.label;
}
function optionKey(opt: OptionItem): string {
  return typeof opt === "string" ? opt : opt.id;
}

const STATUS_LIST = ["ALL", "DRAFT", "ACTIVE", "PASSED", "REJECTED", "EXECUTED", "CANCELLED"] as const;

export function GovernanceDashboard({ proposals: initial, userId }: { proposals: Proposal[]; userId: string }) {
  const { t } = useAutoTranslate();
  const [proposals, setProposals] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("ALL");
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

  async function transitionProposal(proposalId: string, action: string) {
    const res = await fetch("/api/governance/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, proposalId }),
    });
    const d = await res.json();
    if (d.ok && d.data?.status) {
      setProposals(proposals.map((p) => p.id === proposalId ? { ...p, status: d.data.status } : p));
    }
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

  const shown = filter === "ALL" ? proposals : proposals.filter((p) => p.status === filter);

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const p of proposals) c[p.status] = (c[p.status] ?? 0) + 1;
    return c;
  }, [proposals]);

  const proposalKpis = useMemo(() => {
    const total = proposals.length;
    const active = proposals.filter((p) => p.status === "ACTIVE").length;
    const votes = proposals.reduce((s, p) => s + p.votes.length, 0);
    const passed = proposals.filter((p) => p.status === "PASSED" || p.status === "EXECUTED").length;
    return { total, active, votes, passed };
  }, [proposals]);

  const proposalStatusColors: Record<string, string> = {
    DRAFT: "#94a3b8",
    ACTIVE: "#6366f1",
    PASSED: "#22c55e",
    REJECTED: "#ef4444",
    EXECUTED: "#0ea5e9",
    CANCELLED: "#64748b",
  };
  const proposalOrder = ["DRAFT", "ACTIVE", "PASSED", "REJECTED", "EXECUTED", "CANCELLED"] as const;
  const proposalPalette = ["#94a3b8", "#6366f1", "#22c55e", "#ef4444", "#0ea5e9", "#64748b"] as const;

  return (
    <div className="flex flex-col gap-16">
      <div className="grid-4 gap-12">
        <StatCard label={t("Proposals")} value={proposalKpis.total} />
        <StatCard label={t("Active vote")} value={proposalKpis.active} />
        <StatCard label={t("Total votes")} value={proposalKpis.votes} />
        <StatCard label={t("Passed / executed")} value={proposalKpis.passed} />
      </div>
      {Object.keys(statusCounts).length > 0 && (
        <div className="grid-2 gap-16">
          <div className="card p-18">
            <h3 className="mt-0 mb-12">{t("Status distribution")}</h3>
            <DashboardDistributionPie data={statusCounts} colorMap={proposalStatusColors} />
          </div>
          <div className="card p-18">
            <h3 className="mt-0 mb-12">{t("Pipeline flow")}</h3>
            <DashboardPipelineBar orderedKeys={proposalOrder} data={statusCounts} palette={proposalPalette} />
          </div>
        </div>
      )}
      <FormCard open={showForm} onToggle={() => setShowForm(!showForm)} triggerLabel={t("New Proposal")}>
        <form onSubmit={create} className="form">
          <label className="field">
            <span className="label">{t("Title")}</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
          <label className="field">
            <span className="label">{t("Description")}</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </label>
          <div className="grid-3 gap-12">
            <label className="field">
              <span className="label">{t("Type")}</span>
              <select value={type} onChange={(e) => setType(e.target.value)}>
                {["GENERAL", "PARAMETER_CHANGE", "BUDGET", "POLICY"].map((tp) => <option key={tp} value={tp}>{tp}</option>)}
              </select>
            </label>
            <label className="field">
              <span className="label">{t("Options (comma-separated)")}</span>
              <input value={options} onChange={(e) => setOptions(e.target.value)} required />
            </label>
            <label className="field">
              <span className="label">{t("Quorum")}</span>
              <input type="number" value={quorum} onChange={(e) => setQuorum(e.target.value)} min={1} />
            </label>
          </div>
          <div className="flex gap-8">
            <button type="submit" className="button" disabled={busy}>{busy ? t("Creating...") : t("Create Proposal")}</button>
            <button type="button" className="button-secondary" onClick={() => setShowForm(false)}>{t("Cancel")}</button>
          </div>
        </form>
      </FormCard>

      <FilterToolbar
        filters={STATUS_LIST}
        active={filter}
        onChange={setFilter}
        totalLabel={t("All")}
        totalCount={proposals.length}
        counts={statusCounts as Partial<Record<(typeof STATUS_LIST)[number], number>>}
      />

      {shown.length === 0 ? (
        <EmptyState message={t("No proposals found.")} />
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {shown.map((p) => {
            const userVote = p.votes.find((v) => v.voterId === userId);
            const voteCounts: Record<string, number> = {};
            for (const opt of p.options) voteCounts[optionKey(opt)] = 0;
            for (const v of p.votes) voteCounts[v.option] = (voteCounts[v.option] ?? 0) + 1;

            return (
              <div key={p.id} className="card p-18">
                <div className="flex-between items-start">
                  <div>
                    <h3 style={{ margin: 0 }}>{p.title}</h3>
                    {p.description && <p className="muted text-sm" style={{ margin: "4px 0 0" }}>{p.description}</p>}
                  </div>
                  <StatusBadge status={p.status} />
                </div>

                <div className="flex flex-wrap gap-12 mt-12">
                  {p.options.map((opt) => {
                    const key = optionKey(opt);
                    const label = optionLabel(opt);
                    return (
                      <button
                        key={key}
                        className={`chip ${userVote?.option === key ? "chip-active" : ""}`}
                        onClick={() => p.status === "ACTIVE" && vote(p.id, key)}
                        disabled={p.status !== "ACTIVE"}
                      >
                        {label} ({voteCounts[key] ?? 0})
                      </button>
                    );
                  })}
                </div>

                <div className="flex-between items-center mt-8">
                  <div className="muted text-xs">
                    {p.votes.length} {p.votes.length !== 1 ? t("votes") : t("vote")} · {t("Quorum:")} {p.quorum}
                    {p.deadline && ` · ${t("Deadline:")} ${new Date(p.deadline).toLocaleDateString()}`}
                  </div>
                  <div className="flex gap-6">
                    {p.status === "DRAFT" && (
                      <button className="button" style={{ fontSize: 10, padding: "3px 10px" }} onClick={() => transitionProposal(p.id, "ACTIVE")}>{t("Activate")}</button>
                    )}
                    {p.status === "ACTIVE" && p.votes.length >= p.quorum && (
                      <button className="button" style={{ fontSize: 10, padding: "3px 10px" }} onClick={() => transitionProposal(p.id, "finalize")}>{t("Finalize")}</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
