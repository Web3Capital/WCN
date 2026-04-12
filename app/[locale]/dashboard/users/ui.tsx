"use client";

import { useMemo, useState } from "react";
import { Link } from "@/i18n/routing";
import { EmptyState } from "../_components";
import { useAutoTranslate } from "@/lib/i18n/auto-translate-provider";

type UserRow = {
  id: string;
  name: string | null;
  email: string | null;
  role: "USER" | "ADMIN";
  createdAt: string | Date;
  _count: { nodes: number; applications: number };
};

function fmtDate(v: string | Date) {
  const d = typeof v === "string" ? new Date(v) : v;
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString();
}

export function UsersConsole({ initial, currentUserId }: { initial: UserRow[]; currentUserId: string }) {
  const { t } = useAutoTranslate();
  const [users, setUsers] = useState<UserRow[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(initial[0]?.id ?? null);
  const selected = useMemo(() => users.find((u) => u.id === selectedId) ?? null, [users, selectedId]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function changeRole(userId: string, role: string) {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role })
    });
    const data = await res.json().catch(() => null);
    setSaving(false);
    if (!res.ok || !data?.ok) {
      setError(data?.error ?? t("Failed to update role."));
      return;
    }
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: data.data.role } : u))
    );
  }

  async function refresh() {
    const res = await fetch("/api/users", { cache: "no-store" });
    const data = await res.json().catch(() => null);
    if (data?.ok) setUsers(data.data ?? []);
  }

  return (
    <div className="apps-layout">
      <div className="apps-list">
        {users.map((u) => (
          <button
            key={u.id}
            type="button"
            className="apps-row"
            data-active={u.id === selectedId ? "true" : "false"}
            onClick={() => setSelectedId(u.id)}
          >
            <div style={{ display: "grid", gap: 2 }}>
              <div className="font-bold" style={{ color: "var(--text)" }}>{u.name || u.email || "—"}</div>
              <div className="muted text-sm">
                {u.email ?? "—"} · {u._count.nodes} {t("nodes")}
              </div>
            </div>
            <span className="pill">{u.role}</span>
          </button>
        ))}
      </div>

      <div className="apps-detail">
        {selected ? (
          <>
            <div className="apps-detail-head">
              <div>
                <h3 className="mb-6">{selected.name || selected.email || "—"}</h3>
                <p className="muted" style={{ margin: 0 }}>{t("Joined:")} {fmtDate(selected.createdAt)}</p>
              </div>
              <div className="cta-row mt-0">
                <select
                  value={selected.role}
                  onChange={(e) => changeRole(selected.id, e.target.value)}
                  disabled={saving || selected.id === currentUserId}
                  title={selected.id === currentUserId ? t("Cannot change your own role") : undefined}
                  style={{ width: 140 }}
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
            </div>
            <div className="grid-2 mt-14 gap-12">
              <div className="kpi">
                <strong>{t("Email")}</strong>
                <span className="muted">{selected.email ?? "—"}</span>
              </div>
              <div className="kpi">
                <strong>{t("User ID")}</strong>
                <span className="muted text-sm" style={{ wordBreak: "break-all" }}>{selected.id}</span>
              </div>
              <div className="kpi">
                <strong>{t("Owned nodes")}</strong>
                <span className="muted">{selected._count.nodes}</span>
              </div>
              <div className="kpi">
                <strong>{t("Applications")}</strong>
                <span className="muted">{selected._count.applications}</span>
              </div>
            </div>
            {selected.id === currentUserId ? (
              <p className="muted mt-14 mb-0 text-sm">
                {t("This is your account. Role changes must be made by another admin.")}
              </p>
            ) : null}
            {error ? <p className="form-error mt-10">{error}</p> : null}
            <div className="flex gap-8 mt-14">
              <Link href={`/dashboard/users/${selected.id}`} className="button text-xs" style={{ textDecoration: "none" }}>
                {t("Full profile →")}
              </Link>
              <button className="button-secondary" type="button" onClick={refresh} disabled={saving}>
                {t("Refresh")}
              </button>
            </div>
          </>
        ) : (
          <EmptyState message={t("Select a user.")} />
        )}
      </div>
    </div>
  );
}
