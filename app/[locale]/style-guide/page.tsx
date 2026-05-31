import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import type { CSSProperties, ReactNode } from "react";

// WS · Living Style Guide — the in-app counterpart to WCN/Design-System/Web-System.
// Renders the REAL tokens and bespoke component classes from app/globals.css, so it
// can never drift from the implementation. Source of truth: wcn-web-tokens.v1.json.
export const metadata: Metadata = {
  title: "Style Guide · WCN Web System",
  description:
    "Living style guide for wcn.network — design tokens, typography, and components rendered from the real implementation.",
  robots: { index: false, follow: false },
};

type Params = { locale: string };

type Swatch = { name: string; varName: string; note?: string; onDark?: boolean };

const surfaces: Swatch[] = [
  { name: "bg", varName: "--bg", note: "页背景" },
  { name: "bg-elev", varName: "--bg-elev", note: "抬升背景" },
  { name: "card", varName: "--card", note: "卡片面" },
  { name: "surface-tint", varName: "--surface-tint", note: "微染" },
];

const text: Swatch[] = [
  { name: "text", varName: "--text", note: "正文", onDark: true },
  { name: "text-2", varName: "--text-2", note: "次级", onDark: true },
  { name: "muted", varName: "--muted", note: "辅助", onDark: true },
  { name: "line-strong", varName: "--line-strong", note: "强边框" },
];

const brand: Swatch[] = [
  { name: "accent (ink)", varName: "--accent", note: "主交互 · Decision A", onDark: true },
  { name: "authority (bronze)", varName: "--authority", note: "仅 data-authority", onDark: true },
];

const signal: Swatch[] = [
  { name: "signal-success", varName: "--signal-success", note: "成功", onDark: true },
  { name: "signal-warning", varName: "--signal-warning", note: "警示", onDark: true },
  { name: "signal-danger", varName: "--signal-danger", note: "危险", onDark: true },
  { name: "signal-info (voltage)", varName: "--signal-info", note: "信息 · voltage 仅此", onDark: true },
];

const dataViz: Swatch[] = [
  { name: "ledger-node", varName: "--ledger-node", note: "Registry", onDark: true },
  { name: "ledger-deal", varName: "--ledger-deal", note: "Capital", onDark: true },
  { name: "ledger-settle", varName: "--ledger-settle", note: "Settlement", onDark: true },
];

const typeScale: { name: string; varName: string }[] = [
  { name: "display", varName: "--type-display" },
  { name: "3xl", varName: "--type-3xl" },
  { name: "2xl", varName: "--type-2xl" },
  { name: "xl", varName: "--type-xl" },
  { name: "lg", varName: "--type-lg" },
  { name: "md", varName: "--type-md" },
  { name: "base", varName: "--type-base" },
  { name: "sm", varName: "--type-sm" },
];

function SwatchGrid({ items }: { items: Swatch[] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
        gap: 12,
        margin: "12px 0 28px",
      }}
    >
      {items.map((s) => (
        <div
          key={s.varName}
          style={{
            border: "1px solid var(--line)",
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
            background: "var(--card)",
          }}
        >
          <div
            style={
              {
                height: 64,
                background: `var(${s.varName})`,
                color: s.onDark ? "var(--bg)" : "var(--text)",
                display: "flex",
                alignItems: "flex-end",
                padding: 8,
                fontFamily: "var(--font-mono)",
                fontSize: 10,
              } as CSSProperties
            }
          >
            {s.varName}
          </div>
          <div style={{ padding: "8px 10px" }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{s.name}</div>
            {s.note ? (
              <div style={{ fontSize: 11, color: "var(--muted)" }}>{s.note}</div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function H2({ children, n }: { children: ReactNode; n: string }) {
  return (
    <div style={{ marginTop: 44 }}>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--authority)",
          marginBottom: 6,
        }}
      >
        {n}
      </div>
      <h2 style={{ fontFamily: "var(--font-serif)", fontWeight: 400, fontSize: 30, margin: 0 }}>
        {children}
      </h2>
    </div>
  );
}

export default async function StyleGuidePage({ params }: { params: Promise<Params> }) {
  setRequestLocale((await params).locale);

  return (
    <main
      style={{
        maxWidth: "var(--max)",
        margin: "0 auto",
        padding: "64px 24px 120px",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--muted)",
          marginBottom: 16,
        }}
      >
        WCN Web System · Living Style Guide · Anno MMXXVI
      </div>
      <h1
        style={{
          fontFamily: "var(--font-serif)",
          fontWeight: 700,
          fontSize: "clamp(40px, 6vw, 68px)",
          lineHeight: 1.04,
          letterSpacing: "-0.03em",
          margin: "0 0 14px",
        }}
      >
        网站系统 · 活样板
      </h1>
      <p style={{ color: "var(--muted)", maxWidth: 600, fontSize: 17 }}>
        本页用 <code>app/globals.css</code> 的真实令牌与组件类渲染,与实现永不漂移——
        是 <code>WCN/Design-System/Web-System/</code> 文档的代码对照物。色彩走 Decision A:
        古铜威权 + 墨黑交互。切换系统明暗即见整体翻转。
      </p>

      <H2 n="№ 01 — Surfaces & Text">表面与文字</H2>
      <SwatchGrid items={surfaces} />
      <SwatchGrid items={text} />

      <H2 n="№ 02 — Brand · Decision A">品牌色(古铜 + 墨黑)</H2>
      <SwatchGrid items={brand} />

      <H2 n="№ 03 — Signal (4-state)">信号四态</H2>
      <SwatchGrid items={signal} />

      <H2 n="№ 04 — Data-viz (dashboard only)">数据色板(仅 dashboard 作用域)</H2>
      <SwatchGrid items={dataViz} />

      <H2 n="№ 05 — Type Scale">字阶</H2>
      <div style={{ margin: "12px 0 28px" }}>
        {typeScale.map((t) => (
          <div
            key={t.varName}
            style={{ display: "flex", alignItems: "baseline", gap: 16, borderBottom: "1px solid var(--line)", padding: "10px 0" }}
          >
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", width: 110 }}>
              {t.name}
            </span>
            <span
              style={
                {
                  fontFamily: "var(--font-serif)",
                  fontSize: `var(${t.varName})`,
                  lineHeight: 1.05,
                } as CSSProperties
              }
            >
              凭据 Proof
            </span>
          </div>
        ))}
      </div>

      <H2 n="№ 06 — Buttons">按钮</H2>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center", margin: "12px 0 28px" }}>
        <button className="button" type="button">Primary 主操作</button>
        <button className="button button-secondary" type="button">Secondary</button>
        <button className="button button-ghost" type="button">Ghost</button>
        <button className="button button-sm" type="button">Small</button>
        <button className="button button-lg" type="button">Large</button>
      </div>

      <H2 n="№ 07 — Badges">徽章</H2>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", margin: "12px 0 28px" }}>
        <span className="badge badge-green">Settled</span>
        <span className="badge badge-amber">Pending</span>
        <span className="badge badge-red">Flagged</span>
        <span className="badge badge-accent">Info</span>
        <span className="badge" data-authority="sealed">★ Sealed</span>
      </div>

      <H2 n="№ 08 — Card & Field">卡片与字段</H2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, margin: "12px 0 28px" }}>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>NODE-CTRY-SG-001</div>
          <div style={{ fontWeight: 700, fontSize: 16, marginTop: 4 }}>普通卡片</div>
          <p style={{ fontSize: 13, color: "var(--muted)", margin: "8px 0 0" }}>默认线条边框。</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)" }}>
            Input
          </label>
          <input
            type="text"
            defaultValue="聚焦看古铜环"
            style={{
              border: "1px solid var(--line-strong)",
              background: "var(--card)",
              color: "var(--text)",
              padding: "10px 12px",
              borderRadius: "var(--radius-sm)",
              minHeight: 44,
              fontSize: 14,
            }}
          />
        </div>
      </div>

      <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", marginTop: 40, borderTop: "1px solid var(--line)", paddingTop: 18 }}>
        真源 wcn-web-tokens.v1.json · 承接 wcn-design-tokens.v4.sovereign.json · 文档 WCN/Design-System/Web-System/WS-00_Index.html
      </p>
    </main>
  );
}
