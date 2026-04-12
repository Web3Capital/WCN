"use client";

import React from "react";
import { Info, AlertTriangle, Lightbulb, AlertOctagon } from "lucide-react";

const ICONS: Record<string, React.ReactNode> = {
  info: <Info size={16} strokeWidth={2} />,
  warning: <AlertTriangle size={16} strokeWidth={2} />,
  tip: <Lightbulb size={16} strokeWidth={2} />,
  danger: <AlertOctagon size={16} strokeWidth={2} />,
};

export function Callout({
  type = "info",
  children,
}: {
  type?: "info" | "warning" | "tip" | "danger";
  children: React.ReactNode;
}) {
  return (
    <div className={`docs-callout docs-callout-${type}`} role="note">
      <span className="docs-callout-icon">{ICONS[type]}</span>
      <div className="docs-callout-body">{children}</div>
    </div>
  );
}
