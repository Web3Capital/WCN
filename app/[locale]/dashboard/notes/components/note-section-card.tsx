import type { CSSProperties, ReactNode } from "react";
import type { NoteSectionVariant } from "../types";

const VARIANT_CLASS: Record<NoteSectionVariant, string> = {
  /** Matches Project Files / Tasks / Evidence sections */
  glass: "card-glass p-18 reveal",
  /** Matches Project admin `card p-18` (no glass) */
  solid: "card p-18 reveal",
  /** Amber accent border — same as Project Admin Panel */
  admin: "card p-18 reveal",
};

const ADMIN_STYLE = { borderLeft: "3px solid var(--amber)" } as const;

/**
 * Section shell parallel to `/dashboard/projects/[id]/ui` blocks:
 * - `glass`: default content sections
 * - `solid`: dense / communication-style cards
 * - `admin`: optional amber left rule like Project admin panel
 */
export function NoteSectionCard({
  title,
  count,
  icon,
  children,
  variant = "glass",
  className,
  style,
  headerRight,
}: {
  title: ReactNode;
  count?: number;
  icon?: ReactNode;
  children: ReactNode;
  variant?: NoteSectionVariant;
  /** Extra classes e.g. `reveal-delay-3` */
  className?: string;
  style?: CSSProperties;
  headerRight?: ReactNode;
}) {
  const base = VARIANT_CLASS[variant];
  const mergedStyle = variant === "admin" ? { ...ADMIN_STYLE, ...style } : style;
  return (
    <div className={[base, className].filter(Boolean).join(" ")} style={mergedStyle}>
      <div className="flex items-center justify-between mb-12 gap-8 flex-wrap">
        <div className="flex items-center gap-8 min-w-0">
          {icon}
          <h3 className="mt-0 mb-0">
            {title}
            {count !== undefined ? ` (${count})` : ""}
          </h3>
        </div>
        {headerRight}
      </div>
      {children}
    </div>
  );
}
