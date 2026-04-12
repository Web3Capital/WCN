import React from "react";
import {
  Ban, HelpCircle, Pause, Clock, Hourglass, Play,
  ArrowUp, ArrowDown, XCircle, Undo2, BadgeCheck,
  Armchair, ChevronRight,
} from "lucide-react";

const ICON_MAP: Record<string, React.ReactNode> = {
  ban:          <Ban size={16} strokeWidth={1.5} />,
  "help-circle": <HelpCircle size={16} strokeWidth={1.5} />,
  pause:        <Pause size={16} strokeWidth={1.5} />,
  clock:        <Clock size={16} strokeWidth={1.5} />,
  hourglass:    <Hourglass size={16} strokeWidth={1.5} />,
  play:         <Play size={16} strokeWidth={1.5} />,
  "arrow-up":   <ArrowUp size={16} strokeWidth={1.5} />,
  "arrow-down": <ArrowDown size={16} strokeWidth={1.5} />,
  "x-circle":   <XCircle size={16} strokeWidth={1.5} />,
  undo:         <Undo2 size={16} strokeWidth={1.5} />,
  "id-card":    <BadgeCheck size={16} strokeWidth={1.5} />,
  armchair:     <Armchair size={16} strokeWidth={1.5} />,
  chevron:      <ChevronRight size={16} strokeWidth={1.5} />,
};

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
  const resolved = icon ? ICON_MAP[icon] : null;
  return (
    <Tag className="docs-card" {...(href ? { href } : {})}>
      {resolved && <span className="docs-card-icon">{resolved}</span>}
      <strong className="docs-card-title">{title}</strong>
      {body && <span className="docs-card-desc">{body}</span>}
    </Tag>
  );
}
