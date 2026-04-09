import React from "react";

export function Steps({ children }: { children: React.ReactNode }) {
  return <div className="docs-steps">{children}</div>;
}

export function Step({
  number,
  title,
  children,
}: {
  number?: number;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="docs-step">
      {number != null && <span className="docs-step-num">{number}</span>}
      <div className="docs-step-body">
        <strong className="docs-step-title">{title}</strong>
        {children && <div className="docs-step-desc">{children}</div>}
      </div>
    </div>
  );
}
