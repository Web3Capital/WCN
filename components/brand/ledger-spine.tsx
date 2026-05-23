"use client";

type Props = {
  active?: "node" | "deal" | "settle" | null;
  compact?: boolean;
  className?: string;
  labels?: {
    node?: string;
    deal?: string;
    settle?: string;
  };
  /**
   * When true (default), the spine participates in the global scroll-reveal
   * sequence: dots ignite one-by-one (node → deal → settle, 220ms apart)
   * when the spine enters the viewport. Set to false for spines used as
   * static legends inside dashboards where the ignition would be noise.
   */
  ignite?: boolean;
};

export function LedgerSpine({
  active = null,
  compact = false,
  className,
  labels,
  ignite = true,
}: Props) {
  const items = [
    { key: "node", label: labels?.node ?? "Node", color: "var(--ledger-node)" },
    { key: "deal", label: labels?.deal ?? "Deal", color: "var(--ledger-deal)" },
    { key: "settle", label: labels?.settle ?? "Settle", color: "var(--ledger-settle)" },
  ] as const;

  return (
    <div
      className={`ledger-spine${compact ? " ledger-spine-compact" : ""}${className ? " " + className : ""}`}
      role="navigation"
      aria-label="Three-ledger map"
      {...(ignite ? { "data-reveal": "fade" } : {})}
    >
      {items.map((item, i) => (
        <div key={item.key} className="ledger-spine-step" data-active={active === item.key}>
          <span
            className="ledger-spine-dot"
            style={{ "--dot-color": item.color } as React.CSSProperties}
            aria-hidden
          />
          {!compact && <span className="ledger-spine-label">{item.label}</span>}
          {i < items.length - 1 && (
            <span className="ledger-spine-rail" aria-hidden>
              <span className="ledger-spine-rail-fill" />
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
