import type { ReactNode } from "react";

/** Inset under another card — top rule + muted label + pre-wrap (Project admin / Capital profile pattern). */
export function NoteReadonlyInset({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="mt-12" style={{ borderTop: "1px solid var(--line)", paddingTop: 12 }}>
      <span className="muted">{label}</span>
      <div className="mt-4 mb-0 text-base" style={{ whiteSpace: "pre-wrap" }}>
        {children}
      </div>
    </div>
  );
}
