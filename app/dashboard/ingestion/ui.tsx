"use client";

import { useState, useEffect, useCallback } from "react";
import { LoadingState, EmptyState, FormCard } from "../_components";

interface IngestionSource {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  schedule: string | null;
  lastRunAt: string | null;
  runs: Array<{
    id: string;
    status: string;
    itemsFound: number;
    itemsNew: number;
    itemsUpdated: number;
    itemsSkipped: number;
    startedAt: string;
    completedAt: string | null;
    errorMsg: string | null;
  }>;
}

interface Adapter {
  name: string;
  type: string;
}

export function IngestionUI() {
  const [sources, setSources] = useState<IngestionSource[]>([]);
  const [adapters, setAdapters] = useState<Adapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [running, setRunning] = useState<string | null>(null);

  const [form, setForm] = useState({ name: "", type: "defillama", config: "{}" });

  const fetchSources = useCallback(async () => {
    const res = await fetch("/api/ingestion");
    const json = await res.json();
    if (json.ok) {
      setSources(json.data.sources);
      setAdapters(json.data.adapters);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSources(); }, [fetchSources]);

  async function handleCreate() {
    let parsedConfig: Record<string, unknown> = {};
    try { parsedConfig = JSON.parse(form.config); } catch { return alert("Invalid JSON config"); }

    const res = await fetch("/api/ingestion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, type: form.type, config: parsedConfig }),
    });
    const json = await res.json();
    if (json.ok) {
      setShowCreate(false);
      fetchSources();
    }
  }

  async function handleRun(sourceId: string) {
    setRunning(sourceId);
    try {
      await fetch("/api/ingestion/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId }),
      });
      fetchSources();
    } finally {
      setRunning(null);
    }
  }

  const statusColor: Record<string, string> = {
    COMPLETED: "var(--success, #4caf50)",
    RUNNING: "var(--accent, #00d4ff)",
    FAILED: "var(--error, #ff4444)",
    PENDING: "var(--muted)",
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div className="mb-24">
        <h2 style={{ margin: 0 }}>Data Ingestion</h2>
        <p style={{ color: "var(--muted)", margin: "4px 0 0" }}>
          Configure external data sources that agents use to import projects and investors.
        </p>
      </div>

      <FormCard open={showCreate} onToggle={() => setShowCreate(!showCreate)} triggerLabel="+ New Source">
        <h3 style={{ margin: "0 0 16px" }}>Add Ingestion Source</h3>
        <div className="mb-12">
          <label className="field">
            <span className="label">Name</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. DeFi Protocols Crawler"
            />
          </label>
        </div>
        <div className="mb-12">
          <label className="field">
            <span className="label">Adapter</span>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              {adapters.map((a) => (
                <option key={a.type} value={a.type}>{a.name} ({a.type})</option>
              ))}
            </select>
          </label>
        </div>
        <div className="mb-16">
          <label className="field">
            <span className="label">Config (JSON)</span>
            <textarea
              value={form.config}
              onChange={(e) => setForm({ ...form, config: e.target.value })}
              rows={5}
              placeholder='{"minTvl": 1000000, "category": "Dexes"}'
              className="font-mono text-sm"
            />
          </label>
        </div>
        <div className="flex gap-8">
          <button className="btn btn-primary" onClick={handleCreate} disabled={!form.name}>Create</button>
          <button className="btn" onClick={() => setShowCreate(false)}>Cancel</button>
        </div>
      </FormCard>

      {loading ? (
        <LoadingState />
      ) : sources.length === 0 ? (
        <EmptyState message="No ingestion sources configured yet." />
      ) : (
        <div className="flex-col gap-16">
          {sources.map((s) => (
            <div key={s.id} className="card p-20">
              <div className="flex-between items-center">
                <div>
                  <h3 style={{ margin: 0 }}>{s.name}</h3>
                  <div className="muted text-sm" style={{ marginTop: 4 }}>
                    Type: {s.type} · {s.enabled ? "Active" : "Disabled"}
                    {s.lastRunAt && ` · Last run: ${new Date(s.lastRunAt).toLocaleString()}`}
                  </div>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => handleRun(s.id)}
                  disabled={running === s.id}
                >
                  {running === s.id ? "Running..." : "Run Now"}
                </button>
              </div>

              {s.runs.length > 0 && (
                <div className="mt-12">
                  <div className="text-sm font-semibold mb-6">Recent Runs:</div>
                  {s.runs.map((r) => (
                    <div key={r.id} className="flex gap-16 text-sm border-t" style={{ padding: "4px 0" }}>
                      <span style={{ color: statusColor[r.status] ?? "var(--muted)" }}>{r.status}</span>
                      <span>Found: {r.itemsFound}</span>
                      <span style={{ color: "var(--success, #4caf50)" }}>New: {r.itemsNew}</span>
                      <span>Updated: {r.itemsUpdated}</span>
                      <span>Skipped: {r.itemsSkipped}</span>
                      <span className="muted">{new Date(r.startedAt).toLocaleString()}</span>
                      {r.errorMsg && <span style={{ color: "var(--error)" }}>{r.errorMsg}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
