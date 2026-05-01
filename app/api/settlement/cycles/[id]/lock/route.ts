import "@/lib/core/init";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  apiOk,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  apiBusinessError,
} from "@/lib/core/api-response";
import { lockSettlementCycle } from "@/lib/use-cases/lock-settlement-cycle";

/**
 * Lock a settlement cycle. Thin wrapper over the
 * `lockSettlementCycle` Application Service. All orchestration —
 * RBAC, SM validation, ApprovalAction creation (request mode),
 * transactional outbox emission, audit, and post-commit dispatch —
 * lives in the use-case.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.role) return apiUnauthorized();

  const body = await req.json().catch(() => ({}));
  const mode: "direct" | "request" = body?.dualControl === true ? "request" : "direct";
  const reason = typeof body?.reason === "string" ? body.reason : undefined;

  const result = await lockSettlementCycle({
    actorUserId: session.user.id,
    actorRole: session.user.role,
    cycleId: id,
    mode,
    reason,
    requestId: req.headers.get("x-request-id") ?? undefined,
  });

  if (result.ok) return apiOk(result);

  switch (result.code) {
    case "FORBIDDEN":
      return apiForbidden(result.message);
    case "NOT_FOUND":
      return apiNotFound("SettlementCycle");
    case "SETTLEMENT_INVALID_STATE":
    case "WORKSPACE_REQUIRED":
      return apiBusinessError(result.code, result.message, result.details);
  }
}
