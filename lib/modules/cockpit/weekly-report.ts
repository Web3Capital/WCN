import type { PrismaClient } from "@prisma/client";

export type TimeSeriesPoint = { week: string; count: number };
export type FunnelStage = { stage: string; count: number };
export type AnomalyAlert = { metric: string; current: number; average: number; deviation: number };

export async function getWeeklyTimeSeries(
  prisma: PrismaClient,
  weeks = 12,
): Promise<{
  deals: TimeSeriesPoint[];
  pob: TimeSeriesPoint[];
  evidence: TimeSeriesPoint[];
  tasks: TimeSeriesPoint[];
}> {
  const since = new Date();
  since.setDate(since.getDate() - weeks * 7);

  const [deals, pob, evidence, tasks] = await Promise.all([
    prisma.deal.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.poBRecord.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.evidence.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.task.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
  ]);

  function bucketize(items: { createdAt: Date }[]): TimeSeriesPoint[] {
    const buckets = new Map<string, number>();
    for (let i = 0; i < weeks; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i * 7);
      const key = d.toISOString().slice(0, 10);
      buckets.set(key, 0);
    }
    for (const item of items) {
      const key = item.createdAt.toISOString().slice(0, 10);
      const weekStart = [...buckets.keys()].reverse().find((k) => k <= key);
      if (weekStart) buckets.set(weekStart, (buckets.get(weekStart) ?? 0) + 1);
    }
    return [...buckets.entries()]
      .map(([week, count]) => ({ week, count }))
      .reverse();
  }

  return {
    deals: bucketize(deals),
    pob: bucketize(pob),
    evidence: bucketize(evidence),
    tasks: bucketize(tasks),
  };
}

export async function getFunnelData(prisma: PrismaClient): Promise<FunnelStage[]> {
  const [projects, matches, deals, funded] = await Promise.all([
    prisma.project.count({ where: { status: { not: "DRAFT" } } }),
    prisma.match.count(),
    prisma.deal.count(),
    prisma.deal.count({ where: { stage: "FUNDED" } }),
  ]);

  return [
    { stage: "Projects", count: projects },
    { stage: "Matches", count: matches },
    { stage: "Deals", count: deals },
    { stage: "Funded", count: funded },
  ];
}

export function detectAnomalies(
  timeSeries: TimeSeriesPoint[],
  metricName: string,
): AnomalyAlert | null {
  if (timeSeries.length < 5) return null;

  const recent = timeSeries.slice(-4);
  const values = recent.map((p) => p.count);
  const avg = values.reduce((s, v) => s + v, 0) / values.length;
  const stdDev = Math.sqrt(values.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / values.length);

  const current = timeSeries[timeSeries.length - 1].count;

  if (stdDev > 0 && Math.abs(current - avg) > 2 * stdDev) {
    return {
      metric: metricName,
      current,
      average: Math.round(avg * 10) / 10,
      deviation: Math.round(((current - avg) / stdDev) * 10) / 10,
    };
  }
  return null;
}
