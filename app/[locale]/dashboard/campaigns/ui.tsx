"use client";

import { useMemo, useState } from "react";
import { Link } from "@/i18n/routing";
import { StatusBadge, FilterToolbar, EmptyState, FormCard, StatCard, DashboardDistributionPie, DashboardPipelineBar } from "../_components";
import { useAutoTranslate } from "@/lib/i18n/auto-translate-provider";

type Campaign = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  targetType: string | null;
  budget: number | null;
  startAt: string | null;
  endAt: string | null;
  channels: { id: string; nodeId: string; channel: string; status: string }[];
  metrics: { id: string; metricType: string; value: number; recordedAt: string }[];
};

const STATUSES = ["ALL", "DRAFT", "ACTIVE", "PAUSED", "COMPLETED", "CANCELLED"] as const;

export function CampaignDashboard({ campaigns: initial }: { campaigns: Campaign[] }) {
  const { t } = useAutoTranslate();
  const [campaigns, setCampaigns] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [busy, setBusy] = useState(false);

  const filtered = filter === "ALL" ? campaigns : campaigns.filter((c) => c.status === filter);

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const x of campaigns) c[x.status] = (c[x.status] ?? 0) + 1;
    return c;
  }, [campaigns]);

  const campaignKpis = useMemo(() => {
    const total = campaigns.length;
    const active = campaigns.filter((c) => c.status === "ACTIVE").length;
    const channels = campaigns.reduce((s, c) => s + c.channels.length, 0);
    const metrics = campaigns.reduce((s, c) => s + c.metrics.length, 0);
    return { total, active, channels, metrics };
  }, [campaigns]);

  const campaignStatusColors: Record<string, string> = {
    DRAFT: "#94a3b8",
    ACTIVE: "#22c55e",
    PAUSED: "#f59e0b",
    COMPLETED: "#6366f1",
    CANCELLED: "#64748b",
  };
  const campaignOrder = ["DRAFT", "ACTIVE", "PAUSED", "COMPLETED", "CANCELLED"] as const;
  const campaignPalette = ["#94a3b8", "#22c55e", "#f59e0b", "#6366f1", "#64748b"] as const;

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || undefined,
          budget: budget ? parseFloat(budget) : undefined,
        }),
      });
      const d = await res.json();
      if (d.ok) {
        setCampaigns([{ ...d.data, channels: [], metrics: [] }, ...campaigns]);
        setShowForm(false);
        setTitle(""); setDescription(""); setBudget("");
      }
    } finally { setBusy(false); }
  }

  return (
    <div className="flex flex-col gap-16">
      <div className="grid-4 gap-12">
        <StatCard label={t("Campaigns")} value={campaignKpis.total} />
        <StatCard label={t("Active")} value={campaignKpis.active} />
        <StatCard label={t("Channels")} value={campaignKpis.channels} />
        <StatCard label={t("Metric points")} value={campaignKpis.metrics} />
      </div>
      {Object.keys(statusCounts).length > 0 && (
        <div className="grid-2 gap-16">
          <div className="card p-18">
            <h3 className="mt-0 mb-12">{t("Status distribution")}</h3>
            <DashboardDistributionPie data={statusCounts} colorMap={campaignStatusColors} />
          </div>
          <div className="card p-18">
            <h3 className="mt-0 mb-12">{t("Pipeline flow")}</h3>
            <DashboardPipelineBar orderedKeys={campaignOrder} data={statusCounts} palette={campaignPalette} />
          </div>
        </div>
      )}
      <FormCard open={showForm} onToggle={() => setShowForm(!showForm)} triggerLabel={t("New Campaign")}>
        <form onSubmit={create} className="form">
          <label className="field">
            <span className="label">{t("Campaign Title")}</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
          <label className="field">
            <span className="label">{t("Description")}</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </label>
          <label className="field">
            <span className="label">{t("Budget (USDC)")}</span>
            <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} step="0.01" />
          </label>
          <div className="flex gap-8">
            <button type="submit" className="button" disabled={busy}>{busy ? t("Creating...") : t("Create")}</button>
            <button type="button" className="button-secondary" onClick={() => setShowForm(false)}>{t("Cancel")}</button>
          </div>
        </form>
      </FormCard>

      <FilterToolbar
        filters={STATUSES}
        active={filter}
        onChange={setFilter}
        totalLabel={t("All")}
        totalCount={campaigns.length}
        counts={statusCounts as Partial<Record<(typeof STATUSES)[number], number>>}
      />

      {filtered.length === 0 ? (
        <EmptyState message={t("No campaigns found.")} />
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>{t("Title")}</th>
              <th>{t("Status")}</th>
              <th>{t("Budget")}</th>
              <th>{t("Channels")}</th>
              <th>{t("Metrics")}</th>
              <th>{t("Created")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id}>
                <td>
                  <Link href={`/dashboard/campaigns/${c.id}`} className="font-semibold" style={{ color: "var(--accent)" }}>
                    {c.title}
                  </Link>
                </td>
                <td><StatusBadge status={c.status} /></td>
                <td>{c.budget ? `$${c.budget.toLocaleString()}` : "—"}</td>
                <td>{c.channels.length}</td>
                <td>{c.metrics.length}</td>
                <td className="muted text-xs">{new Date(c.startAt || c.id).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
