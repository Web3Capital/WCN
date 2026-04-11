import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { isAdminRole } from "@/lib/permissions";
import { apiOk, apiUnauthorized } from "@/lib/core/api-response";
import type { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  const auth = await requirePermission("read", "audit");
  if (!auth.ok) return apiUnauthorized();

  const url = new URL(req.url);
  const action = url.searchParams.get("action");
  const targetType = url.searchParams.get("targetType");
  const targetId = url.searchParams.get("targetId");
  const since = url.searchParams.get("since");
  const until = url.searchParams.get("until");
  const cursor = url.searchParams.get("cursor");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 200);
  const workspaceId = url.searchParams.get("workspaceId");

  const where: Prisma.AuditLogWhereInput = {};
  if (action) where.action = action;
  if (targetType) where.targetType = targetType;
  if (targetId) where.targetId = targetId;
  if (since || until) {
    where.createdAt = {};
    if (since) where.createdAt.gte = new Date(since);
    if (until) where.createdAt.lte = new Date(until);
  }

  const isAdmin = isAdminRole(auth.session.user?.role ?? "USER");
  if (workspaceId) {
    where.workspaceId = workspaceId;
  } else if (!isAdmin) {
    where.actorUserId = auth.session.user!.id;
  }

  const prisma = getPrisma();
  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: { actor: { select: { id: true, name: true, email: true } } },
  });

  const hasMore = logs.length > limit;
  if (hasMore) logs.pop();
  const nextCursor = hasMore ? logs[logs.length - 1]?.id : null;

  return apiOk({ logs, nextCursor });
}
