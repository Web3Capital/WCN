"use client";

import { useMemo, useState } from "react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { StatusBadge, EmptyState, FilterToolbar, StatCard } from "../../_components";
import { ClipboardList } from "lucide-react";

const REVIEW_STATUSES = ["ALL", "SUBMITTED", "UNDER_REVIEW", "NEED_MORE_INFO"] as const;

type Row = {
  id: string;
  name: string;
  type: string;
  status: string;
  region: string | null;
  city: string | null;
  vertical: string | null;
  updatedAt: string;
  owner: { id: string; name: string | null; email: string | null } | null;
};

export function NodeReviewQueueConsole({ initialRows, statusCounts }: { initialRows: Row[]; statusCounts: Record<string, number> }) {
  const t = useTranslations("dashboard.reviewQueue");
  const [filter, setFilter] = useState<(typeof REVIEW_STATUSES)[number]>("ALL");

  const filtered = useMemo(() => {
    if (filter === "ALL") return initialRows;
    return initialRows.filter((r) => r.status === filter);
  }, [initialRows, filter]);

  const totalInQueue = initialRows.length;
  const toolbarCounts = statusCounts as Partial<Record<(typeof REVIEW_STATUSES)[number], number>>;

  return (
    <div className="mt-16">
      <div className="grid-4 mb-16">
        <StatCard label={t("kpiTotal")} value={totalInQueue} icon={<ClipboardList size={18} />} />
        <StatCard label={t("kpiSubmitted")} value={statusCounts.SUBMITTED ?? 0} />
        <StatCard label={t("kpiUnderReview")} value={statusCounts.UNDER_REVIEW ?? 0} />
        <StatCard label={t("kpiNeedInfo")} value={statusCounts.NEED_MORE_INFO ?? 0} />
      </div>

      <FilterToolbar
        filters={REVIEW_STATUSES}
        active={filter}
        onChange={setFilter}
        counts={toolbarCounts}
        totalLabel={t("filterAll")}
        totalCount={totalInQueue}
      />

      {filtered.length === 0 ? (
        <EmptyState message={t("empty")} />
      ) : (
        <div className="apps-list mt-16">
          {filtered.map((r) => (
            <div key={r.id} className="apps-row flex items-center gap-12 flex-wrap">
              <span
                className={`status-dot ${
                  r.status === "UNDER_REVIEW"
                    ? "status-dot-purple"
                    : r.status === "NEED_MORE_INFO"
                      ? "status-dot-amber"
                      : "status-dot-amber"
                }`}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="font-bold">{r.name}</div>
                <div className="muted text-sm">
                  {r.type}
                  {r.region ? ` · ${r.region}` : ""}
                  {r.city ? ` · ${r.city}` : ""}
                  {r.vertical ? ` · ${r.vertical}` : ""}
                </div>
                {r.owner?.name || r.owner?.email ? (
                  <div className="muted text-xs mt-4">{r.owner?.name ?? r.owner?.email}</div>
                ) : null}
              </div>
              <StatusBadge status={r.status} />
              <span className="muted text-xs">{new Date(r.updatedAt).toLocaleString()}</span>
              <div className="flex gap-8 flex-shrink-0">
                <Link href={`/dashboard/nodes/${r.id}`} className="button-secondary text-xs" style={{ textDecoration: "none" }}>
                  {t("openNode")}
                </Link>
                <Link href={`/dashboard/nodes/${r.id}/review`} className="button text-xs" style={{ textDecoration: "none" }}>
                  {t("openReview")}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
