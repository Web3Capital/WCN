import type { ReactNode } from "react";

/**
 * Capital dashboard note patterns: inset read-only block, feed list (Activity-style),
 * and a compact composer row. Matches `/dashboard/capital/[id]` profile cards and
 * `label.field` / `card p-18` conventions.
 */

/** Inside another card — top border + muted label + pre-wrap (Capital Operational Profile). */
export function CapitalNotesReadonlyInset({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="mt-12" style={{ borderTop: "1px solid var(--line)", paddingTop: 12 }}>
      <span className="muted">{label}</span>
      <div className="mt-4 mb-0 text-base" style={{ whiteSpace: "pre-wrap" }}>
        {children}
      </div>
    </div>
  );
}

export type CapitalNoteFeedItem = {
  id: string;
  body: ReactNode;
  meta: ReactNode;
};

/** Chronological entries — left border strip like Activity / audit lines (not timeline dots). */
export function CapitalNotesFeed({ items, empty }: { items: CapitalNoteFeedItem[]; empty?: ReactNode }) {
  if (items.length === 0) {
    return empty ? <>{empty}</> : null;
  }
  return (
    <div className="flex-col gap-10">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-start gap-8 text-sm"
          style={{ borderLeft: "2px solid var(--line)", paddingLeft: 12 }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="text-base" style={{ whiteSpace: "pre-wrap" }}>
              {item.body}
            </div>
            <div className="muted text-xs mt-4">{item.meta}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Single-line add + button — aligns with Capital admin row density. */
export function CapitalNotesComposerRow({
  value,
  onChange,
  onSubmit,
  placeholder,
  submitLabel,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  placeholder: string;
  submitLabel: string;
  disabled?: boolean;
}) {
  const canSubmit = !disabled && value.trim().length > 0;
  return (
    <div className="flex gap-8 flex-wrap items-stretch mb-16">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (canSubmit) onSubmit();
          }
        }}
        placeholder={placeholder}
        style={{ flex: 1, minWidth: 220 }}
      />
      <button type="button" className="button-secondary" onClick={onSubmit} disabled={!canSubmit}>
        {submitLabel}
      </button>
    </div>
  );
}
