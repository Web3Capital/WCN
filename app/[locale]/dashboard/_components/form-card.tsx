"use client";

import type { ReactNode } from "react";
import { useAutoTranslate } from "@/lib/i18n/auto-translate-provider";

interface FormCardProps {
  open: boolean;
  onToggle: () => void;
  triggerLabel?: string;
  cancelLabel?: string;
  children: ReactNode;
}

export function FormCard({ open, onToggle, triggerLabel, cancelLabel, children }: FormCardProps) {
  const { t } = useAutoTranslate();
  return (
    <>
      <div className="form-card-trigger">
        <button className="button" onClick={onToggle}>
          {open ? (cancelLabel ?? t("Cancel")) : (triggerLabel ?? t("New"))}
        </button>
      </div>
      {open && <div className="form-card card">{children}</div>}
    </>
  );
}
