import type { ReactNode } from "react";
import type { NoteFeedItem } from "../types";

/** Chronological entries — left border strip (same as Project Activity, not timeline dots). */
export function NoteFeed({ items, empty }: { items: NoteFeedItem[]; empty?: ReactNode }) {
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
