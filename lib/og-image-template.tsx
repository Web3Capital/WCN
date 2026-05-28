/**
 * Shared OpenGraph image template.
 *
 * Phase 4 of the marketing redesign (see docs/marketing-redesign.md).
 * Previously all marketing pages shared a single OG image at the layout
 * level — every share card looked identical. Each route now generates its
 * own image, but the visual chrome stays consistent via this template.
 */
import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

export type OgImageOptions = {
  /** Editorial section label (e.g. "Prologue", "About", "Node Network"). */
  eyebrow: string;
  /** Page headline. Renders large and Fraunces-leaning. */
  title: string;
  /** Optional supporting line below the title. */
  description?: string;
};

export function renderOgImage(opts: OgImageOptions) {
  const { eyebrow, title, description } = opts;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background:
            "linear-gradient(135deg, #f8fafc 0%, #e8f0fe 50%, #f0f4ff 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Masthead row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            color: "#5B5FE9",
            fontSize: "18px",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #4F8FF7, #6C5CE7)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: "white",
              fontSize: "20px",
              fontWeight: 800,
            }}
          >
            W³
          </div>
          <span>Web3 Capital Network</span>
          <span style={{ color: "#cbd5e1" }}>·</span>
          <span>{eyebrow}</span>
        </div>

        {/* Title block */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              fontSize: "78px",
              fontWeight: 600,
              lineHeight: 1.04,
              color: "#0a0a0a",
              letterSpacing: "-0.02em",
              maxWidth: "1000px",
            }}
          >
            {title}
          </div>
          {description ? (
            <div
              style={{
                fontSize: "26px",
                color: "#475569",
                maxWidth: "920px",
                lineHeight: 1.45,
              }}
            >
              {description}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            color: "#94a3b8",
            fontSize: "16px",
            letterSpacing: "0.04em",
          }}
        >
          <span>wcn.network</span>
          <span>·</span>
          <span>Volume · MMXXVI</span>
        </div>
      </div>
    ),
    { ...ogSize },
  );
}
