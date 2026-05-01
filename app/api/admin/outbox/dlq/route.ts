/**
 * Outbox DLQ admin surface.
 *
 *   GET  /api/admin/outbox/dlq[?cursor=&limit=]
 *     List dead-lettered events (retryCount >= DLQ_THRESHOLD), oldest
 *     first. Cursor pagination by event id. Default limit 25, max 100.
 *
 * FOUNDER + ADMIN only — DLQ inspection touches event payloads which
 * may contain sensitive entity-level data (deal IDs, user IDs).
 *
 * The companion mutation route `[id]/route.ts` requeues or discards a
 * specific event.
 */
import "@/lib/core/init";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminRole } from "@/lib/permissions";
import { listDlqEvents, getOutboxDlqDepth } from "@/lib/core/outbox";
import { apiList, apiForbidden, apiUnauthorized } from "@/lib/core/api-response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return apiUnauthorized();
  if (!isAdminRole(session.user.role)) return apiForbidden();

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor") ?? undefined;
  const limit = searchParams.get("limit")
    ? Number(searchParams.get("limit"))
    : undefined;

  const rows = await listDlqEvents({ cursor, limit });
  const effectiveLimit = Math.min(Math.max(limit ?? 25, 1), 100);
  const hasMore = rows.length > effectiveLimit;
  const data = hasMore ? rows.slice(0, effectiveLimit) : rows;
  const nextCursor = hasMore ? data[data.length - 1].id : null;
  const totalDepth = await getOutboxDlqDepth();

  return apiList(data, {
    total: totalDepth,
    pageSize: effectiveLimit,
    hasMore,
    ...(nextCursor ? { nextCursor } : {}),
  } as Record<string, unknown>);
}
