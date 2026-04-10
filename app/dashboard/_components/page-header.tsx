"use client";

import type { ReactNode } from "react";
import Link from "next/link";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
  eyebrow?: string;
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
