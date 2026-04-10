import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requireSignedIn, requirePermission } from "@/lib/admin";
import { getOwnedNodeIds, memberEvidenceWhere } from "@/lib/member-data-scope";
import { redactEvidenceForMember } from "@/lib/member-redact";
import { AuditAction, writeAudit } from "@/lib/audit";
import { isAdminRole } from "@/lib/permissions";
import { apiOk, apiCreated, apiUnauthorized, zodToApiError } from "@/lib/core/api-response";
import { parseBody, createEvidenceSchema } from "@/lib/core/validation";
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";

export async function GET(req: Request) {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const isAdmin = isAdminRole(auth.session.user?.role ?? "USER");
  const userId = auth.session.user!.id;
  const { searchParams } = new URL(req.url);

  const reviewStatus = searchParams.get("reviewStatus");
  const queue = searchParams.get("queue");

  const ownedNodeIds = isAdmin ? [] : await getOwnedNodeIds(prisma, userId);
  let where: Record<string, unknown> = isAdmin ? {} : memberEvidenceWhere(ownedNodeIds);

  if (reviewStatus) where.reviewStatus = reviewStatus;

  if (queue === "reviewer") {
    where = { reviewStatus: { in: ["SUBMITTED", "UNDER_REVIEW"] } };
  }

  const evidences = await prisma.evidence.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      task: { select: { id: true, title: true } },
      project: { select: { id: true, name: true } },
      node: { select: { id: true, name: true } },
      deal: { select: { id: true, title: true } },
    },
  });

  return apiOk(isAdmin ? evidences : evidences.map((e) => redactEvidenceForMember(e, ownedNodeIds)));
}

export async function POST(req: Request) {
  const auth = await requirePermission("create", "evidence");
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));
  const parsed = parseBody(createEvidenceSchema, body);
  if (!parsed.ok) return zodToApiError(parsed.error);

  const input = parsed.data;
  const now = new Date();
  const slaDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const evidence = await prisma.evidence.create({
    data: {
      type: input.type,
      title: input.title ?? null,
      summary: input.summary ?? null,
      url: input.url ?? null,
      onchainTx: input.onchainTx ?? null,
      fileId: input.fileId ?? null,
      hash: input.hash ?? null,
      taskId: input.taskId ?? null,
      projectId: input.projectId ?? null,
      nodeId: input.nodeId ?? null,
      dealId: input.dealId ?? null,
      reviewStatus: input.submit ? "SUBMITTED" : "DRAFT",
      slaDeadlineAt: input.submit ? slaDeadline : null,
    },
  });

  await writeAudit({
    actorUserId: auth.session.user?.id ?? null,
    action: AuditAction.EVIDENCE_CREATE,
    targetType: "EVIDENCE",
    targetId: evidence.id,
    metadata: { type: input.type, taskId: evidence.taskId, dealId: evidence.dealId },
  });

  if (input.submit) {
    await eventBus.emit(
      Events.EVIDENCE_SUBMITTED,
      { evidenceId: evidence.id, submittedBy: auth.session.user!.id },
      { actorId: auth.session.user?.id }
    );
  }

  return apiCreated({ evidence });
}
