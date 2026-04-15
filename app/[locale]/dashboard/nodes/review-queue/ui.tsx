"use client";

import { useMemo, useState } from "react";
import { Link } from "@/i18n/routing";
import { useFormatter, useTranslations } from "next-intl";
import { useAutoTranslate } from "@/lib/i18n/auto-translate-provider";
import { formatNodeType } from "@/lib/nodes/node-type-label";
import { StatusBadge, EmptyState, FilterToolbar, StatCard } from "../../_components";
import { BookOpen, ClipboardList, Search } from "lucide-react";

const REVIEW_STATUSES = ["ALL", "SUBMITTED", "UNDER_REVIEW", "NEED_MORE_INFO"] as const;

type SortKey = "updatedDesc" | "updatedAsc" | "nameAsc";

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

function statusDotClass(status: string): string {
  if (status === "UNDER_REVIEW") return "status-dot-purple";
  if (status === "NEED_MORE_INFO") return "status-dot-orange";
  if (status === "SUBMITTED") return "status-dot-amber";
  return "status-dot-amber";
}

export function NodeReviewQueueConsole({
  initialRows,
  statusCounts,
  totalInQueue,
  fetchLimit,
}: {
  initialRows: Row[];
  statusCounts: Record<string, number>;
  totalInQueue: number;
  fetchLimit: number;
}) {
  const t = useTranslations("dashboard.reviewQueue");
  const { t: tNodeType } = useAutoTranslate();
  const format = useFormatter();
  const [filter, setFilter] = useState<(typeof REVIEW_STATUSES)[number]>("ALL");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("updatedDesc");

  const normalizedQuery = search.trim().toLowerCase();

  const filteredSorted = useMemo(() => {
    let list = filter === "ALL" ? [...initialRows] : initialRows.filter((r) => r.status === filter);
    if (normalizedQuery) {
      list = list.filter((r) => {
        const hay = [r.name, r.id, r.type, r.region, r.city, r.vertical, r.owner?.name, r.owner?.email]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(normalizedQuery);
      });
    }
    list.sort((a, b) => {
      if (sort === "nameAsc") return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
      const ta = new Date(a.updatedAt).getTime();
      const tb = new Date(b.updatedAt).getTime();
      return sort === "updatedDesc" ? tb - ta : ta - tb;
    });
    return list;
  }, [initialRows, filter, normalizedQuery, sort]);

  const truncatedList = totalInQueue > fetchLimit && initialRows.length >= fetchLimit;
  const toolbarCounts = statusCounts as Partial<Record<(typeof REVIEW_STATUSES)[number], number>>;

  const filterLabels: Partial<Record<(typeof REVIEW_STATUSES)[number], string>> = {
    SUBMITTED: t("filterSubmitted"),
    UNDER_REVIEW: t("filterUnderReview"),
    NEED_MORE_INFO: t("filterNeedInfo"),
  };

  const emptyNoData = initialRows.length === 0;
  const emptyAfterFilter = !emptyNoData && filteredSorted.length === 0;

  return (
    <div className="mt-16">
      {truncatedList ? (
        <div
          className="card"
          style={{ marginBottom: 20, padding: "12px 16px" }}
          role="status"
          aria-live="polite"
        >
          <p className="muted text-sm" style={{ margin: 0 }}>
            {t("truncatedNotice", { total: totalInQueue, limit: fetchLimit })}
          </p>
        </div>
      ) : null}

      <div className="grid-4 mb-16">
        <StatCard label={t("kpiTotal")} value={totalInQueue} icon={<ClipboardList size={18} />} />
        <StatCard label={t("kpiSubmitted")} value={statusCounts.SUBMITTED ?? 0} />
        <StatCard label={t("kpiUnderReview")} value={statusCounts.UNDER_REVIEW ?? 0} />
        <StatCard label={t("kpiNeedInfo")} value={statusCounts.NEED_MORE_INFO ?? 0} />
      </div>

      <div
        className="card"
        style={{ marginBottom: 24, padding: "16px 20px" }}
        aria-labelledby="review-queue-cases-heading"
      >
        <div className="flex gap-12 items-start">
          <BookOpen size={20} className="flex-shrink-0" style={{ color: "var(--accent)" }} aria-hidden />
          <div style={{ minWidth: 0 }}>
            <h2 id="review-queue-cases-heading" className="text-sm font-bold" style={{ margin: "0 0 8px" }}>
              {t("casesTitle")}
            </h2>
            <p className="muted text-sm" style={{ margin: "0 0 12px" }}>
              {t("casesIntro")}
            </p>
            <ul className="muted text-sm" style={{ margin: 0, paddingLeft: 18 }}>
              <li style={{ marginBottom: 6 }}>{t("casesBullet1")}</li>
              <li style={{ marginBottom: 6 }}>{t("casesBullet2")}</li>
              <li>{t("casesBullet3")}</li>
            </ul>
            <p className="text-sm mt-12 mb-0">
              <Link href="/how-it-works" className="font-medium" style={{ color: "var(--accent)" }}>
                {t("casesHowItWorks")}
              </Link>
            </p>
          </div>
        </div>
      </div>

      <FilterToolbar
        filters={REVIEW_STATUSES}
        active={filter}
        onChange={setFilter}
        counts={toolbarCounts}
        filterLabels={filterLabels}
        totalLabel={t("filterAll")}
        totalCount={totalInQueue}
      />

      <div
        className="page-toolbar"
        style={{ marginTop: 12, marginBottom: 0 }}
      >
        <div className="search-box" style={{ flex: "1 1 220px", maxWidth: 360 }}>
          <Search size={15} className="search-box-icon" aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchAria")}
          />
        </div>
        <span className="page-toolbar-spacer" />
        <label className="flex items-center gap-8 text-sm muted" style={{ flexShrink: 0 }}>
          <span>{t("sortLabel")}</span>
          <select
            className="input text-sm"
            style={{ minWidth: 200, padding: "6px 10px" }}
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label={t("sortLabel")}
          >
            <option value="updatedDesc">{t("sortUpdatedDesc")}</option>
            <option value="updatedAsc">{t("sortUpdatedAsc")}</option>
            <option value="nameAsc">{t("sortNameAsc")}</option>
          </select>
        </label>
      </div>

      <p className="muted text-xs mt-8 mb-12" aria-live="polite">
        {t("resultsLine", { visible: filteredSorted.length, loaded: initialRows.length, total: totalInQueue })}
      </p>

      <section aria-labelledby="review-queue-heading">
        <h2 id="review-queue-heading" className="visually-hidden">
          {t("listHeading")}
        </h2>
        {emptyNoData ? (
          <EmptyState message={t("empty")} />
        ) : emptyAfterFilter ? (
          <EmptyState message={t("emptyFiltered")} />
        ) : (
          <div className="apps-list mt-8">
            {filteredSorted.map((r) => (
              <div key={r.id} className="apps-row flex items-center gap-12 flex-wrap">
                <span className={`status-dot ${statusDotClass(r.status)}`} aria-hidden />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="font-bold">{r.name}</div>
                  <div className="muted text-sm">
                    {formatNodeType(r.type, tNodeType)}
                    {r.region ? ` · ${r.region}` : ""}
                    {r.city ? ` · ${r.city}` : ""}
                    {r.vertical ? ` · ${r.vertical}` : ""}
                  </div>
                  {r.owner?.name || r.owner?.email ? (
                    <div className="muted text-xs mt-4">{r.owner?.name ?? r.owner?.email}</div>
                  ) : null}
                </div>
                <StatusBadge status={r.status} />
                <span className="muted text-xs" suppressHydrationWarning>
                  {format.dateTime(new Date(r.updatedAt), { dateStyle: "medium", timeStyle: "short" })}
                </span>
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
      </section>
    </div>
  );
}
