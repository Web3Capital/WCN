import React from "react";

export function Statement({ children }: { children: React.ReactNode }) {
  return <blockquote className="docs-statement">{children}</blockquote>;
}
