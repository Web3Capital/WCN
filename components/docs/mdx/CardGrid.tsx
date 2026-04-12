import React from "react";
import { icons as lucideIcons } from "lucide-react";

function kebabToPascal(str: string): string {
  return str.split("-").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join("");
}

function resolveIcon(name: string): React.ReactNode | null {
  const base = name.includes("-to-") ? name.split("-to-")[0] : name;
  const key = kebabToPascal(base);
  const Icon = (lucideIcons as Record<string, React.ComponentType<{ size?: number; strokeWidth?: number }>>)[key];
  if (!Icon) return null;
  return <Icon size={16} strokeWidth={1.5} />;
}

export function CardGrid({
  cols = 2,
  children,
}: {
  cols?: 2 | 3 | 4;
  children: React.ReactNode;
}) {
  return (
    <div className="docs-card-grid" data-cols={cols}>
      {children}
    </div>
  );
}

export function Card({
  title,
  description,
  icon,
  href,
  children,
}: {
  title: string;
  description?: string;
  icon?: string;
  href?: string;
  children?: React.ReactNode;
}) {
  const Tag = href ? "a" : "div";
  const body = children ?? description;
  const resolved = icon ? resolveIcon(icon) : null;
  return (
    <Tag className="docs-card" {...(href ? { href } : {})}>
      <span className="docs-card-header">
        {resolved && <span className="docs-card-icon">{resolved}</span>}
        <strong className="docs-card-title">{title}</strong>
      </span>
      {body && <span className="docs-card-desc">{body}</span>}
    </Tag>
  );
}
