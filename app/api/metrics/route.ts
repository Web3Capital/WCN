import "@/lib/core/init";
import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { metrics } from "@/lib/core/metrics";

export const dynamic = "force-dynamic";

function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function GET(req: Request) {
  const secret = new URL(req.url).searchParams.get("secret");
  const validSecret = process.env.METRICS_SECRET || process.env.CRON_SECRET;

  if (!validSecret || !secret || !constantTimeEquals(secret, validSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const snapshot = metrics.snapshot();

  const lines: string[] = [];

  for (const counter of snapshot.counters) {
    const labelStr = Object.entries(counter.labels)
      .map(([k, v]) => `${k}="${v}"`)
      .join(",");
    lines.push(`${counter.name}{${labelStr}} ${counter.value}`);
  }

  for (const hist of snapshot.histograms) {
    const labelStr = Object.entries(hist.labels)
      .map(([k, v]) => `${k}="${v}"`)
      .join(",");
    lines.push(`${hist.name}_count{${labelStr}} ${hist.count}`);
    lines.push(`${hist.name}_sum{${labelStr}} ${hist.sum}`);
  }

  return new NextResponse(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
