"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/routing";
import { getApiErrorMessageFromJson } from "@/lib/api-error";
import { useAutoTranslate } from "@/lib/i18n/auto-translate-provider";
import { StatusBadge, FormCard, EmptyState, StatCard, DashboardDistributionPie, DashboardPipelineBar, ReadOnlyInlineStrip } from "../_components";

type TinyRow = { id: string; name?: string; title?: string };
type EvidenceRow = { id: string; title: string | null; type: string; url: string | null; onchainTx: string | null; taskId: string | null; projectId: string | null; nodeId: string | null };
type AttributionRow = { id: string; nodeId: string; role: string; shareBps: number; node?: { name?: string } };
type ConfirmationRow = { id: string; decision: string; partyType: string; partyUserId: string | null; partyNodeId: string | null; notes: string | null; createdAt: string | Date };
type DisputeRow = { id: string; status: string; reason: string; resolution: string | null; targetType: string; targetId: string; createdAt: string | Date; resolvedAt: string | Date | null };
type PobRow = {
  id: string;
  businessType: string;
  baseValue: number;
  weight: number;
  qualityMult: number;
  timeMult: number;
  riskDiscount: number;
  score: number;
  status: string;
  notes: string | null;
  taskId: string | null;
  projectId: string | null;
  nodeId: string | null;
  attributions?: AttributionRow[];
  confirmations?: ConfirmationRow[];
  disputes?: DisputeRow[];
};

const POB_STATUS = ["PENDING", "REVIEWING", "APPROVED", "REJECTED"] as const;

export function PobConsole({
  initial,
  tasks,
  projects,
  nodes,
  evidences,
  readOnly = false
}: {
  initial: PobRow[];
  tasks: TinyRow[];
  projects: TinyRow[];
  nodes: TinyRow[];
  evidences: EvidenceRow[];
  readOnly?: boolean;
}) {
  const { t } = useAutoTranslate();
  const [rows, setRows] = useState<PobRow[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(rows[0]?.id ?? null);
  const selected = useMemo(() => rows.find((r) => r.id === selectedId) ?? null, [rows, selectedId]);

  const [showForm, setShowForm] = useState(false);
  const [create, setCreate] = useState({
    businessType: "fundraising",
    baseValue: 0,
    weight: 1,
    qualityMult: 1,
    timeMult: 1,
    riskDiscount: 1,
    status: "PENDING",
    taskId: "",
    projectId: "",
    nodeId: ""
  });

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attrText, setAttrText] = useState("");
  const [confirm, setConfirm] = useState({ decision: "CONFIRM", partyType: "NODE", partyNodeId: "", partyUserId: "", notes: "" });
  const [disputeReason, setDisputeReason] = useState("");
  const [pobReviews, setPobReviews] = useState<{ id: string; decision: string; notes: string | null; createdAt: string | Date; reviewer: { name: string | null; email: string | null } | null }[]>([]);

  useEffect(() => {
    if (!selectedId || readOnly) { setPobReviews([]); return; }
    fetch(`/api/reviews?targetType=POB&targetId=${selectedId}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (d?.ok) setPobReviews(d.data ?? []); })
      .catch((err) => console.error("[PoB] review fetch failed", err));
  }, [selectedId, readOnly]);

  async function refresh() {
    const res = await fetch("/api/pob", { cache: "no-store" });
    const data = await res.json();
    if (!data?.ok) throw new Error(getApiErrorMessageFromJson(data));
    const list = data.data ?? [];
    setRows(list);
    if (!selectedId && list[0]?.id) setSelectedId(list[0].id);
  }

  async function onCreate() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/pob", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...create,
          taskId: create.taskId || null,
          projectId: create.projectId || null,
          nodeId: create.nodeId || null
        })
      });
      const data = await res.json();
      if (!data?.ok) throw new Error(data?.error ?? "Create failed.");
      await refresh();
      setShowForm(false);
    } catch (e: any) {
      setError(e?.message ?? "Create failed.");
    } finally {
      setBusy(false);
    }
  }

  async function onSave(patch: any) {
    if (!selected) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/pob/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch)
      });
      const data = await res.json();
      if (!data?.ok) throw new Error(getApiErrorMessageFromJson(data));
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  async function saveAttribution() {
    if (!selected) return;
    setError(null);
    setBusy(true);
    try {
      const items = attrText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => {
          const [nodeId, shareBpsRaw, roleRaw] = l.split(",").map((x) => x.trim());
          return { nodeId, shareBps: Number(shareBpsRaw), role: roleRaw || "COLLAB" };
        });

      const res = await fetch("/api/pob/attribution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pobId: selected.id, items })
      });
      const data = await res.json();
      if (!data?.ok) throw new Error(getApiErrorMessageFromJson(data));
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Attribution save failed.");
    } finally {
      setBusy(false);
    }
  }

  async function addConfirmation() {
    if (!selected) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/pob/confirmations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pobId: selected.id,
          decision: confirm.decision,
          partyType: confirm.partyType,
          partyNodeId: confirm.partyType === "NODE" ? (confirm.partyNodeId || null) : null,
          partyUserId: confirm.partyType === "USER" ? (confirm.partyUserId || null) : null,
          notes: confirm.notes || null
        })
      });
      const data = await res.json();
      if (!data?.ok) throw new Error(getApiErrorMessageFromJson(data));
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Confirmation failed.");
    } finally {
      setBusy(false);
    }
  }

  async function openDispute() {
    if (!selected || !disputeReason.trim()) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pobId: selected.id, targetType: "POB", targetId: selected.id, reason: disputeReason })
      });
      const data = await res.json();
      if (!data?.ok) throw new Error(getApiErrorMessageFromJson(data));
      setDisputeReason("");
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Dispute creation failed.");
    } finally {
      setBusy(false);
    }
  }

  async function resolveDispute(disputeId: string, status: "RESOLVED" | "REJECTED", resolution?: string) {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/disputes/${disputeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, resolution: resolution || null })
      });
      const data = await res.json();
      if (!data?.ok) throw new Error(getApiErrorMessageFromJson(data));
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Dispute update failed.");
    } finally {
      setBusy(false);
    }
  }

  const pobKpis = useMemo(() => {
    const total = rows.length;
    const approved = rows.filter((r) => r.status === "APPROVED").length;
    const pending = rows.filter((r) => r.status === "PENDING" || r.status === "REVIEWING").length;
    const avgScore = total > 0 ? Math.round(rows.reduce((s, r) => s + r.score, 0) / total) : 0;
    return { total, approved, pending, avgScore };
  }, [rows]);
  const pobStatusCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of rows) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [rows]);
  const pobStatusColors: Record<string, string> = {
    PENDING: "#94a3b8", REVIEWING: "#f59e0b", APPROVED: "#22c55e", REJECTED: "#ef4444",
  };
  const pobPalette = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444"] as const;
  const pobOrder = ["PENDING", "REVIEWING", "APPROVED", "REJECTED"] as const;

  return (
    <div className="flex-col gap-16">
      <div className="grid-4 gap-12">
        <StatCard label={t("PoB records")} value={pobKpis.total} />
        <StatCard label={t("Approved")} value={pobKpis.approved} />
        <StatCard label={t("Pending review")} value={pobKpis.pending} />
        <StatCard label={t("Avg score")} value={pobKpis.avgScore || "—"} />
      </div>
      {!readOnly && Object.keys(pobStatusCounts).length > 0 && (
        <div className="grid-2 gap-16">
          <div className="card p-18">
            <h3 className="mt-0 mb-12">{t("Status distribution")}</h3>
            <DashboardDistributionPie data={pobStatusCounts} colorMap={pobStatusColors} />
          </div>
          <div className="card p-18">
            <h3 className="mt-0 mb-12">{t("Pipeline flow")}</h3>
            <DashboardPipelineBar orderedKeys={pobOrder} data={pobStatusCounts} palette={pobPalette} />
          </div>
        </div>
      )}
      {readOnly ? <ReadOnlyInlineStrip /> : null}
    <div className="apps-layout">
      <div>
        {!readOnly ? (
          <FormCard open={showForm} onToggle={() => setShowForm(!showForm)} triggerLabel={t("Create PoB record")}>
            <div className="form mb-14">
              <label className="field">
                <span className="label">{t("Business type")}</span>
                <input
                  value={create.businessType}
                  onChange={(e) => setCreate((s) => ({ ...s, businessType: e.target.value }))}
                />
              </label>
              <div className="grid-3 gap-12">
                <label className="field">
                  <span className="label">{t("Base value")}</span>
                  <input
                    type="number"
                    value={create.baseValue}
                    onChange={(e) => setCreate((s) => ({ ...s, baseValue: Number(e.target.value) }))}
                  />
                </label>
                <label className="field">
                  <span className="label">{t("Weight")}</span>
                  <input
                    type="number"
                    value={create.weight}
                    onChange={(e) => setCreate((s) => ({ ...s, weight: Number(e.target.value) }))}
                  />
                </label>
                <label className="field">
                  <span className="label">{t("Status")}</span>
                  <select value={create.status} onChange={(e) => setCreate((s) => ({ ...s, status: e.target.value }))}>
                    {POB_STATUS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid-3 gap-12">
                <label className="field">
                  <span className="label">{t("Quality")}</span>
                  <input
                    type="number"
                    value={create.qualityMult}
                    onChange={(e) => setCreate((s) => ({ ...s, qualityMult: Number(e.target.value) }))}
                  />
                </label>
                <label className="field">
                  <span className="label">{t("Time")}</span>
                  <input
                    type="number"
                    value={create.timeMult}
                    onChange={(e) => setCreate((s) => ({ ...s, timeMult: Number(e.target.value) }))}
                  />
                </label>
                <label className="field">
                  <span className="label">{t("Risk discount")}</span>
                  <input
                    type="number"
                    value={create.riskDiscount}
                    onChange={(e) => setCreate((s) => ({ ...s, riskDiscount: Number(e.target.value) }))}
                  />
                </label>
              </div>
              <label className="field">
                <span className="label">{t("Task")}</span>
                <select value={create.taskId} onChange={(e) => setCreate((s) => ({ ...s, taskId: e.target.value }))}>
                  <option value="">—</option>
                  {tasks.map((tk) => (
                    <option key={tk.id} value={tk.id}>
                      {tk.title ?? tk.id}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="label">{t("Project")}</span>
                <select
                  value={create.projectId}
                  onChange={(e) => setCreate((s) => ({ ...s, projectId: e.target.value }))}
                >
                  <option value="">—</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name ?? p.id}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="label">{t("Node")}</span>
                <select value={create.nodeId} onChange={(e) => setCreate((s) => ({ ...s, nodeId: e.target.value }))}>
                  <option value="">—</option>
                  {nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name ?? n.id}
                    </option>
                  ))}
                </select>
              </label>
              <button className="button" type="button" disabled={busy || !create.businessType.trim()} onClick={onCreate}>
                {busy ? t("Working...") : t("Create")}
              </button>
              {error ? <p className="form-error">{error}</p> : null}
            </div>
          </FormCard>
        ) : null}

        <div className="pill mb-10">
          {t("Records")} ({rows.length})
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
                  <span className={`status-dot ${r.status === "APPROVED" ? "status-dot-green" : r.status === "REJECTED" ? "status-dot-red" : r.status === "REVIEWING" ? "status-dot-amber" : ""}`} />
                  <div>
                    <div className="font-bold">{r.businessType}</div>
                    <div className="muted text-sm">{t("score")} {Math.round((r.score ?? 0) * 100) / 100}</div>
                  </div>
                </div>
                <StatusBadge status={r.status} />
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="pill mb-10">
          {readOnly ? t("Record details") : t("Review / update")}
        </div>
        {selected ? (
          <div className="form">
            <div className="grid-2 gap-12">
              <label className="field">
                <span className="label">{t("Status")}</span>
                <select
                  key={selected.id + "st"}
                  defaultValue={selected.status}
                  disabled={readOnly}
                  onChange={readOnly ? undefined : (e) => onSave({ status: e.target.value })}
                >
                  {POB_STATUS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="label">{t("Score")}</span>
                <input value={String(selected.score ?? 0)} readOnly />
              </label>
            </div>
            <label className="field">
              <span className="label">{t("Notes")}</span>
              <textarea
                key={selected.id + "n"}
                defaultValue={selected.notes ?? ""}
                readOnly={readOnly}
                disabled={readOnly}
                onBlur={readOnly ? undefined : (e) => onSave({ notes: e.target.value })}
              />
            </label>

            <div className="card p-14">
              <div className="pill mb-10">
                {t("Evidence (linked)")}
              </div>
              <div className="apps-list">
                {evidences
                  .filter((ev) => ev.taskId === selected.taskId || ev.projectId === selected.projectId || ev.nodeId === selected.nodeId)
                  .slice(0, 10)
                  .map((ev) => (
                    <div key={ev.id} className="apps-row" style={{ cursor: "default" }}>
                      <div>
                        <div className="font-bold">{ev.title || ev.type}</div>
                        <div className="muted text-sm">
                          {ev.url ? ev.url : ev.onchainTx ? ev.onchainTx : "—"}
                        </div>
                      </div>
                      <div className="pill">{ev.type}</div>
                    </div>
                  ))}
              </div>
              <p className="muted mt-10">
                {t("For uploads, use the Evidence module/API and link by task/project/node.")}
              </p>
            </div>

            <div className="card p-14">
              <div className="pill mb-10">
                {t("Attribution (shareBps total = 10000)")}
              </div>
              {!readOnly ? (
                <>
                  <p className="muted mt-0">
                    {t("Enter one per line: nodeId,shareBps,role(LEAD|COLLAB)")}
                  </p>
                  <textarea
                    value={attrText}
                    onChange={(e) => setAttrText(e.target.value)}
                    placeholder={"nodeId1,7000,LEAD\nnodeId2,3000,COLLAB"}
                  />
                  <button
                    className="button-secondary"
                    type="button"
                    disabled={busy || !attrText.trim()}
                    onClick={saveAttribution}
                  >
                    {t("Save attribution")}
                  </button>
                </>
              ) : null}
              <div className="apps-list mt-10">
                {(selected.attributions ?? []).map((a) => (
                  <div key={a.id} className="apps-row" style={{ cursor: "default" }}>
                    <div>
                      <div className="font-bold">{a.node?.name ?? a.nodeId}</div>
                      <div className="muted text-sm">
                        {a.role} · {a.shareBps} bps
                      </div>
                    </div>
                    <div className="pill">{Math.round((a.shareBps / 10000) * 1000) / 10}%</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-14">
              <div className="pill mb-10">
                {t("Confirmations")}
              </div>
              {!readOnly ? (
                <>
                  <div className="grid-2 gap-12">
                    <label className="field">
                      <span className="label">{t("Decision")}</span>
                      <select
                        value={confirm.decision}
                        onChange={(e) => setConfirm((s) => ({ ...s, decision: e.target.value }))}
                      >
                        <option value="CONFIRM">CONFIRM</option>
                        <option value="REJECT">REJECT</option>
                      </select>
                    </label>
                    <label className="field">
                      <span className="label">{t("Party type")}</span>
                      <select
                        value={confirm.partyType}
                        onChange={(e) => setConfirm((s) => ({ ...s, partyType: e.target.value }))}
                      >
                        <option value="NODE">NODE</option>
                        <option value="USER">USER</option>
                      </select>
                    </label>
                  </div>
                  {confirm.partyType === "NODE" ? (
                    <label className="field">
                      <span className="label">{t("Party node")}</span>
                      <select
                        value={confirm.partyNodeId}
                        onChange={(e) => setConfirm((s) => ({ ...s, partyNodeId: e.target.value }))}
                      >
                        <option value="">—</option>
                        {nodes.map((n) => (
                          <option key={n.id} value={n.id}>
                            {n.name ?? n.id}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <label className="field">
                      <span className="label">{t("Party userId")}</span>
                      <input
                        value={confirm.partyUserId}
                        onChange={(e) => setConfirm((s) => ({ ...s, partyUserId: e.target.value }))}
                      />
                    </label>
                  )}
                  <label className="field">
                    <span className="label">{t("Notes")}</span>
                    <input value={confirm.notes} onChange={(e) => setConfirm((s) => ({ ...s, notes: e.target.value }))} />
                  </label>
                  <button
                    className="button-secondary"
                    type="button"
                    disabled={busy || (confirm.partyType === "NODE" ? !confirm.partyNodeId : !confirm.partyUserId)}
                    onClick={addConfirmation}
                  >
                    {t("Add confirmation")}
                  </button>
                </>
              ) : null}
              <div className="apps-list mt-10">
                {(selected.confirmations ?? []).map((c) => (
                  <div key={c.id} className="apps-row" style={{ cursor: "default" }}>
                    <div>
                      <div className="font-bold">{c.decision}</div>
                      <div className="muted text-sm">
                        {c.partyType} · {c.partyNodeId ?? c.partyUserId ?? "—"}
                      </div>
                    </div>
                    <div className="pill">{new Date(c.createdAt as any).toISOString().slice(0, 10)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-14">
              <div className="pill mb-10">{t("Disputes")}</div>
              {!readOnly ? (
                <>
                  <div className="flex gap-8 mb-10">
                    <input
                      value={disputeReason}
                      onChange={(e) => setDisputeReason(e.target.value)}
                      placeholder={t("Reason for dispute...")}
                      style={{ flex: 1 }}
                    />
                    <button
                      className="button-secondary"
                      type="button"
                      disabled={busy || !disputeReason.trim()}
                      onClick={openDispute}
                    >
                      {t("Open dispute")}
                    </button>
                  </div>
                </>
              ) : null}
              <div className="apps-list">
                {(selected.disputes ?? []).map((d) => (
                  <div key={d.id} className="apps-row" style={{ cursor: "default", flexDirection: "column", alignItems: "stretch", gap: 6 }}>
                    <div className="flex-between items-center">
                      <div>
                        <StatusBadge status={d.status} />
                        <div className="muted text-sm mt-4">{d.reason}</div>
                        {d.resolution ? <div className="muted text-xs">{t("Resolution:")}{" "}{d.resolution}</div> : null}
                      </div>
                      <span className="muted text-xs no-wrap">
                        {new Date(d.createdAt as any).toLocaleDateString()}
                      </span>
                    </div>
                    {!readOnly && d.status === "OPEN" ? (
                      <div className="flex gap-6">
                        <button className="button-secondary text-xs" type="button" disabled={busy} onClick={() => resolveDispute(d.id, "RESOLVED", prompt("Resolution note:") || undefined)}>
                          {t("Resolve")}
                        </button>
                        <button className="button-secondary text-xs" type="button" disabled={busy} onClick={() => resolveDispute(d.id, "REJECTED")}>
                          {t("Reject")}
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))}
                {(selected.disputes ?? []).length === 0 ? <p className="muted" style={{ margin: 0 }}>{t("No disputes.")}</p> : null}
              </div>
            </div>

            {!readOnly && pobReviews.length > 0 ? (
              <div className="card p-14">
                <div className="pill mb-10">{t("Review history")}</div>
                <div className="apps-list">
                  {pobReviews.map((r) => (
                    <div key={r.id} className="apps-row" style={{ cursor: "default" }}>
                      <div style={{ display: "grid", gap: 2 }}>
                        <div className="font-bold" style={{ color: "var(--text)" }}>{r.decision}</div>
                        <div className="muted text-sm">
                          {r.reviewer?.name || r.reviewer?.email || "system"}
                          {r.notes ? ` — ${r.notes}` : ""}
                        </div>
                      </div>
                      <span className="muted text-xs no-wrap">
                        {new Date(r.createdAt as any).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex gap-8 items-center">
              <Link href={`/dashboard/pob/${selected.id}`} className="button text-xs" style={{ textDecoration: "none" }}>
                {t("Full detail →")}
              </Link>
              <button className="button-secondary" type="button" disabled={busy} onClick={() => refresh()}>
                {busy ? t("Working...") : t("Refresh")}
              </button>
            </div>
            {error ? <p className="form-error">{error}</p> : null}
          </div>
        ) : (
          <EmptyState message={t("Select a record.")} />
        )}
      </div>
    </div>
    </div>
  );
}
