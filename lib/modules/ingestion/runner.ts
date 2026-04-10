import type { PrismaClient } from "@prisma/client";
import type { IngestionItem } from "./types";
import { getAdapter } from "./registry";

/**
 * Runs an ingestion source: fetches data, deduplicates, and upserts into WCN.
 */
export async function runIngestion(
  prisma: PrismaClient,
  sourceId: string,
): Promise<{ runId: string; itemsFound: number; itemsNew: number; itemsUpdated: number; itemsSkipped: number }> {
  const source = await prisma.ingestionSource.findUnique({ where: { id: sourceId } });
  if (!source) throw new Error(`Ingestion source not found: ${sourceId}`);
  if (!source.enabled) throw new Error(`Ingestion source is disabled: ${sourceId}`);

  const adapter = getAdapter(source.type);
  if (!adapter) throw new Error(`No adapter for type: ${source.type}`);

  const run = await prisma.ingestionRun.create({
    data: { sourceId, status: "RUNNING" },
  });

  let itemsFound = 0;
  let itemsNew = 0;
  let itemsUpdated = 0;
  let itemsSkipped = 0;

  try {
    let cursor: string | undefined;
    let hasMore = true;

    while (hasMore) {
      const result = await adapter.fetch((source.config as Record<string, unknown>) ?? {}, cursor);
      itemsFound += result.items.length;

      for (const item of result.items) {
        const outcome = await upsertItem(prisma, item);
        if (outcome === "new") itemsNew++;
        else if (outcome === "updated") itemsUpdated++;
        else itemsSkipped++;
      }

      cursor = result.nextCursor;
      hasMore = result.hasMore && !!cursor;

      if (itemsFound >= 500) break;
    }

    await prisma.ingestionRun.update({
      where: { id: run.id },
      data: { status: "COMPLETED", itemsFound, itemsNew, itemsUpdated, itemsSkipped, completedAt: new Date() },
    });

    await prisma.ingestionSource.update({
      where: { id: sourceId },
      data: { lastRunAt: new Date() },
    });
  } catch (err: any) {
    await prisma.ingestionRun.update({
      where: { id: run.id },
      data: { status: "FAILED", itemsFound, itemsNew, itemsUpdated, itemsSkipped, errorMsg: err.message, completedAt: new Date() },
    });
    throw err;
  }

  return { runId: run.id, itemsFound, itemsNew, itemsUpdated, itemsSkipped };
}

async function upsertItem(prisma: PrismaClient, item: IngestionItem): Promise<"new" | "updated" | "skipped"> {
  if (item.type === "project") {
    return upsertProject(prisma, item);
  }
  if (item.type === "capital") {
    return upsertCapital(prisma, item);
  }
  return "skipped";
}

async function upsertProject(prisma: PrismaClient, item: IngestionItem): Promise<"new" | "updated" | "skipped"> {
  const existing = await prisma.project.findFirst({
    where: {
      OR: [
        { website: item.data.website as string ?? "__none__" },
        { name: item.name },
      ],
    },
  });

  if (existing) {
    const hasChanges = !existing.description && item.data.description;
    if (hasChanges) {
      await prisma.project.update({
        where: { id: existing.id },
        data: { description: item.data.description as string },
      });
      return "updated";
    }
    return "skipped";
  }

  await prisma.project.create({
    data: {
      name: item.name,
      stage: guessStage(item.data) as any,
      sector: (item.data.category as string) ?? (item.data.categories as string[])?.[0] ?? null,
      website: (item.data.website as string) ?? item.url ?? null,
      description: (item.data.description as string) ?? null,
      fundraisingNeed: item.data.fundingTotal ? String(item.data.fundingTotal) : null,
    },
  });

  return "new";
}

async function upsertCapital(prisma: PrismaClient, item: IngestionItem): Promise<"new" | "updated" | "skipped"> {
  const existing = await prisma.capitalProfile.findFirst({
    where: { name: item.name },
  });

  if (existing) return "skipped";

  await prisma.capitalProfile.create({
    data: {
      name: item.name,
      entity: (item.data.entity as string) ?? null,
      investmentFocus: (item.data.sectors as string[]) ?? [],
      contactName: (item.data.contactName as string) ?? null,
      contactEmail: (item.data.contactEmail as string) ?? null,
      notes: (item.data.description as string) ?? null,
    },
  });

  return "new";
}

function guessStage(data: Record<string, unknown>): string {
  const funding = data.fundingTotal as number;
  if (!funding || funding === 0) return "IDEA";
  if (funding < 2_000_000) return "SEED";
  if (funding < 10_000_000) return "SERIES_A";
  if (funding < 50_000_000) return "SERIES_B";
  return "GROWTH";
}
