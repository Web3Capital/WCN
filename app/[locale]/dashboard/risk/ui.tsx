"use client";

import { useState, useEffect, useMemo } from "react";
import { StatusBadge, EmptyState, FormCard, ConfirmDialog, StatCard, DashboardDistributionPie, DashboardPipelineBar } from "../_components";
import { useAutoTranslate } from "@/lib/i18n/auto-translate-provider";

type RiskFlagRow = {
  id: string;
  entityType: string;
  entityId: string;
  severity: string;
  reason: string;
  resolution: string | null;
  resolvedAt: string | null;
  createdAt: string;
};

type RiskRule = {
  id: string;
  name: string;
  entityType: string;
  conditions: any;
  severity: string;
  action: string;
  enabled: boolean;
};

function RiskRulesTab() {
  const { t } = useAutoTranslate();
  const [rules, setRules] = useState<RiskRule[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [entityType, setEntityType] = useState("NODE");
  const [field, setField] = useState("");
  const [operator, setOperator] = useState("eq");
  const [threshold, setThreshold] = useState("");
  const [severity, setSeverity] = useState("MEDIUM");
  const [action, setAction] = useState("CREATE_FLAG");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/risk/rules").then((r) => {
      if (!r.ok) throw new Error(`Risk rules fetch failed: ${r.status}`);
      return r.json();
    }).then((d) => {
      if (d.ok) setRules(d.data);
    }).catch((err) => console.error("[Risk]", err));
  }, []);

  async function createRule(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/risk/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          entityType,
          conditions: [{ field, operator, threshold: isNaN(Number(threshold)) ? threshold : Number(threshold) }],
          severity,
          action,
        }),
      });
      const d = await res.json();
      if (d.ok) {
        setRules([d.data, ...rules]);
        setShowForm(false);
        setName(""); setField(""); setThreshold("");
      }
    } finally { setBusy(false); }
  }

  return (
    <div>
      <FormCard open={showForm} onToggle={() => setShowForm(!showForm)} triggerLabel={t("Add Rule")}>
        <form onSubmit={createRule} className="form">
          <div className="grid-3 gap-12">
            <label className="field">
              <span className="label">{t("Rule Name")}</span>
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <label className="field">
              <span className="label">{t("Entity Type")}</span>
              <select value={entityType} onChange={(e) => setEntityType(e.target.value)}>
                {["NODE", "PROJECT", "DEAL", "TASK", "USER"].map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </label>
            <label className="field">
              <span className="label">{t("Severity")}</span>
              <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
                {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          </div>
          <div className="grid-3 gap-12">
            <label className="field">
              <span className="label">{t("Field")}</span>
              <input value={field} onChange={(e) => setField(e.target.value)} placeholder={t("e.g. status")} required />
            </label>
            <label className="field">
              <span className="label">{t("Operator")}</span>
              <select value={operator} onChange={(e) => setOperator(e.target.value)}>
                {["eq", "neq", "gt", "lt", "gte", "lte", "contains", "in"].map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </label>
            <label className="field">
              <span className="label">{t("Threshold")}</span>
              <input value={threshold} onChange={(e) => setThreshold(e.target.value)} required />
            </label>
          </div>
          <label className="field">
            <span className="label">{t("Action")}</span>
            <select value={action} onChange={(e) => setAction(e.target.value)}>
              {["CREATE_FLAG", "FREEZE_ENTITY", "NOTIFY_RISK_DESK"].map((a) => <option key={a} value={a}>{t(a.replace(/_/g, " "))}</option>)}
            </select>
          </label>
          <div className="flex gap-8">
            <button type="submit" className="button" disabled={busy}>{busy ? t("Creating...") : t("Create Rule")}</button>
            <button type="button" className="button-secondary" onClick={() => setShowForm(false)}>{t("Cancel")}</button>
          </div>
        </form>
      </FormCard>

      {rules.length === 0 ? (
        <EmptyState message={t("No risk rules configured.")} />
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>{t("Name")}</th>
              <th>{t("Entity")}</th>
              <th>{t("Severity")}</th>
              <th>{t("Action")}</th>
              <th>{t("Status")}</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r) => (
              <tr key={r.id}>
                <td className="font-semibold">{r.name}</td>
                <td><StatusBadge status={r.entityType} /></td>
                <td><StatusBadge status={r.severity} /></td>
                <td className="muted text-xs">{r.action.replace(/_/g, " ")}</td>
                <td>
                  <span className={`badge ${r.enabled ? "badge-green" : ""}`}>{r.enabled ? t("Active") : t("Disabled")}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export function RiskConsole({ initialFlags }: { initialFlags: RiskFlagRow[] }) {
  const { t } = useAutoTranslate();
  const [flags, setFlags] = useState(initialFlags);
  const [filter, setFilter] = useState<"all" | "open" | "resolved">("open");
  const [tab, setTab] = useState<"flags" | "rules">("flags");
  const [showForm, setShowForm] = useState(false);
  const [entityType, setEntityType] = useState("NODE");
  const [entityId, setEntityId] = useState("");
  const [severity, setSeverity] = useState("MEDIUM");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [resolveTarget, setResolveTarget] = useState<string | null>(null);

  const severityCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const f of flags) c[f.severity] = (c[f.severity] ?? 0) + 1;
    return c;
  }, [flags]);

  const riskKpis = useMemo(() => {
    const total = flags.length;
    const open = flags.filter((f) => !f.resolvedAt).length;
    const resolved = flags.filter((f) => !!f.resolvedAt).length;
    const criticalOpen = flags.filter(
      (f) => !f.resolvedAt && (f.severity === "CRITICAL" || f.severity === "HIGH"),
    ).length;
    return { total, open, resolved, criticalOpen };
  }, [flags]);

  const severityColors: Record<string, string> = {
    LOW: "#94a3b8",
    MEDIUM: "#f59e0b",
    HIGH: "#f97316",
    CRITICAL: "#ef4444",
  };
  const severityOrder = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
  const severityPalette = ["#94a3b8", "#f59e0b", "#f97316", "#ef4444"] as const;

  const displayed = filter === "all" ? flags : filter === "open" ? flags.filter((f) => !f.resolvedAt) : flags.filter((f) => !!f.resolvedAt);

  async function createFlag(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType, entityId, severity, reason }),
      });
      const data = await res.json();
      if (data.ok) {
        setFlags([{ ...data.data, createdAt: new Date().toISOString() }, ...flags]);
        setShowForm(false);
        setEntityId("");
        setReason("");
      }
    } finally { setBusy(false); }
  }

  async function resolveFlag(id: string, resolution: string) {
    const res = await fetch(`/api/risk/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolve: true, resolution }),
    });
    const data = await res.json();
    if (data.ok) {
      setFlags(flags.map((f) => f.id === id ? { ...f, resolvedAt: new Date().toISOString(), resolution } : f));
    }
  }

  return (
    <div className="flex flex-col gap-16 mt-20">
      <div className="grid-4 gap-12">
        <StatCard label={t("Flags")} value={riskKpis.total} />
        <StatCard label={t("Open")} value={riskKpis.open} />
        <StatCard label={t("Resolved")} value={riskKpis.resolved} />
        <StatCard label={t("High / critical (open)")} value={riskKpis.criticalOpen} />
      </div>
      {Object.keys(severityCounts).length > 0 && (
        <div className="grid-2 gap-16">
          <div className="card p-18">
            <h3 className="mt-0 mb-12">{t("Severity distribution")}</h3>
            <DashboardDistributionPie data={severityCounts} colorMap={severityColors} />
          </div>
          <div className="card p-18">
            <h3 className="mt-0 mb-12">{t("Severity pipeline")}</h3>
            <DashboardPipelineBar orderedKeys={severityOrder} data={severityCounts} palette={severityPalette} />
          </div>
        </div>
      )}
      <div className="chip-group mb-16">
        <button className={`chip ${tab === "flags" ? "chip-active" : ""}`} onClick={() => setTab("flags")}>{t("Risk Flags")}</button>
        <button className={`chip ${tab === "rules" ? "chip-active" : ""}`} onClick={() => setTab("rules")}>{t("Rule Engine")}</button>
      </div>

      {tab === "rules" ? (
        <RiskRulesTab />
      ) : (
        <>
          <div className="page-toolbar">
            <div className="chip-group">
              <button className={`chip ${filter === "open" ? "chip-active" : ""}`} onClick={() => setFilter("open")}>
                {t("Open")} ({flags.filter((f) => !f.resolvedAt).length})
              </button>
              <button className={`chip ${filter === "all" ? "chip-active" : ""}`} onClick={() => setFilter("all")}>
                {t("All")} ({flags.length})
              </button>
              <button className={`chip ${filter === "resolved" ? "chip-active" : ""}`} onClick={() => setFilter("resolved")}>
                {t("Resolved")} ({flags.filter((f) => !!f.resolvedAt).length})
              </button>
            </div>
            <div className="page-toolbar-spacer" />
            <button className="button" onClick={() => setShowForm(!showForm)}>{t("Flag risk")}</button>
          </div>

          {showForm && (
            <div className="card p-18 mb-16">
              <form onSubmit={createFlag} className="form">
                <div className="grid-3 gap-12">
                  <label className="field">
                    <span className="label">{t("Entity type")}</span>
                    <select value={entityType} onChange={(e) => setEntityType(e.target.value)}>
                      {["NODE", "PROJECT", "DEAL", "TASK", "AGENT", "EVIDENCE", "POB", "CAPITAL", "USER"].map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span className="label">{t("Entity ID")}</span>
                    <input placeholder={t("Entity ID")} value={entityId} onChange={(e) => setEntityId(e.target.value)} required />
                  </label>
                  <label className="field">
                    <span className="label">{t("Severity")}</span>
                    <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
                      {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </label>
                </div>
                <label className="field">
                  <span className="label">{t("Reason")}</span>
                  <textarea placeholder={t("Reason")} value={reason} onChange={(e) => setReason(e.target.value)} required rows={2} />
                </label>
                <div className="flex gap-8">
                  <button type="submit" className="button" disabled={busy}>{busy ? t("Creating...") : t("Create flag")}</button>
                  <button type="button" className="button-secondary" onClick={() => setShowForm(false)}>{t("Cancel")}</button>
                </div>
              </form>
            </div>
          )}

          {displayed.length === 0 ? (
            <EmptyState message={t("No risk flags.")} />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 32 }}></th>
                  <th>{t("Entity")}</th>
                  <th>{t("Reason")}</th>
                  <th>{t("Severity")}</th>
                  <th>{t("Date")}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((f) => (
                  <tr key={f.id}>
                    <td>
                      <span className={`status-dot ${f.resolvedAt ? "status-dot-green" : f.severity === "CRITICAL" || f.severity === "HIGH" ? "status-dot-red" : "status-dot-amber"}`} />
                    </td>
                    <td>
                      <div className="font-bold text-sm">{f.entityType}</div>
                      <div className="muted text-xs">{f.entityId.slice(0, 12)}…</div>
                    </td>
                    <td>
                      <div className="text-sm">{f.reason}</div>
                      {f.resolution && <div style={{ fontSize: 12, color: "var(--green)", marginTop: 2 }}>{t("Resolution:")} {f.resolution}</div>}
                    </td>
                    <td><StatusBadge status={f.severity} /></td>
                    <td className="muted text-xs">{new Date(f.createdAt).toLocaleDateString()}</td>
                    <td>
                      {!f.resolvedAt && (
                        <button className="button-secondary" style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => setResolveTarget(f.id)}>{t("Resolve")}</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <ConfirmDialog
            open={!!resolveTarget}
            title={t("Resolve Risk Flag")}
            description={t("Provide a resolution note for this risk flag.")}
            confirmLabel={t("Resolve")}
            withInput
            inputLabel={t("Resolution")}
            inputPlaceholder={t("Resolution note...")}
            onConfirm={(val) => { if (resolveTarget && val) resolveFlag(resolveTarget, val); setResolveTarget(null); }}
            onCancel={() => setResolveTarget(null)}
          />
        </>
      )}
    </div>
  );
}
