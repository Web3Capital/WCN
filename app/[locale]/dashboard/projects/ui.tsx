"use client";

import { useMemo, useState } from "react";
import { Link } from "@/i18n/routing";
import { ExternalLink } from "lucide-react";
import { StatusBadge, FormCard, EmptyState } from "../_components";
import { useAutoTranslate } from "@/lib/i18n/auto-translate-provider";

type NodeRow = { id: string; name: string; type: string; status: string };
type ProjectRow = {
  id: string;
  status: string;
  name: string;
  stage: string;
  sector: string | null;
  website: string | null;
  pitchUrl: string | null;
  fundraisingNeed: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactTelegram: string | null;
  description: string | null;
  nodeId: string | null;
  internalScore: number | null;
  internalNotes: string | null;
  confidentialityLevel: string;
  riskTags: string[];
};

const PROJECT_STATUS = [
  "DRAFT", "SUBMITTED", "SCREENED", "CURATED", "IN_DEAL_ROOM",
  "ACTIVE", "ON_HOLD", "APPROVED", "REJECTED", "ARCHIVED",
] as const;
const PROJECT_STAGE = ["IDEA", "SEED", "SERIES_A", "SERIES_B", "SERIES_C", "GROWTH", "PUBLIC", "OTHER"] as const;
const CONFIDENTIALITY_LEVELS = ["PUBLIC", "CERTIFIED_NODE", "DEAL_ROOM", "RESTRICTED"] as const;

export function ProjectsConsole({
  initial,
  nodes,
  readOnly = false
}: {
  initial: ProjectRow[];
  nodes: NodeRow[];
  readOnly?: boolean;
}) {
  const { t } = useAutoTranslate();
  const [rows, setRows] = useState<ProjectRow[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(rows[0]?.id ?? null);
  const selected = useMemo(() => rows.find((r) => r.id === selectedId) ?? null, [rows, selectedId]);

  const [showForm, setShowForm] = useState(false);
  const [create, setCreate] = useState({
    name: "",
    stage: "OTHER",
    sector: "",
    nodeId: "",
    fundraisingNeed: "",
    website: "",
    pitchUrl: "",
    contactName: "",
    contactEmail: "",
    contactTelegram: "",
    description: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/projects", { cache: "no-store" });
    if (!res.ok) throw new Error(`Projects fetch failed: ${res.status}`);
    const data = await res.json();
    if (!data?.ok) throw new Error(data?.error ?? t("Failed to load projects."));
    const list = data.data?.projects ?? [];
    setRows(list);
    if (!selectedId && list[0]?.id) setSelectedId(list[0].id);
  }

  async function onCreate() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: create.name,
          stage: create.stage,
          sector: create.sector || null,
          nodeId: create.nodeId || null,
          fundraisingNeed: create.fundraisingNeed || null,
          website: create.website || null,
          pitchUrl: create.pitchUrl || null,
          contactName: create.contactName || null,
          contactEmail: create.contactEmail || null,
          contactTelegram: create.contactTelegram || null,
          description: create.description || null,
        })
      });
      const data = await res.json();
      if (!data?.ok) throw new Error(data?.error ?? t("Create failed."));
      await refresh();
      setCreate({ name: "", stage: "OTHER", sector: "", nodeId: "", fundraisingNeed: "", website: "", pitchUrl: "", contactName: "", contactEmail: "", contactTelegram: "", description: "" });
      setShowForm(false);
    } catch (e: any) {
      setError(e?.message ?? t("Create failed."));
    } finally {
      setBusy(false);
    }
  }

  async function onSave(patch: Partial<ProjectRow>) {
    if (!selected) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/projects/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch)
      });
      const data = await res.json();
      if (!data?.ok) throw new Error(data?.error ?? t("Save failed."));
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? t("Save failed."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="apps-layout">
      <div>
        {!readOnly ? (
          <FormCard open={showForm} onToggle={() => setShowForm(!showForm)} triggerLabel={t("Create project")}>
            <div className="form mb-14">
              <div className="grid-3 gap-12">
                <label className="field">
                  <span className="label">{t("Name")} *</span>
                  <input value={create.name} onChange={(e) => setCreate((s) => ({ ...s, name: e.target.value }))} />
                </label>
                <label className="field">
                  <span className="label">{t("Stage")}</span>
                  <select value={create.stage} onChange={(e) => setCreate((s) => ({ ...s, stage: e.target.value }))}>
                    {PROJECT_STAGE.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </label>
                <label className="field">
                  <span className="label">{t("Sector")}</span>
                  <input value={create.sector} onChange={(e) => setCreate((s) => ({ ...s, sector: e.target.value }))} placeholder="AI x Crypto, DeFi..." />
                </label>
              </div>
              <div className="grid-3 gap-12">
                <label className="field">
                  <span className="label">{t("Fundraising need")}</span>
                  <input value={create.fundraisingNeed} onChange={(e) => setCreate((s) => ({ ...s, fundraisingNeed: e.target.value }))} placeholder="$4M Seed" />
                </label>
                <label className="field">
                  <span className="label">{t("Website")}</span>
                  <input type="url" value={create.website} onChange={(e) => setCreate((s) => ({ ...s, website: e.target.value }))} placeholder="https://" />
                </label>
                <label className="field">
                  <span className="label">{t("Pitch URL")}</span>
                  <input type="url" value={create.pitchUrl} onChange={(e) => setCreate((s) => ({ ...s, pitchUrl: e.target.value }))} placeholder="https://" />
                </label>
              </div>
              <div className="grid-3 gap-12">
                <label className="field">
                  <span className="label">{t("Contact name")}</span>
                  <input value={create.contactName} onChange={(e) => setCreate((s) => ({ ...s, contactName: e.target.value }))} />
                </label>
                <label className="field">
                  <span className="label">{t("Email")}</span>
                  <input type="email" value={create.contactEmail} onChange={(e) => setCreate((s) => ({ ...s, contactEmail: e.target.value }))} />
                </label>
                <label className="field">
                  <span className="label">{t("Telegram")}</span>
                  <input value={create.contactTelegram} onChange={(e) => setCreate((s) => ({ ...s, contactTelegram: e.target.value }))} placeholder="@handle" />
                </label>
              </div>
              <div className="grid-2 gap-12">
                <label className="field">
                  <span className="label">{t("Node")}</span>
                  <select value={create.nodeId} onChange={(e) => setCreate((s) => ({ ...s, nodeId: e.target.value }))}>
                    <option value="">—</option>
                    {nodes.map((n) => <option key={n.id} value={n.id}>{n.name} ({n.type})</option>)}
                  </select>
                </label>
                <label className="field">
                  <span className="label">{t("Description")}</span>
                  <textarea value={create.description} onChange={(e) => setCreate((s) => ({ ...s, description: e.target.value }))} rows={2} />
                </label>
              </div>
              <button className="button" type="button" disabled={busy || !create.name.trim()} onClick={onCreate}>
                {busy ? t("Working...") : t("Create")}
              </button>
              {error ? <p className="form-error">{error}</p> : null}
            </div>
          </FormCard>
        ) : null}

        <div className="pill mb-10">
          {t("Projects")} ({rows.length})
        </div>
        <div className="apps-list">
          {rows.map((r) => {
            const active = r.id === selectedId;
            return (
              <button
                key={r.id}
                type="button"
                className="apps-row"
                data-active={active ? "true" : "false"}
                onClick={() => setSelectedId(r.id)}
              >
                <div className="flex items-center gap-10">
                  <span className={`status-dot ${r.status === "APPROVED" || r.status === "ACTIVE" ? "status-dot-green" : r.status === "REJECTED" || r.status === "ARCHIVED" ? "status-dot-red" : r.status === "SUBMITTED" || r.status === "SCREENED" || r.status === "ON_HOLD" ? "status-dot-amber" : r.status === "IN_DEAL_ROOM" || r.status === "CURATED" ? "status-dot-accent" : ""}`} />
                  <div>
                    <div className="font-bold">{r.name}</div>
                    <div className="muted text-sm">{r.stage} · {r.sector || "—"}</div>
                  </div>
                </div>
                <StatusBadge status={r.status} />
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-10">
          <div className="pill">{t("Details")}</div>
          {selected && (
            <Link href={`/dashboard/projects/${selected.id}`} className="flex items-center gap-4 text-sm" style={{ color: "var(--accent)" }}>
              <ExternalLink size={14} /> {t("Full page")}
            </Link>
          )}
        </div>
        {selected ? (
          <div className="form">
            <label className="field">
              <span className="label">{t("Name")}</span>
              <input
                key={selected.id + "n"}
                defaultValue={selected.name}
                readOnly={readOnly}
                disabled={readOnly}
                onBlur={readOnly ? undefined : (e) => onSave({ name: e.target.value })}
              />
            </label>
            <div className="grid-2 gap-12">
              <label className="field">
                <span className="label">{t("Status")}</span>
                <select
                  key={selected.id + "st"}
                  defaultValue={selected.status}
                  disabled={readOnly}
                  onChange={readOnly ? undefined : (e) => onSave({ status: e.target.value })}
                >
                  {PROJECT_STATUS.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="label">{t("Stage")}</span>
                <select
                  key={selected.id + "sg"}
                  defaultValue={selected.stage}
                  disabled={readOnly}
                  onChange={readOnly ? undefined : (e) => onSave({ stage: e.target.value })}
                >
                  {PROJECT_STAGE.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="field">
              <span className="label">{t("Sector")}</span>
              <input
                key={selected.id + "sc"}
                defaultValue={selected.sector ?? ""}
                readOnly={readOnly}
                disabled={readOnly}
                onBlur={readOnly ? undefined : (e) => onSave({ sector: e.target.value })}
              />
            </label>
            <label className="field">
              <span className="label">{t("Website")}</span>
              <input
                key={selected.id + "w"}
                defaultValue={selected.website ?? ""}
                readOnly={readOnly}
                disabled={readOnly}
                onBlur={readOnly ? undefined : (e) => onSave({ website: e.target.value })}
              />
            </label>
            <label className="field">
              <span className="label">{t("Pitch URL")}</span>
              <input
                key={selected.id + "p"}
                defaultValue={selected.pitchUrl ?? ""}
                readOnly={readOnly}
                disabled={readOnly}
                onBlur={readOnly ? undefined : (e) => onSave({ pitchUrl: e.target.value })}
              />
            </label>
            <label className="field">
              <span className="label">{t("Fundraising need")}</span>
              <textarea
                key={selected.id + "f"}
                defaultValue={selected.fundraisingNeed ?? ""}
                readOnly={readOnly}
                disabled={readOnly}
                onBlur={readOnly ? undefined : (e) => onSave({ fundraisingNeed: e.target.value })}
              />
            </label>
            <div className="grid-3 gap-12">
              <label className="field">
                <span className="label">{t("Contact name")}</span>
                <input
                  key={selected.id + "cn"}
                  defaultValue={selected.contactName ?? ""}
                  readOnly={readOnly}
                  disabled={readOnly}
                  onBlur={readOnly ? undefined : (e) => onSave({ contactName: e.target.value })}
                />
              </label>
              <label className="field">
                <span className="label">{t("Email")}</span>
                <input
                  key={selected.id + "ce"}
                  defaultValue={selected.contactEmail ?? ""}
                  readOnly={readOnly}
                  disabled={readOnly}
                  onBlur={readOnly ? undefined : (e) => onSave({ contactEmail: e.target.value })}
                />
              </label>
              <label className="field">
                <span className="label">{t("Telegram")}</span>
                <input
                  key={selected.id + "ct"}
                  defaultValue={selected.contactTelegram ?? ""}
                  readOnly={readOnly}
                  disabled={readOnly}
                  onBlur={readOnly ? undefined : (e) => onSave({ contactTelegram: e.target.value })}
                />
              </label>
            </div>
            <label className="field">
              <span className="label">{t("Node")}</span>
              <select
                key={selected.id + "nd"}
                defaultValue={selected.nodeId ?? ""}
                disabled={readOnly}
                onChange={readOnly ? undefined : (e) => onSave({ nodeId: e.target.value || null })}
              >
                <option value="">—</option>
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name} ({n.type})
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="label">{t("Description")}</span>
              <textarea
                key={selected.id + "ds"}
                defaultValue={selected.description ?? ""}
                readOnly={readOnly}
                disabled={readOnly}
                onBlur={readOnly ? undefined : (e) => onSave({ description: e.target.value })}
              />
            </label>
            {!readOnly && (
              <>
                <div className="pill mt-16 mb-8">{t("Admin")}</div>
                <div className="grid-2 gap-12">
                  <label className="field">
                    <span className="label">{t("Internal score")}</span>
                    <input
                      key={selected.id + "is"}
                      type="number"
                      min={0}
                      max={100}
                      defaultValue={selected.internalScore ?? ""}
                      onBlur={(e) => onSave({ internalScore: e.target.value ? Number(e.target.value) : null } as any)}
                    />
                  </label>
                  <label className="field">
                    <span className="label">{t("Confidentiality")}</span>
                    <select
                      key={selected.id + "cl"}
                      defaultValue={selected.confidentialityLevel ?? "PUBLIC"}
                      onChange={(e) => onSave({ confidentialityLevel: e.target.value } as any)}
                    >
                      {CONFIDENTIALITY_LEVELS.map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </label>
                </div>
                <label className="field">
                  <span className="label">{t("Risk tags")} <span className="muted text-xs">({t("comma-separated")})</span></span>
                  <input
                    key={selected.id + "rt"}
                    defaultValue={(selected.riskTags ?? []).join(", ")}
                    onBlur={(e) => onSave({ riskTags: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) } as any)}
                  />
                </label>
                <label className="field">
                  <span className="label">{t("Internal notes")}</span>
                  <textarea
                    key={selected.id + "in"}
                    defaultValue={selected.internalNotes ?? ""}
                    rows={3}
                    onBlur={(e) => onSave({ internalNotes: e.target.value } as any)}
                  />
                </label>
              </>
            )}
            <div className="flex gap-8 mt-12">
              <button className="button-secondary" type="button" disabled={busy} onClick={() => refresh()}>
                {busy ? t("Working...") : t("Refresh")}
              </button>
              {!readOnly && (
                <button
                  className="button-secondary"
                  type="button"
                  disabled={busy}
                  style={{ color: "var(--red)" }}
                  onClick={async () => {
                    if (!confirm(t("Are you sure you want to delete this project?"))) return;
                    setBusy(true);
                    try {
                      const res = await fetch(`/api/projects/${selected.id}`, { method: "DELETE" });
                      const data = await res.json();
                      if (!data?.ok) throw new Error(data?.error ?? t("Delete failed."));
                      setSelectedId(null);
                      await refresh();
                    } catch (e: any) {
                      setError(e?.message ?? t("Delete failed."));
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  {t("Delete")}
                </button>
              )}
            </div>
            {error ? <p className="form-error">{error}</p> : null}
          </div>
        ) : (
          <EmptyState message={t("Select a project.")} />
        )}
      </div>
    </div>
  );
}
