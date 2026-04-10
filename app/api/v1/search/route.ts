import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { authenticateApiKey, requireScope } from "@/lib/modules/apikeys/middleware";
import { apiOk, apiValidationError } from "@/lib/core/api-response";
import { facetedSearch } from "@/lib/modules/search/indexer";
import { type NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const authResult = await authenticateApiKey(req);
  if ("status" in authResult) return authResult;
  const scopeErr = requireScope(authResult, "read:search");
  if (scopeErr) return scopeErr;

  const sp = req.nextUrl.searchParams;
  const q = sp.get("q");
  if (!q) return apiValidationError([{ path: "q", message: "Search query required" }]);

  const prisma = getPrisma();
  const results = await facetedSearch(
    prisma,
    q,
    {
      type: sp.get("type") ?? undefined,
      status: sp.get("status") ?? undefined,
    },
    {
      take: Math.min(50, Number(sp.get("pageSize") ?? 20)),
      skip: Math.max(0, (Number(sp.get("page") ?? 1) - 1) * Number(sp.get("pageSize") ?? 20)),
      sort: sp.get("sort") ?? undefined,
    },
  );

  return apiOk(results);
}
