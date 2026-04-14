"use client";

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis,
} from "recharts";
import { useAutoTranslate } from "@/lib/i18n/auto-translate-provider";

/** Pie + legend for arbitrary label → count maps (e.g. status / stage distribution). */
export function DashboardDistributionPie({
  data,
  colorMap,
  emptyLabel,
}: {
  data: Record<string, number>;
  colorMap: Record<string, string>;
  emptyLabel?: string;
}) {
  const { t } = useAutoTranslate();
  const items = Object.entries(data)
    .map(([label, count]) => ({ label, count }))
    .filter((d) => d.count > 0);
  if (items.length === 0) {
    return <p className="muted text-sm">{emptyLabel ?? t("No data yet.")}</p>;
  }

  return (
    <div className="flex items-center gap-16">
      <ResponsiveContainer width={120} height={120}>
        <PieChart>
          <Pie data={items} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={50} innerRadius={24}>
            {items.map((item) => (
              <Cell key={item.label} fill={colorMap[item.label] ?? "#6366f1"} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex-col gap-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-6 text-xs">
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                flexShrink: 0,
                background: colorMap[item.label] ?? "#6366f1",
              }}
            />
            <span className="muted">{item.label.replace(/_/g, " ")}</span>
            <span className="font-semibold" style={{ marginLeft: "auto" }}>{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Horizontal bar chart for ordered keys (pipeline flow counts). */
export function DashboardPipelineBar({
  orderedKeys,
  data,
  palette,
}: {
  orderedKeys: readonly string[];
  data: Record<string, number>;
  palette: readonly string[];
}) {
  const items = orderedKeys.map((k) => ({ stage: k.replace(/_/g, " "), count: data[k] ?? 0 }));
  const total = items.reduce((a, b) => a + b.count, 0);
  if (total === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={44}>
      <BarChart data={items} layout="vertical" barGap={0} barSize={28}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="stage" hide />
        <Tooltip />
        <Bar dataKey="count" radius={[4, 4, 4, 4]}>
          {items.map((item, i) => (
            <Cell key={item.stage} fill={palette[i % palette.length] ?? "#6366f1"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
