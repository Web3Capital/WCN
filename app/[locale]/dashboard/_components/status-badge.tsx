import { colorForStatus } from "@/components/console-kit/badge-colors";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const color = colorForStatus(status);
  return <span className={`badge ${color} ${className ?? ""}`.trim()}>{status.replace(/_/g, " ")}</span>;
}
