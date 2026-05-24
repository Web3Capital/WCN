import type { ReactNode } from "react";
import { Link } from "@/i18n/routing";

interface PageHeaderProps {
  /** Renders as `<h1>`. Accepts any ReactNode so callers can pass plain
   *  strings, `t("key")` results, or legacy `<T>...</T>` wrappers. */
  title: ReactNode;
  /** Secondary muted line under the title. */
  subtitle?: ReactNode;
  backHref?: string;
  backLabel?: ReactNode;
  /** Renders to the right of the title row (CTA buttons, filters, etc.). */
  actions?: ReactNode;
  /** Small uppercase kicker rendered above the title (section name). */
  eyebrow?: ReactNode;
}

export function PageHeader({ title, subtitle, backHref, backLabel, actions, eyebrow }: PageHeaderProps) {
  return (
    <div className="page-header-block">
      {backHref && (
        <Link href={backHref} className="page-header-back">
          &larr; {backLabel || "Back"}
        </Link>
      )}
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <div className="page-header-row">
        <div>
          <h1 className="page-header-title">{title}</h1>
          {subtitle && <p className="page-header-subtitle muted">{subtitle}</p>}
        </div>
        {actions && <div className="page-header-actions">{actions}</div>}
      </div>
    </div>
  );
}
