import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

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
    },
    { status: allOk ? 200 : 503 }
  );
}
