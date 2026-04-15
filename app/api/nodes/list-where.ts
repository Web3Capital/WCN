import type { Prisma } from "@prisma/client";

/** Status / type / region only (no cursor). Used for list + groupBy counts. */
export function buildNodeListFilters(params: {
  status: string | null;
  type: string | null;
  region: string | null;
}): Prisma.NodeWhereInput {
  const parts: Prisma.NodeWhereInput[] = [];
  if (params.status) parts.push({ status: params.status as Prisma.EnumNodeStatusFilter["equals"] });
  if (params.type) parts.push({ type: params.type as Prisma.EnumNodeTypeFilter["equals"] });
  if (params.region) parts.push({ region: params.region });
  if (parts.length === 0) return {};
  if (parts.length === 1) return parts[0]!;
  return { AND: parts };
}

export function buildNodeListWhere(params: {
  status: string | null;
  type: string | null;
  region: string | null;
  cursorAnchor: { id: string; createdAt: Date } | null;
}): Prisma.NodeWhereInput {
  const filters = buildNodeListFilters(params);
  const seek: Prisma.NodeWhereInput | null = params.cursorAnchor
    ? {
        OR: [
          { createdAt: { lt: params.cursorAnchor.createdAt } },
          {
            AND: [
              { createdAt: params.cursorAnchor.createdAt },
              { id: { lt: params.cursorAnchor.id } },
            ],
          },
        ],
      }
    : null;

  if (!seek) return filters;
  const empty =
    !filters ||
    (typeof filters === "object" &&
      !Array.isArray(filters) &&
      Object.keys(filters as object).length === 0);
  if (empty) return seek;
  return { AND: [filters, seek] };
}
