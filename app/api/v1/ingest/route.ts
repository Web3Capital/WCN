import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { authenticateApiKey, requireScope } from "@/lib/modules/apikeys/middleware";
import { apiOk, apiCreated, apiValidationError, apiError } from "@/lib/core/api-response";
import { AuditAction, writeAudit } from "@/lib/audit";
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";
import { type NextRequest } from "next/server";
import { z } from "zod";

/**
 * Batch ingest endpoint — external agents push items directly into WCN.
 * This is the primary interface for agent nodes that crawl external sources.
 */

const itemSchema = z.object({
  name: z.string().min(1).max(300),
  type: z.enum(["project", "capital"]),
  stage: z.string().optional(),
  sector: z.string().optional(),
  website: z.string().url().optional(),
  description: z.string().max(5000).optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional(),
  region: z.string().optional(),
  fundraisingNeed: z.number().optional(),
  externalId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const batchSchema = z.object({
  items: z.array(itemSchema).min(1).max(100),
  source: z.string().min(1).max(100),
  deduplicate: z.boolean().optional().default(true),
});

export async function POST(req: NextRequest) {
  const authResult = await authenticateApiKey(req);
  if ("status" in authResult) return authResult;
  const scopeErr = requireScope(authResult, "write:ingest");
  if (scopeErr) return scopeErr;

  const body = await req.json().catch(() => ({}));
  const parsed = batchSchema.safeParse(body);
  if (!parsed.success) {
    return apiValidationError(parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })));
  }

  const prisma = getPrisma();
  const { items, source, deduplicate } = parsed.data;
  const results = { created: 0, skipped: 0, errors: 0, details: [] as Array<{ name: string; action: string }> };

  for (const item of items) {
    try {
      if (item.type === "project") {
        if (deduplicate) {
          const existing = await prisma.project.findFirst({
            where: { OR: [{ name: item.name }, ...(item.website ? [{ website: item.website }] : [])] },
          });
          if (existing) {
            results.skipped++;
            results.details.push({ name: item.name, action: "skipped_duplicate" });
            continue;
          }
        }

        const project = await prisma.project.create({
          data: {
            name: item.name,
            stage: (item.stage ?? "OTHER") as any,
            sector: item.sector ?? null,
            website: item.website ?? null,
            description: item.description ?? null,
            contactName: item.contactName ?? null,
            contactEmail: item.contactEmail ?? null,
            fundraisingNeed: item.fundraisingNeed ? String(item.fundraisingNeed) : null,
            nodeId: authResult.nodeId ?? null,
          },
        });

        await eventBus.emit(
          Events.PROJECT_CREATED,
          { projectId: project.id, name: project.name, sector: project.sector ?? undefined, stage: project.stage },
          { actorId: `apikey:${authResult.keyId}` },
        );

        results.created++;
        results.details.push({ name: item.name, action: "created" });
      } else if (item.type === "capital") {
        if (deduplicate) {
          const existing = await prisma.capitalProfile.findFirst({
            where: { name: item.name },
          });
          if (existing) {
            results.skipped++;
            results.details.push({ name: item.name, action: "skipped_duplicate" });
            continue;
          }
        }

        await prisma.capitalProfile.create({
          data: {
            name: item.name,
            entity: item.sector ?? null,
            investmentFocus: item.sector ? [item.sector] : [],
            notes: item.description ?? null,
            contactName: item.contactName ?? null,
            contactEmail: item.contactEmail ?? null,
            nodeId: authResult.nodeId ?? null,
          },
        });

        results.created++;
        results.details.push({ name: item.name, action: "created" });
      }
    } catch {
      results.errors++;
      results.details.push({ name: item.name, action: "error" });
    }
  }

  await writeAudit({
    actorUserId: authResult.userId ?? null,
    action: AuditAction.PROJECT_CREATE,
    targetType: "INGESTION",
    targetId: `batch:${source}`,
    metadata: { source, agentKeyId: authResult.keyId, created: results.created, skipped: results.skipped, errors: results.errors },
  });

  return apiCreated(results);
}
