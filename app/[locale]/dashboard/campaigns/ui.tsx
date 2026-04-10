"use client";

import { useState } from "react";
import { StatusBadge, FilterToolbar, EmptyState, FormCard } from "../_components";

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
  const [campaigns, setCampaigns] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [busy, setBusy] = useState(false);

  const filtered = filter === "ALL" ? campaigns : campaigns.filter((c) => c.status === filter);

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
    <div className="mt-20">
      <FormCard open={showForm} onToggle={() => setShowForm(!showForm)} triggerLabel="New Campaign">
        <form onSubmit={create} className="form">
          <label className="field">
            <span className="label">Campaign Title</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
          <label className="field">
            <span className="label">Description</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </label>
          <label className="field">
            <span className="label">Budget (USDC)</span>
            <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} step="0.01" />
          </label>
          <div className="flex gap-8">
            <button type="submit" className="button" disabled={busy}>{busy ? "Creating..." : "Create"}</button>
            <button type="button" className="button-secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      </FormCard>

      <FilterToolbar filters={STATUSES} active={filter} onChange={setFilter} totalCount={campaigns.length} />

      {filtered.length === 0 ? (
        <EmptyState message="No campaigns found." />
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Budget</th>
              <th>Channels</th>
              <th>Metrics</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id}>
                <td><a href={`/dashboard/campaigns/${c.id}`} className="font-semibold" style={{ color: "var(--accent)" }}>{c.title}</a></td>
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
