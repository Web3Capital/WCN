import type { PrismaClient } from "@prisma/client";

export type SearchFacets = {
  type?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type SearchResult = {
  type: string;
  id: string;
  label: string;
  href: string;
  badge?: string;
  score?: number;
  createdAt?: string;
};

export type FacetCount = { value: string; count: number };

export async function facetedSearch(
  prisma: PrismaClient,
  query: string,
  facets: SearchFacets,
  options: { take?: number; skip?: number; sort?: string } = {},
): Promise<{
  results: SearchResult[];
  facetCounts: { types: FacetCount[]; statuses: FacetCount[] };
  total: number;
}> {
  const contains = query;
  const take = options.take ?? 20;
  const skip = options.skip ?? 0;
  const entityTypes = facets.type ? [facets.type] : ["Node", "Project", "Deal", "Task", "Capital", "Evidence", "PoB"];

  const dateFilter: { gte?: Date; lte?: Date } = {};
  if (facets.dateFrom) dateFilter.gte = new Date(facets.dateFrom);
  if (facets.dateTo) dateFilter.lte = new Date(facets.dateTo);
  const hasDateFilter = Object.keys(dateFilter).length > 0;

  const results: SearchResult[] = [];
  const typeCounts = new Map<string, number>();
  const statusCounts = new Map<string, number>();

  async function searchEntity<T>(
    type: string,
    finder: () => Promise<T[]>,
    mapper: (item: T) => SearchResult,
  ) {
    if (!entityTypes.includes(type)) return;
    const items = await finder();
    for (const item of items) {
      const r = mapper(item);
      if (facets.status && r.badge !== facets.status) continue;
      results.push(r);
      typeCounts.set(type, (typeCounts.get(type) ?? 0) + 1);
      if (r.badge) statusCounts.set(r.badge, (statusCounts.get(r.badge) ?? 0) + 1);
    }
  }

  await Promise.all([
    searchEntity("Node",
      () => prisma.node.findMany({
        where: {
          OR: [{ name: { contains, mode: "insensitive" } }, { id: { contains } }],
          ...(hasDateFilter ? { createdAt: dateFilter } : {}),
        },
        select: { id: true, name: true, type: true, status: true, createdAt: true },
        take: take * 2,
      }),
      (n: any) => ({ type: "Node", id: n.id, label: n.name, href: `/dashboard/nodes/${n.id}`, badge: n.status, createdAt: n.createdAt }),
    ),
    searchEntity("Project",
      () => prisma.project.findMany({
        where: {
          OR: [{ name: { contains, mode: "insensitive" } }, { id: { contains } }],
          ...(hasDateFilter ? { createdAt: dateFilter } : {}),
        },
        select: { id: true, name: true, status: true, createdAt: true },
        take: take * 2,
      }),
      (p: any) => ({ type: "Project", id: p.id, label: p.name, href: `/dashboard/projects/${p.id}`, badge: p.status, createdAt: p.createdAt }),
    ),
    searchEntity("Deal",
      () => prisma.deal.findMany({
        where: {
          OR: [{ title: { contains, mode: "insensitive" } }, { id: { contains } }],
          ...(hasDateFilter ? { createdAt: dateFilter } : {}),
        },
        select: { id: true, title: true, stage: true, createdAt: true },
        take: take * 2,
      }),
      (d: any) => ({ type: "Deal", id: d.id, label: d.title, href: `/dashboard/deals/${d.id}`, badge: d.stage, createdAt: d.createdAt }),
    ),
    searchEntity("Task",
      () => prisma.task.findMany({
        where: {
          OR: [{ title: { contains, mode: "insensitive" } }, { id: { contains } }],
          ...(hasDateFilter ? { createdAt: dateFilter } : {}),
        },
        select: { id: true, title: true, status: true, createdAt: true },
        take: take * 2,
      }),
      (t: any) => ({ type: "Task", id: t.id, label: t.title, href: `/dashboard/tasks/${t.id}`, badge: t.status, createdAt: t.createdAt }),
    ),
    searchEntity("Capital",
      () => prisma.capitalProfile.findMany({
        where: {
          OR: [{ name: { contains, mode: "insensitive" } }, { id: { contains } }],
          ...(hasDateFilter ? { createdAt: dateFilter } : {}),
        },
        select: { id: true, name: true, status: true, createdAt: true },
        take: take * 2,
      }),
      (c: any) => ({ type: "Capital", id: c.id, label: c.name, href: `/dashboard/capital/${c.id}`, badge: c.status, createdAt: c.createdAt }),
    ),
  ]);

  const sorted = results.sort((a, b) => {
    if (options.sort === "date") {
      return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
    }
    return a.label.localeCompare(b.label);
  });

  return {
    results: sorted.slice(skip, skip + take),
    facetCounts: {
      types: [...typeCounts.entries()].map(([value, count]) => ({ value, count })),
      statuses: [...statusCounts.entries()].map(([value, count]) => ({ value, count })),
    },
    total: results.length,
  };
}
