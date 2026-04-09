"use client";

import React from "react";

const ICONS: Record<string, string> = {
  info: "ℹ",
  warning: "⚠",
  tip: "💡",
  danger: "🚨",
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
