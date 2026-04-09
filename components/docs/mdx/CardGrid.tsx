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
  return (
    <Tag className="docs-card" {...(href ? { href } : {})}>
      {icon && <span className="docs-card-icon">{icon}</span>}
      <strong className="docs-card-title">{title}</strong>
      {body && <span className="docs-card-desc">{body}</span>}
    </Tag>
  );
}
