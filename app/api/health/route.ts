import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { eventBus } from "@/lib/core/event-bus";
import { metrics } from "@/lib/core/metrics";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const startedAt = Date.now();

export async function GET() {
  const checks: Record<string, { status: string; latencyMs?: number; error?: string }> = {};

  // Database check
  try {
    const start = Date.now();
    const prisma = getPrisma();
    await prisma.$queryRawUnsafe("SELECT 1");
    checks.database = { status: "ok", latencyMs: Date.now() - start };
  } catch (e) {
    checks.database = { status: "error", error: e instanceof Error ? e.message : "Unknown" };
  }

  // Redis check (optional)
  try {
    const { getRedis } = await import("@/lib/redis");
    const redis = getRedis();
    if (redis) {
      const start = Date.now();
      await redis.ping();
      checks.redis = { status: "ok", latencyMs: Date.now() - start };
    } else {
      checks.redis = { status: "not_configured" };
    }
  } catch {
    checks.redis = { status: "not_configured" };
  }

  // Outbox check
  try {
    const { getOutboxMetrics } = await import("@/lib/core/outbox");
    const outboxMetrics = await getOutboxMetrics();
    checks.outbox = {
      status: outboxMetrics.failedCount > 0 ? "degraded" : "ok",
      pendingCount: outboxMetrics.pendingCount,
      failedCount: outboxMetrics.failedCount,
      ...(outboxMetrics.oldestPending
        ? {
            oldestPendingAge: `${Math.round((Date.now() - outboxMetrics.oldestPending.getTime()) / 1000)}s`,
          }
        : {}),
    } as any;
  } catch (e) {
    checks.outbox = {
      status: "error",
      error: e instanceof Error ? e.message : "Unknown",
    };
  }

  // Event bus info
  const registeredEvents = eventBus.listEvents();
  const totalHandlers = registeredEvents.reduce(
    (sum, evt) => sum + eventBus.handlerCount(evt),
    0,
  );

  // Process / runtime info
  const mem = process.memoryUsage();

  const allOk = Object.values(checks).every(
    (c) => c.status === "ok" || c.status === "not_configured"
  );

  return NextResponse.json(
    {
      status: allOk ? "healthy" : "degraded",
      version: process.env.npm_package_version ?? "0.1.0",
      uptime: Math.floor((Date.now() - startedAt) / 1000),
      timestamp: new Date().toISOString(),
      checks,
      runtime: {
        nodeVersion: process.version,
        memory: {
          rss: `${Math.round(mem.rss / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)}MB`,
          external: `${Math.round(mem.external / 1024 / 1024)}MB`,
        },
      },
      eventBus: {
        registeredEvents: registeredEvents.length,
        totalHandlers,
      },
      metrics: metrics.snapshot(),
    },
    { status: allOk ? 200 : 503 }
  );
}
