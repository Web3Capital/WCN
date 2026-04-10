"use client";

import { useState, useEffect, useCallback } from "react";

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0 }}>Data Ingestion</h2>
          <p style={{ color: "var(--muted)", margin: "4px 0 0" }}>
            Configure external data sources that agents use to import projects and investors.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Source</button>
      </div>

      {showCreate && (
        <div style={{ background: "var(--bg2, #1a1a2e)", borderRadius: 12, padding: 24, marginBottom: 20, border: "1px solid var(--border)" }}>
          <h3 style={{ margin: "0 0 16px" }}>Add Ingestion Source</h3>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. DeFi Protocols Crawler"
              style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg1)" }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Adapter</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg1)" }}
            >
              {adapters.map((a) => (
                <option key={a.type} value={a.type}>{a.name} ({a.type})</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Config (JSON)</label>
            <textarea
              value={form.config}
              onChange={(e) => setForm({ ...form, config: e.target.value })}
              rows={5}
              placeholder='{"minTvl": 1000000, "category": "Dexes"}'
              style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg1)", fontFamily: "monospace", fontSize: 13 }}
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-primary" onClick={handleCreate} disabled={!form.name}>Create</button>
            <button className="btn" onClick={() => setShowCreate(false)}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : sources.length === 0 ? (
        <p style={{ color: "var(--muted)", textAlign: "center", padding: 40 }}>No ingestion sources configured yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {sources.map((s) => (
            <div key={s.id} style={{ padding: 20, background: "var(--bg2, #1a1a2e)", borderRadius: 12, border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ margin: 0 }}>{s.name}</h3>
                  <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
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
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Recent Runs:</div>
                  {s.runs.map((r) => (
                    <div key={r.id} style={{ display: "flex", gap: 16, fontSize: 13, padding: "4px 0", borderTop: "1px solid var(--border)" }}>
                      <span style={{ color: statusColor[r.status] ?? "var(--muted)" }}>{r.status}</span>
                      <span>Found: {r.itemsFound}</span>
                      <span style={{ color: "var(--success, #4caf50)" }}>New: {r.itemsNew}</span>
                      <span>Updated: {r.itemsUpdated}</span>
                      <span>Skipped: {r.itemsSkipped}</span>
                      <span style={{ color: "var(--muted)" }}>{new Date(r.startedAt).toLocaleString()}</span>
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
