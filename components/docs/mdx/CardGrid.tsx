import React from "react";

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
}: {
  title: string;
  description: string;
  icon?: string;
  href?: string;
}) {
  const Tag = href ? "a" : "div";
  return (
    <Tag className="docs-card" {...(href ? { href } : {})}>
      {icon && <span className="docs-card-icon">{icon}</span>}
      <strong className="docs-card-title">{title}</strong>
      <span className="docs-card-desc">{description}</span>
    </Tag>
  );
}
