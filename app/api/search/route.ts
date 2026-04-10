import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requireSignedIn } from "@/lib/admin";
import { apiOk, apiUnauthorized } from "@/lib/core/api-response";
import { facetedSearch } from "@/lib/modules/search/indexer";

export async function GET(req: Request) {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (q.length < 2) return apiOk({ results: [], facetCounts: { types: [], statuses: [] }, total: 0 });

  const prisma = getPrisma();

  const result = await facetedSearch(prisma, q, {
    type: searchParams.get("type") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    dateFrom: searchParams.get("dateFrom") ?? undefined,
    dateTo: searchParams.get("dateTo") ?? undefined,
  }, {
    take: parseInt(searchParams.get("limit") ?? "20"),
    skip: parseInt(searchParams.get("offset") ?? "0"),
    sort: searchParams.get("sort") ?? undefined,
  });

  return apiOk(result);
}
