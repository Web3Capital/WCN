import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Web3 Capital Network — The Business Network for Web3 and AI";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #f8fafc 0%, #e8f0fe 50%, #f0f4ff 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "18px",
              background: "linear-gradient(135deg, #4F8FF7, #6C5CE7)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: "white",
              fontSize: "32px",
              fontWeight: 800,
            }}
          >
            W³
          </div>
          <span style={{ fontSize: "42px", fontWeight: 800, color: "#0a0a0a" }}>
            Web3 Capital Network
          </span>
        </div>
        <div
          style={{
            fontSize: "24px",
            color: "#555",
            maxWidth: "700px",
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          The business network for Web3 and AI — connecting capital, projects,
          and services with verified proof and fair settlement.
        </div>
        <div
          style={{
            marginTop: "40px",
            fontSize: "16px",
            color: "#999",
            letterSpacing: "0.5px",
          }}
        >
          wcn.network
        </div>
      </div>
    ),
    { ...size },
  );
}
