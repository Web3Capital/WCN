/** Quick single-line composer — density aligned with Project admin rows. */
export function NoteComposerRow({
  value,
  onChange,
  onSubmit,
  placeholder,
  submitLabel,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  placeholder: string;
  submitLabel: string;
  disabled?: boolean;
}) {
  const canSubmit = !disabled && value.trim().length > 0;
  return (
    <div className="flex gap-8 flex-wrap items-stretch mb-16">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (canSubmit) onSubmit();
          }
        }}
        placeholder={placeholder}
        style={{ flex: 1, minWidth: 220 }}
      />
      <button type="button" className="button-secondary" onClick={onSubmit} disabled={!canSubmit}>
        {submitLabel}
      </button>
    </div>
  );
}
