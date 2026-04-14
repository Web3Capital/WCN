"use client";

import { useAutoTranslate } from "@/lib/i18n/auto-translate-provider";

/** Capital-style amber inline notice (member / non-editing contexts). */
export function ReadOnlyInlineStrip() {
  const { t } = useAutoTranslate();
  return (
    <div
      className="card mb-16"
      style={{
        padding: "10px 14px",
        background: "var(--amber-bg)",
        border: "1px solid color-mix(in oklab, var(--amber) 25%, transparent)",
      }}
    >
      <p className="muted text-sm" style={{ margin: 0 }}>
        {t("Read-only view. Contact admin for changes.")}
      </p>
    </div>
  );
}
