"use client";

import { useState, useEffect, useCallback } from "react";
import { LoadingState, EmptyState, FormCard } from "../_components";
import { useAutoTranslate } from "@/lib/i18n/auto-translate-provider";

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
  const { t } = useAutoTranslate();
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
    if (!confirm(t("Revoke this API key? This cannot be undone."))) return;
    await fetch(`/api/apikeys?id=${id}`, { method: "DELETE" });
    fetchKeys();
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div className="mb-24">
        <h2 style={{ margin: 0 }}>{t("API Keys")}</h2>
        <p style={{ color: "var(--muted)", margin: "4px 0 0" }}>
          {t("Create API keys for agents and external systems to access WCN.")}
        </p>
      </div>

      {newKey && (
        <div style={{ background: "var(--success-bg, #e8f5e9)", border: "1px solid var(--success, #4caf50)", borderRadius: 8, padding: 16, marginBottom: 20 }}>
          <p className="font-semibold" style={{ margin: "0 0 8px" }}>{t("API key created — copy it now, it will not be shown again:")}</p>
          <code className="font-mono text-sm" style={{ display: "block", padding: 12, background: "var(--bg2, #1a1a2e)", color: "var(--accent, #00d4ff)", borderRadius: 6, wordBreak: "break-all" }}>
            {newKey}
          </code>
          <button className="btn mt-12" onClick={() => { navigator.clipboard.writeText(newKey); }}>
            {t("Copy to Clipboard")}
          </button>
          <button className="btn" style={{ marginTop: 12, marginLeft: 8 }} onClick={() => setNewKey(null)}>{t("Dismiss")}</button>
        </div>
      )}

      <FormCard open={showCreate} onToggle={() => setShowCreate(!showCreate)} triggerLabel={t("+ New Key")}>
        <h3 style={{ margin: "0 0 16px" }}>{t("Create API Key")}</h3>
        <div className="mb-12">
          <label className="field">
            <span className="label">{t("Name")}</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={t("e.g. Research Agent, CrunchBase Crawler")}
            />
          </label>
        </div>
        <div className="mb-12">
          <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>{t("Scopes")}</label>
          <div className="flex flex-wrap gap-8">
            {SCOPE_OPTIONS.map((s) => (
              <label key={s.value} className="flex items-center gap-4" style={{ cursor: "pointer" }}>
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
                <span className="text-sm">{t(s.label)}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="mb-16">
          <label className="field">
            <span className="label">{t("Expires in (days)")}</span>
            <input
              type="number"
              value={form.expiresInDays}
              onChange={(e) => setForm({ ...form, expiresInDays: Number(e.target.value) })}
              style={{ width: 120 }}
            />
          </label>
        </div>
        <div className="flex gap-8">
          <button className="btn btn-primary" onClick={handleCreate} disabled={!form.name}>{t("Create")}</button>
          <button className="btn" onClick={() => setShowCreate(false)}>{t("Cancel")}</button>
        </div>
      </FormCard>

      {loading ? (
        <LoadingState />
      ) : keys.length === 0 ? (
        <EmptyState message={t("No API keys yet. Create one to get started.")} />
      ) : (
        <div className="flex-col gap-12">
          {keys.map((k) => (
            <div key={k.id} className="flex-between items-center card p-16">
              <div>
                <div className="font-semibold">{k.name}</div>
                <div className="text-sm muted" style={{ marginTop: 4 }}>
                  <code>{k.keyPrefix}...</code> · {t("Scopes:")} {k.scopes.join(", ")} · {t("Rate:")} {k.rateLimit}/{t("min")}
                </div>
                <div className="text-xs muted" style={{ marginTop: 2 }}>
                  {t("Created:")} {new Date(k.createdAt).toLocaleDateString()}
                  {k.lastUsedAt && ` · ${t("Last used:")} ${new Date(k.lastUsedAt).toLocaleDateString()}`}
                  {k.expiresAt && ` · ${t("Expires:")} ${new Date(k.expiresAt).toLocaleDateString()}`}
                </div>
              </div>
              <button className="btn" style={{ color: "var(--error, #ff4444)" }} onClick={() => handleRevoke(k.id)}>{t("Revoke")}</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
