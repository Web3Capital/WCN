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
};

export function LedgerSpine({ active = null, compact = false, className, labels }: Props) {
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
