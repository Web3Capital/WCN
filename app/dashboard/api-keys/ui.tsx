"use client";

import { useState, useEffect, useCallback } from "react";

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  rateLimit: number;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  rawKey?: string;
}

const SCOPE_OPTIONS = [
  { value: "read:projects", label: "Read Projects" },
  { value: "write:projects", label: "Write Projects" },
  { value: "read:nodes", label: "Read Nodes" },
  { value: "read:deals", label: "Read Deals" },
  { value: "read:capital", label: "Read Capital" },
  { value: "write:capital", label: "Write Capital" },
  { value: "read:matches", label: "Read Matches" },
  { value: "write:matches", label: "Trigger Matches" },
  { value: "read:search", label: "Search" },
  { value: "write:ingest", label: "Batch Ingest" },
  { value: "*", label: "Full Access" },
];

export function ApiKeysUI() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);

  const [form, setForm] = useState({ name: "", scopes: ["read:projects", "read:nodes"] as string[], expiresInDays: 90 });

  const fetchKeys = useCallback(async () => {
    const res = await fetch("/api/apikeys");
    const json = await res.json();
    if (json.ok) setKeys(json.data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  async function handleCreate() {
    const res = await fetch("/api/apikeys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    if (json.ok) {
      setNewKey(json.data.rawKey);
      setShowCreate(false);
      fetchKeys();
    }
  }

  async function handleRevoke(id: string) {
    if (!confirm("Revoke this API key? This cannot be undone.")) return;
    await fetch(`/api/apikeys?id=${id}`, { method: "DELETE" });
    fetchKeys();
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0 }}>API Keys</h2>
          <p style={{ color: "var(--muted)", margin: "4px 0 0" }}>
            Create API keys for agents and external systems to access WCN.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Key</button>
      </div>

      {newKey && (
        <div style={{ background: "var(--success-bg, #e8f5e9)", border: "1px solid var(--success, #4caf50)", borderRadius: 8, padding: 16, marginBottom: 20 }}>
          <p style={{ fontWeight: 600, margin: "0 0 8px" }}>API key created — copy it now, it will not be shown again:</p>
          <code style={{ display: "block", padding: 12, background: "var(--bg2, #1a1a2e)", color: "var(--accent, #00d4ff)", borderRadius: 6, wordBreak: "break-all", fontSize: 13 }}>
            {newKey}
          </code>
          <button className="btn" style={{ marginTop: 12 }} onClick={() => { navigator.clipboard.writeText(newKey); }}>
            Copy to Clipboard
          </button>
          <button className="btn" style={{ marginTop: 12, marginLeft: 8 }} onClick={() => setNewKey(null)}>Dismiss</button>
        </div>
      )}

      {showCreate && (
        <div style={{ background: "var(--bg2, #1a1a2e)", borderRadius: 12, padding: 24, marginBottom: 20, border: "1px solid var(--border)" }}>
          <h3 style={{ margin: "0 0 16px" }}>Create API Key</h3>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Research Agent, CrunchBase Crawler"
              style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg1)" }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Scopes</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {SCOPE_OPTIONS.map((s) => (
                <label key={s.value} style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={form.scopes.includes(s.value)}
                    onChange={(e) => {
                      setForm({
                        ...form,
                        scopes: e.target.checked
                          ? [...form.scopes, s.value]
                          : form.scopes.filter((x) => x !== s.value),
                      });
                    }}
                  />
                  <span style={{ fontSize: 13 }}>{s.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>Expires in (days)</label>
            <input
              type="number"
              value={form.expiresInDays}
              onChange={(e) => setForm({ ...form, expiresInDays: Number(e.target.value) })}
              style={{ width: 120, padding: 10, borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg1)" }}
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
      ) : keys.length === 0 ? (
        <p style={{ color: "var(--muted)", textAlign: "center", padding: 40 }}>No API keys yet. Create one to get started.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {keys.map((k) => (
            <div key={k.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16, background: "var(--bg2, #1a1a2e)", borderRadius: 10, border: "1px solid var(--border)" }}>
              <div>
                <div style={{ fontWeight: 600 }}>{k.name}</div>
                <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
                  <code>{k.keyPrefix}...</code> · Scopes: {k.scopes.join(", ")} · Rate: {k.rateLimit}/min
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                  Created: {new Date(k.createdAt).toLocaleDateString()}
                  {k.lastUsedAt && ` · Last used: ${new Date(k.lastUsedAt).toLocaleDateString()}`}
                  {k.expiresAt && ` · Expires: ${new Date(k.expiresAt).toLocaleDateString()}`}
                </div>
              </div>
              <button className="btn" style={{ color: "var(--error, #ff4444)" }} onClick={() => handleRevoke(k.id)}>Revoke</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
