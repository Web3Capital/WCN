"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
  withInput?: boolean;
  inputLabel?: string;
  inputPlaceholder?: string;
  onConfirm: (value?: string) => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  withInput = false,
  inputLabel,
  inputPlaceholder,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [value, setValue] = useState("");
  const overlayRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setValue("");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter" && !withInput) onConfirm();
      if (e.key === "Enter" && withInput && value.trim()) onConfirm(value.trim());
    },
    [onCancel, onConfirm, withInput, value]
  );

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="modal-overlay"
      onClick={(e) => { if (e.target === overlayRef.current) onCancel(); }}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="modal">
        <div className="modal-header">
          <h3>{title}</h3>
          <button
            type="button"
            onClick={onCancel}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 18, lineHeight: 1, padding: 4 }}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="modal-body">
          {description && <p style={{ margin: "0 0 12px", fontSize: 14, color: "var(--muted)" }}>{description}</p>}
          {withInput && (
            <div className="field">
              {inputLabel && <label className="label">{inputLabel}</label>}
              <input
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={inputPlaceholder}
              />
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button type="button" className="button-secondary" onClick={onCancel} style={{ padding: "8px 16px", fontSize: 13, borderRadius: 999 }}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className="button"
            onClick={() => onConfirm(withInput ? value.trim() : undefined)}
            disabled={withInput && !value.trim()}
            style={{
              padding: "8px 16px",
              fontSize: 13,
              borderRadius: 999,
              ...(variant === "danger" ? { background: "var(--red)" } : {}),
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
