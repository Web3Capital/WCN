"use client";

import React, { useState, Children, isValidElement } from "react";

export function Tabs({ children }: { children: React.ReactNode }) {
  const tabs = Children.toArray(children).filter(
    (c) => isValidElement(c) && (c as React.ReactElement<{ label?: string }>).props.label
  ) as React.ReactElement<{ label: string }>[];

  const [active, setActive] = useState(0);

  return (
    <div className="docs-tabs">
      <div className="docs-tabs-bar" role="tablist">
        {tabs.map((tab, i) => (
          <button
            key={i}
            role="tab"
            className={`docs-tabs-trigger${i === active ? " active" : ""}`}
            aria-selected={i === active}
            onClick={() => setActive(i)}
          >
            {tab.props.label}
          </button>
        ))}
      </div>
      <div className="docs-tabs-panel" role="tabpanel">
        {tabs[active]}
      </div>
    </div>
  );
}

export function Tab({
  label: _label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
