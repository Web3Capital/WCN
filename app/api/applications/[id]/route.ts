import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AuditAction, writeAudit } from "@/lib/audit";
import { apiOk, apiUnauthorized, apiNotFound, zodToApiError } from "@/lib/core/api-response";
import { parseBody, reviewApplicationSchema } from "@/lib/core/validation";
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";

function statusToDecision(s: string) {
  if (s === "APPROVED") return "APPROVE" as const;
  if (s === "REJECTED") return "REJECT" as const;
  return "NEEDS_CHANGES" as const;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return apiUnauthorized();

  const body = await req.json().catch(() => ({}));
  const parsed = parseBody(reviewApplicationSchema, body);
  if (!parsed.ok) return zodToApiError(parsed.error);

  const prisma = getPrisma();
  const existing = await prisma.application.findUnique({ where: { id: params.id }, select: { id: true, status: true } });
  if (!existing) return apiNotFound("Application");

  const data: Record<string, unknown> = {};
  data.status = parsed.data.status;
  if (parsed.data.reviewNote !== undefined) data.notes = parsed.data.reviewNote ?? null;

  // Handle escalation fields (passed outside the zod schema)
  if (body?.escalatedTo) {
    data.escalatedTo = String(body.escalatedTo);
    data.escalatedAt = body.escalatedAt ? new Date(body.escalatedAt) : new Date();
  }

  const updated = await prisma.application.update({
    where: { id: params.id },
    data,
  });

  if (data.status !== existing.status) {
    await prisma.review.create({
      data: {
        targetType: "APPLICATION",
        targetId: params.id,
        decision: statusToDecision(data.status),
        notes: parsed.data.reviewNote ?? null,
        status: "RESOLVED",
        reviewerId: session.user?.id ?? null,
      },
    });

    if (data.status === "APPROVED") {
      await eventBus.emit(Events.APPLICATION_APPROVED, {
        applicationId: params.id,
        nodeId: "",
        approvedBy: session.user?.id ?? "system",
      }, { actorId: session.user?.id });
    }
  }

  await writeAudit({
    actorUserId: session.user?.id ?? null,
    action: AuditAction.APPLICATION_STATUS_CHANGE,
    targetType: "APPLICATION",
    targetId: params.id,
    metadata: { previousStatus: existing.status, newStatus: updated.status, notes: data.notes },
  });

  return apiOk(updated);
}
