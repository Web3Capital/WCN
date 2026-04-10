import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { authenticateApiKey, requireScope } from "@/lib/modules/apikeys/middleware";
import { apiOk } from "@/lib/core/api-response";
import { type NextRequest } from "next/server";

const ALLOWED_FIELDS = [
  "id", "projectId", "capitalProfileId", "stage", "status",
  "dealValue", "createdAt", "updatedAt",
] as const;

export async function GET(req: NextRequest) {
  const authResult = await authenticateApiKey(req);
  if ("status" in authResult) return authResult;
  const scopeErr = requireScope(authResult, "read:deals");
  if (scopeErr) return scopeErr;

  const prisma = getPrisma();
  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(sp.get("pageSize") ?? 20)));
  const status = sp.get("status");
  const projectId = sp.get("projectId");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (projectId) where.projectId = projectId;
  if (authResult.nodeId) {
    where.OR = [
      { project: { nodeId: authResult.nodeId } },
      { capitalProfile: { nodeId: authResult.nodeId } },
    ];
  }

  const [deals, total] = await Promise.all([
    prisma.deal.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip: (page - 1) * pageSize,
      select: Object.fromEntries(ALLOWED_FIELDS.map((f) => [f, true])),
    }),
    prisma.deal.count({ where }),
  ]);

  return apiOk({
    deals,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}
