import "@/lib/core/init";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { apiOk, apiUnauthorized, apiCreated, zodToApiError, apiBusinessError } from "@/lib/core/api-response";
import { listMatchesQuerySchema, triggerMatchSchema, parseBody } from "@/lib/core/validation";
import { listMatches, generateMatchesForProject } from "@/lib/modules/matching/engine";
import { getOwnedNodeIds } from "@/lib/member-data-scope";
import type { MatchStatus } from "@prisma/client";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return apiUnauthorized();

  const url = new URL(req.url);
  const raw = Object.fromEntries(url.searchParams.entries());
  const parsed = listMatchesQuerySchema.safeParse(raw);
  if (!parsed.success) return zodToApiError(parsed.error);

  const isAdmin = isAdminRole(session.user.role ?? "USER");
  if (!isAdmin) {
    const prisma = getPrisma();
    const ownedNodeIds = await getOwnedNodeIds(prisma, session.user.id);
    const result = await listMatches({
      ...parsed.data,
      status: parsed.data.status as MatchStatus | undefined,
    });
    const filtered = result.filter((m: any) =>
      ownedNodeIds.includes(m.capitalNodeId) ||
      ownedNodeIds.includes(m.project?.nodeId)
    );
    return apiOk(filtered);
  }

  const result = await listMatches({
    ...parsed.data,
    status: parsed.data.status as MatchStatus | undefined,
  });

  return apiOk(result);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return apiUnauthorized();

  const body = await req.json().catch(() => ({}));
  const parsed = parseBody(triggerMatchSchema, body);
  if (!parsed.ok) return zodToApiError(parsed.error);

  const isAdmin = isAdminRole(session.user.role ?? "USER");
  if (!isAdmin) {
    const prisma = getPrisma();
    const ownedNodeIds = await getOwnedNodeIds(prisma, session.user.id);
    const project = await prisma.project.findFirst({
      where: { id: parsed.data.projectId, node: { id: { in: ownedNodeIds } } },
      select: { id: true },
    });
    if (!project) return apiUnauthorized();
  }

  const weights = parsed.data.weights
    ? { sector: parsed.data.weights.sector ?? 0.35, stage: parsed.data.weights.stage ?? 0.25, ticket: parsed.data.weights.ticket ?? 0.25, jurisdiction: parsed.data.weights.jurisdiction ?? 0.15 }
    : undefined;

  const matches = await generateMatchesForProject(parsed.data.projectId, session.user.id, weights);

  if (matches.length === 0) {
    return apiBusinessError("NO_MATCHES", "No matching capital profiles found above threshold.");
  }

  return apiCreated({ generated: matches.length, topScore: matches[0]?.score ?? 0, matches });
}
