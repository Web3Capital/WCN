"use client";

interface FilterToolbarProps<T extends string> {
  filters: readonly T[];
  active: T;
  onChange: (value: T) => void;
  counts?: Partial<Record<T, number>>;
  totalLabel?: string;
  totalCount?: number;
}

export function FilterToolbar<T extends string>({
  filters,
  active,
  onChange,
  counts,
  totalLabel = "All",
  totalCount,
}: FilterToolbarProps<T>) {
  return (
    <div className="page-toolbar">
      <div className="chip-group">
        {filters.map((f) => {
          const isAll = f === "ALL";
          const label = isAll ? totalLabel : f.replace(/_/g, " ");
          const count = isAll ? totalCount : counts?.[f];
          return (
            <button
              key={f}
              className={`chip ${active === f ? "chip-active" : ""}`}
              onClick={() => onChange(f)}
            >
              {label}{count !== undefined ? ` (${count})` : ""}
            </button>
          );
        })}
      </div>
    </div>
  );
}
