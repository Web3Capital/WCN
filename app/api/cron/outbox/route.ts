/**
 * Outbox dispatcher cron — runs every 5 min via vercel.json.
 *
 * Picks up undelivered outbox events written transactionally by mutation
 * use-cases (e.g. `lib/use-cases/approve-application.ts`) and emits them
 * to the in-process event bus. Failed dispatches accumulate retry count;
 * events at retryCount >= DLQ_THRESHOLD are surfaced as DLQ depth and
 * skipped by the poller.
 *
 * Auth: Bearer token comparing CRON_SECRET (matches existing
 * `/api/cron/route.ts` pattern; Vercel cron sends this header).
 *
 * Why a dedicated route in addition to the existing daily `/api/cron`:
 *   - Daily latency is too slow for outbox-driven UX (notifications,
 *     reputation updates). 5-min target latency requires its own schedule.
 *   - Daily cron continues to call processOutbox as a backstop and runs
 *     the weekly cleanup pass.
 */
import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { processOutbox, getOutboxMetrics } from "@/lib/core/outbox";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  if (!process.env.CRON_SECRET || !safeCompare(secret, process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();

  try {
    const result = await processOutbox(100);
    const health = await getOutboxMetrics();

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      processed: result,
      health: {
        pendingCount: health.pendingCount,
        dlqDepth: health.dlqDepth,
        oldestPendingAge: health.oldestPending
          ? `${Math.round((Date.now() - health.oldestPending.getTime()) / 1000)}s`
          : null,
      },
    });
  } catch (e) {
    console.error("[Cron] Outbox dispatch failed:", e);
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
