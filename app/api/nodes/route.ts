import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin, requireSignedIn } from "@/lib/admin";
import { redactNodeForMember } from "@/lib/member-redact";
import { AuditAction, writeAudit } from "@/lib/audit";
import { isAdminRole } from "@/lib/permissions";
import { apiOk, apiCreated, apiUnauthorized, zodToApiError } from "@/lib/core/api-response";
import { parseBody, createNodeSchema } from "@/lib/core/validation";
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";
import { buildNodeListFilters, buildNodeListWhere } from "./list-where";

const DEFAULT_LIST_LIMIT = 100;
const MAX_LIST_LIMIT = 200;

export async function GET(req: Request) {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const isAdmin = isAdminRole(auth.session.user?.role ?? "USER");
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const region = searchParams.get("region");
  const cursorId = searchParams.get("cursor");
  const includeCounts = searchParams.get("includeCounts") === "1";
  const limitRaw = parseInt(searchParams.get("limit") || String(DEFAULT_LIST_LIMIT), 10);
  const limit = Math.min(MAX_LIST_LIMIT, Math.max(1, Number.isFinite(limitRaw) ? limitRaw : DEFAULT_LIST_LIMIT));

  let cursorAnchor: { id: string; createdAt: Date } | null = null;
  if (cursorId) {
    cursorAnchor = await prisma.node.findUnique({
      where: { id: cursorId },
      select: { id: true, createdAt: true },
    });
  }

  const where = buildNodeListWhere({ status, type, region, cursorAnchor });

  const rows = await prisma.node.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    include: { owner: { select: { id: true, name: true, email: true } } },
  });

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? page[page.length - 1]!.id : null;

  const filterOnly = buildNodeListFilters({ status, type, region });
  let statusCounts: Record<string, number> | undefined;
  if (includeCounts) {
    const groups = await prisma.node.groupBy({
      by: ["status"],
      where: filterOnly,
      _count: true,
    });
    statusCounts = {};
    for (const g of groups) statusCounts[g.status] = g._count;
  }

  return apiOk({
    nodes: isAdmin ? page : page.map(redactNodeForMember),
    meta: { nextCursor, hasMore, limit },
    ...(statusCounts ? { statusCounts } : {}),
  });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));
  const parsed = parseBody(createNodeSchema, body);
  if (!parsed.ok) return zodToApiError(parsed.error);

  const d = parsed.data;
  const node = await prisma.node.create({
    data: {
      name: d.name,
      type: d.type as any,
      description: d.description ?? null,
      tags: d.tags,
      region: d.region ?? null,
      city: d.city ?? null,
      jurisdiction: d.jurisdiction ?? null,
      level: d.level,
      ownerUserId: d.ownerUserId ?? null,
      entityName: d.entityName ?? null,
      entityType: d.entityType ?? null,
      contactName: d.contactName ?? null,
      contactEmail: d.contactEmail ?? null,
      resourcesOffered: d.resourcesOffered ?? null,
      pastCases: d.pastCases ?? null,
      recommendation: d.recommendation ?? null,
      allowedServices: d.allowedServices,
      riskLevel: d.riskLevel ?? null,
    },
  });

  await writeAudit({
    actorUserId: admin.session.user?.id ?? null,
    action: AuditAction.NODE_CREATE,
    targetType: "NODE",
    targetId: node.id,
    metadata: { name: d.name, type: d.type },
  });

  await eventBus.emit(
    Events.NODE_CREATED,
    {
      nodeId: node.id,
      type: node.type,
      name: node.name,
      ownerId: node.ownerUserId ?? undefined,
    },
    { actorId: admin.session.user?.id },
  );

  return apiCreated(node);
}
