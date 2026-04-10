"use client";

import type { ReactNode } from "react";
import Link from "next/link";

interface DetailLayoutProps {
  backHref: string;
  backLabel?: string;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}

export function DetailLayout({ backHref, backLabel, title, subtitle, badge, meta, actions, children }: DetailLayoutProps) {
  return (
    <div className="detail-layout">
      <Link href={backHref} className="detail-back">
        &larr; {backLabel || "Back"}
      </Link>
      <div className="detail-header">
        <div className="detail-header-main">
          <h1 className="detail-title">
            {title}
            {badge && <span className="detail-badge-inline">{badge}</span>}
          </h1>
          {subtitle && <p className="detail-subtitle muted">{subtitle}</p>}
          {meta && <div className="detail-meta">{meta}</div>}
        </div>
        {actions && <div className="detail-actions">{actions}</div>}
      </div>
      <div className="detail-body">{children}</div>
    </div>
  );
}
