import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { authenticateApiKey, requireScope } from "@/lib/modules/apikeys/middleware";
import { apiOk } from "@/lib/core/api-response";
import { type NextRequest } from "next/server";

const ALLOWED_FIELDS = [
  "id", "name", "type", "status", "region", "industry",
  "specialties", "createdAt",
] as const;

export async function GET(req: NextRequest) {
  const authResult = await authenticateApiKey(req);
  if ("status" in authResult) return authResult;
  const scopeErr = requireScope(authResult, "read:nodes");
  if (scopeErr) return scopeErr;

  const prisma = getPrisma();
  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(sp.get("pageSize") ?? 20)));
  const type = sp.get("type");
  const status = sp.get("status");
  const q = sp.get("q");

  const where: Record<string, unknown> = {};
  if (type) where.type = type;
  if (status) where.status = status;
  if (q) where.name = { contains: q, mode: "insensitive" };

  const [nodes, total] = await Promise.all([
    prisma.node.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip: (page - 1) * pageSize,
      select: Object.fromEntries(ALLOWED_FIELDS.map((f) => [f, true])),
    }),
    prisma.node.count({ where }),
  ]);

  return apiOk({
    nodes,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}
