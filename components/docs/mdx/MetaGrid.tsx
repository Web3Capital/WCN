import React from "react";

export function MetaGrid({ children }: { children: React.ReactNode }) {
  return <div className="docs-meta-grid">{children}</div>;
}

export function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="docs-meta-item">
      <span className="docs-meta-label">{label}</span>
      <span className="docs-meta-value">{value}</span>
    </div>
  );
}
