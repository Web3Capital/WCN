import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  message: string;
  title?: string;
  eyebrow?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, message, title, eyebrow, action }: EmptyStateProps) {
  return (
    <div className="empty-state card">
      {icon && <div className="empty-state-icon-wrap">{icon}</div>}
      {eyebrow && <p className="empty-state-mono">{eyebrow}</p>}
      {title && <h3 className="empty-state-title">{title}</h3>}
      <p>{message}</p>
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}
