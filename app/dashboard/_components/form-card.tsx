"use client";

import type { ReactNode } from "react";

interface FormCardProps {
  open: boolean;
  onToggle: () => void;
  triggerLabel?: string;
  children: ReactNode;
}

export function FormCard({ open, onToggle, triggerLabel = "New", children }: FormCardProps) {
  return (
    <>
      <div className="form-card-trigger">
        <button className="button" onClick={onToggle}>
          {open ? "Cancel" : triggerLabel}
        </button>
      </div>
      {open && <div className="form-card card">{children}</div>}
    </>
  );
}
