import "@/lib/core/init";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  apiOk,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
  apiBusinessError,
  zodToApiError,
} from "@/lib/core/api-response";
import { parseBody, reviewApplicationSchema } from "@/lib/core/validation";
import { approveApplication } from "@/lib/use-cases/approve-application";

/**
 * Review an application (approve or reject). Thin wrapper over the
 * `approveApplication` Application Service. All orchestration —
 * RBAC, state-machine validation, outbox emission, audit, and
 * post-commit dispatch — lives in the use-case.
 */
export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.role) return apiUnauthorized();

  const body = await req.json().catch(() => ({}));
  const parsed = parseBody(reviewApplicationSchema, body);
  if (!parsed.ok) return zodToApiError(parsed.error);

  const decision = parsed.data.status === "APPROVED" ? "APPROVE" : "REJECT";

  const result = await approveApplication({
    actorUserId: session.user.id,
    actorRole: session.user.role,
    applicationId: params.id,
    decision,
    reviewNote: parsed.data.reviewNote ?? undefined,
    requestId: req.headers.get("x-request-id") ?? undefined,
  });

  if (result.ok) return apiOk(result);

  switch (result.code) {
    case "FORBIDDEN":
      return apiForbidden(result.message);
    case "NOT_FOUND":
      return apiNotFound("Application");
    case "APPLICATION_INVALID_TRANSITION":
      return apiBusinessError(result.code, result.message, result.details);
  }
}
