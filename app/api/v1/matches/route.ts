import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { authenticateApiKey, requireScope } from "@/lib/modules/apikeys/middleware";
import { apiOk, apiValidationError } from "@/lib/core/api-response";
import { type NextRequest } from "next/server";
import { z } from "zod";

const triggerSchema = z.object({
  projectId: z.string(),
});

export async function GET(req: NextRequest) {
  const authResult = await authenticateApiKey(req);
  if ("status" in authResult) return authResult;
  const scopeErr = requireScope(authResult, "read:matches");
  if (scopeErr) return scopeErr;

  const prisma = getPrisma();
  const sp = req.nextUrl.searchParams;
  const projectId = sp.get("projectId");
  const page = Math.max(1, Number(sp.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(sp.get("pageSize") ?? 20)));

  const where: Record<string, unknown> = {};
  if (projectId) where.projectId = projectId;

  const [matches, total] = await Promise.all([
    prisma.match.findMany({
      where,
      orderBy: { score: "desc" },
      take: pageSize,
      skip: (page - 1) * pageSize,
      select: {
        id: true,
        projectId: true,
        capitalProfileId: true,
        score: true,
        sectorScore: true,
        stageScore: true,
        ticketScore: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.match.count({ where }),
  ]);

  return apiOk({
    matches,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}

export async function POST(req: NextRequest) {
  const authResult = await authenticateApiKey(req);
  if ("status" in authResult) return authResult;
  const scopeErr = requireScope(authResult, "write:matches");
  if (scopeErr) return scopeErr;

  const body = await req.json().catch(() => ({}));
  const parsed = triggerSchema.safeParse(body);
  if (!parsed.success) {
    return apiValidationError(parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })));
  }

  const { generateMatchesForProject } = await import("@/lib/modules/matching/engine");
  const results = await generateMatchesForProject(parsed.data.projectId);

  return apiOk({
    generated: results.length,
    topMatch: results[0] ?? null,
  });
}
