import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { authenticateApiKey, requireScope, type ApiKeyAuth } from "@/lib/modules/apikeys/middleware";
import { apiOk, apiCreated, apiValidationError } from "@/lib/core/api-response";
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";
import { AuditAction, writeAudit } from "@/lib/audit";
import { type NextRequest } from "next/server";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  stage: z.string().min(1),
  sector: z.string().optional(),
  website: z.string().url().optional(),
  description: z.string().max(5000).optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactTelegram: z.string().optional(),
  fundraisingNeed: z.string().optional(),
  pitchUrl: z.string().url().optional(),
  nodeId: z.string().optional(),
  source: z.string().optional(),
  externalId: z.string().optional(),
});

const ALLOWED_FIELDS = [
  "id", "name", "status", "stage", "sector", "website", "description",
  "fundraisingNeed", "createdAt", "updatedAt",
] as const;

export async function GET(req: NextRequest) {
  const authResult = await authenticateApiKey(req);
  if ("status" in authResult) return authResult;
  const scopeErr = requireScope(authResult, "read:projects");
  if (scopeErr) return scopeErr;

  const prisma = getPrisma();
  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(sp.get("pageSize") ?? 20)));
  const status = sp.get("status");
  const sector = sp.get("sector");
  const q = sp.get("q");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (sector) where.sector = { contains: sector, mode: "insensitive" };
  if (q) where.name = { contains: q, mode: "insensitive" };
  if (authResult.nodeId) where.nodeId = authResult.nodeId;

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip: (page - 1) * pageSize,
      select: Object.fromEntries(ALLOWED_FIELDS.map((f) => [f, true])),
    }),
    prisma.project.count({ where }),
  ]);

  return apiOk({
    projects,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}

export async function POST(req: NextRequest) {
  const authResult = await authenticateApiKey(req);
  if ("status" in authResult) return authResult;
  const scopeErr = requireScope(authResult, "write:projects");
  if (scopeErr) return scopeErr;

  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return apiValidationError(parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })));
  }

  const prisma = getPrisma();
  const d = parsed.data;

  if (d.externalId) {
    const existing = await prisma.project.findFirst({
      where: { name: d.name, sector: d.sector ?? null },
    });
    if (existing) {
      return apiOk({ project: existing, action: "already_exists" });
    }
  }

  const project = await prisma.project.create({
    data: {
      name: d.name,
      stage: d.stage as any,
      sector: d.sector ?? null,
      website: d.website ?? null,
      description: d.description ?? null,
      contactName: d.contactName ?? null,
      contactEmail: d.contactEmail ?? null,
      contactTelegram: d.contactTelegram ?? null,
      fundraisingNeed: d.fundraisingNeed ? String(d.fundraisingNeed) : null,
      pitchUrl: d.pitchUrl ?? null,
      nodeId: d.nodeId ?? authResult.nodeId ?? null,
    },
  });

  await writeAudit({
    actorUserId: authResult.userId ?? null,
    action: AuditAction.PROJECT_CREATE,
    targetType: "PROJECT",
    targetId: project.id,
    metadata: { source: d.source ?? "api", externalId: d.externalId, agentKeyId: authResult.keyId },
  });

  await eventBus.emit(
    Events.PROJECT_CREATED,
    { projectId: project.id, nodeId: project.nodeId ?? undefined, name: project.name, sector: project.sector ?? undefined, stage: project.stage },
    { actorId: authResult.userId ?? `apikey:${authResult.keyId}` },
  );

  return apiCreated({ project, action: "created" });
}
