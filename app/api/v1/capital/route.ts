import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { authenticateApiKey, requireScope } from "@/lib/modules/apikeys/middleware";
import { apiOk, apiCreated, apiValidationError } from "@/lib/core/api-response";
import { AuditAction, writeAudit } from "@/lib/audit";
import { type NextRequest } from "next/server";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  entity: z.string().optional(),
  investmentFocus: z.array(z.string()).optional(),
  ticketMin: z.number().optional(),
  ticketMax: z.number().optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional(),
  notes: z.string().max(5000).optional(),
  nodeId: z.string().optional(),
  source: z.string().optional(),
  externalId: z.string().optional(),
});

const ALLOWED_FIELDS = [
  "id", "name", "entity", "status", "investmentFocus",
  "ticketMin", "ticketMax", "contactName", "createdAt",
] as const;

export async function GET(req: NextRequest) {
  const authResult = await authenticateApiKey(req);
  if ("status" in authResult) return authResult;
  const scopeErr = requireScope(authResult, "read:capital");
  if (scopeErr) return scopeErr;

  const prisma = getPrisma();
  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(sp.get("pageSize") ?? 20)));
  const q = sp.get("q");

  const where: Record<string, unknown> = {};
  if (q) where.name = { contains: q, mode: "insensitive" };
  if (authResult.nodeId) where.nodeId = authResult.nodeId;

  const [profiles, total] = await Promise.all([
    prisma.capitalProfile.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip: (page - 1) * pageSize,
      select: Object.fromEntries(ALLOWED_FIELDS.map((f) => [f, true])),
    }),
    prisma.capitalProfile.count({ where }),
  ]);

  return apiOk({
    capitalProfiles: profiles,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}

export async function POST(req: NextRequest) {
  const authResult = await authenticateApiKey(req);
  if ("status" in authResult) return authResult;
  const scopeErr = requireScope(authResult, "write:capital");
  if (scopeErr) return scopeErr;

  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return apiValidationError(parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })));
  }

  const prisma = getPrisma();
  const d = parsed.data;

  if (d.externalId) {
    const existing = await prisma.capitalProfile.findFirst({
      where: { name: d.name },
    });
    if (existing) {
      return apiOk({ capitalProfile: existing, action: "already_exists" });
    }
  }

  const profile = await prisma.capitalProfile.create({
    data: {
      name: d.name,
      entity: d.entity ?? null,
      investmentFocus: d.investmentFocus ?? [],
      ticketMin: d.ticketMin ?? null,
      ticketMax: d.ticketMax ?? null,
      contactName: d.contactName ?? null,
      contactEmail: d.contactEmail ?? null,
      notes: d.notes ?? null,
      nodeId: d.nodeId ?? authResult.nodeId ?? null,
    },
  });

  await writeAudit({
    actorUserId: authResult.userId ?? null,
    action: AuditAction.CAPITAL_CREATE,
    targetType: "CAPITAL_PROFILE",
    targetId: profile.id,
    metadata: { source: d.source ?? "api", externalId: d.externalId, agentKeyId: authResult.keyId },
  });

  return apiCreated({ capitalProfile: profile, action: "created" });
}
