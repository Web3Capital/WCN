import type { ChangeEvent, FocusEvent, ReactNode } from "react";

/**
 * `label.field` + multiline note — mirrors Project detail Admin Panel internal notes.
 * Supports controlled (`value` + `onChange`) or uncontrolled (`defaultValue` + `onBlur`).
 */
export function InternalNoteField({
  label,
  defaultValue,
  value,
  onBlur,
  onChange,
  placeholder,
  disabled,
  hint,
  error,
  rows = 4,
  className,
}: {
  label: ReactNode;
  defaultValue?: string;
  value?: string;
  /** Fires with the current textarea value (controlled and uncontrolled). */
  onBlur?: (value: string) => void;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  rows?: number;
  className?: string;
}) {
  const controlled = value !== undefined;
  return (
    <label className={["field", className].filter(Boolean).join(" ")}>
      <span className="label">{label}</span>
      <textarea
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        {...(controlled
          ? {
              value,
              onChange: (e: ChangeEvent<HTMLTextAreaElement>) => onChange?.(e.target.value),
              onBlur: (e: FocusEvent<HTMLTextAreaElement>) => onBlur?.(e.target.value),
            }
          : { defaultValue, onBlur: (e: FocusEvent<HTMLTextAreaElement>) => onBlur?.(e.target.value) })}
      />
      {hint ? <p className="muted mt-4 mb-0 text-sm">{hint}</p> : null}
      {error ? <p className="form-error mt-10">{error}</p> : null}
    </label>
  );
}
