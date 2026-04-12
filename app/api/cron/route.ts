import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { timingSafeEqual } from "node:crypto";

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

  const results: Record<string, unknown> = {};

  // 1. Run due ingestion sources
  try {
    const prisma = getPrisma();
    const { runIngestion } = await import("@/lib/modules/ingestion/runner");
    const dueSources = await prisma.ingestionSource.findMany({
      where: {
        enabled: true,
        schedule: { not: null },
        OR: [
          { lastRunAt: null },
          { lastRunAt: { lt: new Date(Date.now() - 5 * 60 * 1000) } },
        ],
      },
    });

    let ingestionCount = 0;
    for (const source of dueSources) {
      try {
        await runIngestion(prisma, source.id);
        ingestionCount++;
      } catch (e) {
        console.error(`[Cron] Ingestion failed for source ${source.id}:`, e);
      }
    }
    results.ingestion = { sourcesRun: ingestionCount, sourcesFound: dueSources.length };
  } catch (e) {
    results.ingestion = { error: e instanceof Error ? e.message : "Failed" };
  }

  // 2. Run scheduled agent tasks (Research Agent scans new projects)
  try {
    const prisma = getPrisma();
    const researchAgent = await prisma.agent.findFirst({
      where: { type: "RESEARCH", status: "ACTIVE" },
      select: { id: true },
    });

    if (researchAgent) {
      const recentProjects = await prisma.project.findMany({
        where: {
          status: { in: ["ACTIVE", "SCREENED"] },
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
        select: { id: true },
        take: 10,
      });

      const existingRuns = await prisma.agentRun.findMany({
        where: {
          agentId: researchAgent.id,
          startedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
        select: { inputs: true },
      });
      const runProjectIds = new Set(
        existingRuns.map((r) => (r.inputs as Record<string, string>)?.projectId).filter(Boolean)
      );

      const unscanned = recentProjects.filter((p) => !runProjectIds.has(p.id));
      let agentRunCount = 0;
      const { runResearchAgent } = await import("@/lib/modules/agents/executor");
      for (const project of unscanned.slice(0, 5)) {
        try {
          await runResearchAgent(researchAgent.id, project.id, "system:cron");
          agentRunCount++;
        } catch (e) {
          console.error(`[Cron] Research agent failed for project ${project.id}:`, e);
        }
      }
      results.agents = { researchRuns: agentRunCount, unscannedProjects: unscanned.length };
    } else {
      results.agents = { message: "No active research agent" };
    }
  } catch (e) {
    results.agents = { error: e instanceof Error ? e.message : "Failed" };
  }

  // 3. Process outbox events
  try {
    const { processOutbox, cleanupOutbox } = await import("@/lib/core/outbox");
    const processed = await processOutbox();
    results.outbox = { processed };

    // Weekly cleanup (run on Sundays)
    if (new Date().getDay() === 0) {
      const cleaned = await cleanupOutbox();
      results.outboxCleanup = { cleaned };
    }
  } catch (e) {
    results.outbox = { error: (e as Error).message };
  }

  // 4. Cleanup expired matches
  try {
    const prisma = getPrisma();
    const expired = await prisma.match.updateMany({
      where: { status: "GENERATED", expiresAt: { lt: new Date() } },
      data: { status: "EXPIRED" },
    });
    results.cleanup = { expiredMatches: expired.count };
  } catch (e) {
    results.cleanup = { error: e instanceof Error ? e.message : "Failed" };
  }

  return NextResponse.json({ ok: true, timestamp: new Date().toISOString(), results });
}
