import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  message: string;
  action?: ReactNode;
}

export function EmptyState({ icon, message, action }: EmptyStateProps) {
  return (
    <div className="empty-state card">
      {icon && <div className="empty-state-icon">{icon}</div>}
      <p>{message}</p>
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}
