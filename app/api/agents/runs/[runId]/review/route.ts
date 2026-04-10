import "@/lib/core/init";
import { requireSignedIn } from "@/lib/admin";
import { isAdminRole } from "@/lib/permissions";
import { getPrisma } from "@/lib/prisma";
import { AuditAction, writeAudit } from "@/lib/audit";
import { apiOk, apiUnauthorized, apiNotFound, apiValidationError } from "@/lib/core/api-response";
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";
import type { AgentOutputReviewedEvent } from "@/lib/core/event-types";

const ALLOWED_STATUSES = new Set(["APPROVED", "MODIFIED", "REJECTED"]);

export async function PATCH(req: Request, { params }: { params: { runId: string } }) {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const userId = auth.session.user?.id ?? "system";
  const isAdmin = isAdminRole(auth.session.user?.role ?? "USER");
  if (!isAdmin) return apiUnauthorized();

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const reviewStatus = body.reviewStatus as string;
  if (!reviewStatus || !ALLOWED_STATUSES.has(reviewStatus)) {
    return apiValidationError([{ path: "reviewStatus", message: "Must be APPROVED, MODIFIED, or REJECTED" }]);
  }

  const run = await prisma.agentRun.findUnique({
    where: { id: params.runId },
  });
  if (!run) return apiNotFound("AgentRun");

  if (run.status !== "SUCCESS") {
    return apiValidationError([{ path: "status", message: `Cannot review a run with status ${run.status}` }]);
  }

  const data: Record<string, unknown> = {
    reviewStatus,
    reviewedById: userId,
    reviewNotes: body.reviewNotes ?? null,
  };

  if (reviewStatus === "MODIFIED" && body.modifiedOutputs) {
    data.outputs = body.modifiedOutputs;
  }

  const updated = await prisma.agentRun.update({
    where: { id: params.runId },
    data,
    include: { agent: { select: { id: true, type: true } } },
  });

  await writeAudit({
    actorUserId: userId,
    action: AuditAction.AGENT_OUTPUT_REVIEW,
    targetType: "AGENT_RUN",
    targetId: params.runId,
    metadata: { reviewStatus, agentId: run.agentId, outputType: String(run.outputType ?? "") },
  });

  await eventBus.emit<AgentOutputReviewedEvent>(Events.AGENT_OUTPUT_REVIEWED, {
    runId: params.runId,
    reviewStatus: reviewStatus as "APPROVED" | "MODIFIED" | "REJECTED",
    reviewedBy: userId,
  });

  return apiOk(updated);
}

export async function GET(_req: Request, { params }: { params: { runId: string } }) {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const run = await prisma.agentRun.findUnique({
    where: { id: params.runId },
    include: {
      agent: { select: { id: true, name: true, type: true } },
      task: { select: { id: true, title: true } },
      reviewedBy: { select: { id: true, name: true, email: true } },
    },
  });
  if (!run) return apiNotFound("AgentRun");

  return apiOk(run);
}
