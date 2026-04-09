import React from "react";

export function Hero({
  badge,
  lead,
  children,
}: {
  badge?: string;
  lead?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="docs-hero">
      {badge && <span className="docs-hero-badge">{badge}</span>}
      <div className="docs-hero-title">{children}</div>
      {lead && <p className="docs-hero-lead">{lead}</p>}
    </div>
  );
}
