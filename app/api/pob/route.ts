import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin, requireSignedIn } from "@/lib/admin";
import { getOwnedNodeIds, memberPoBWhere } from "@/lib/member-data-scope";
import { AuditAction, writeAudit } from "@/lib/audit";
import { isAdminRole } from "@/lib/permissions";
import { apiOk, apiCreated, apiUnauthorized, apiValidationError } from "@/lib/core/api-response";
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";
import { PoBRecordStatus } from "@prisma/client";

function computeScore(input: {
  baseValue: number;
  weight: number;
  qualityMult: number;
  timeMult: number;
  riskDiscount: number;
}) {
  const base = Number.isFinite(input.baseValue) ? input.baseValue : 0;
  const weight = Number.isFinite(input.weight) ? input.weight : 1;
  const q = Number.isFinite(input.qualityMult) ? input.qualityMult : 1;
  const t = Number.isFinite(input.timeMult) ? input.timeMult : 1;
  const r = Number.isFinite(input.riskDiscount) ? input.riskDiscount : 1;
  return base * weight * q * t * r;
}

export async function GET(req: Request) {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const isAdmin = isAdminRole(auth.session.user?.role ?? "USER");
  const userId = auth.session.user!.id;
  const { searchParams } = new URL(req.url);
  const pobEventStatus = searchParams.get("pobEventStatus");

  const where: Record<string, unknown> = isAdmin ? {} : memberPoBWhere(await getOwnedNodeIds(prisma, userId));
  if (pobEventStatus) where.pobEventStatus = pobEventStatus;

  const pob = await prisma.poBRecord.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      task: { select: { id: true, title: true } },
      project: { select: { id: true, name: true } },
      node: { select: { id: true, name: true } },
      deal: { select: { id: true, title: true } },
      attributions: { include: { node: { select: { id: true, name: true } } } },
      confirmations: true,
      disputes: { select: { id: true, status: true, reason: true } },
    },
  });

  return apiOk(pob);
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const businessType = String(body?.businessType ?? "").trim();
  if (!businessType) return apiValidationError([{ path: "businessType", message: "Missing businessType." }]);

  const baseValue = Number(body?.baseValue ?? 0);
  const weight = Number(body?.weight ?? 1);
  const qualityMult = Number(body?.qualityMult ?? 1);
  const timeMult = Number(body?.timeMult ?? 1);
  const riskDiscount = Number(body?.riskDiscount ?? 1);
  const score = computeScore({ baseValue, weight, qualityMult, timeMult, riskDiscount });

  let initialStatus: PoBRecordStatus | undefined;
  if (body?.status !== undefined && body?.status !== null && String(body.status).trim() !== "") {
    const s = String(body.status).trim();
    if (s !== "PENDING" && s !== "REVIEWING") {
      return apiValidationError([{ path: "status", message: "New PoB may only start as PENDING or REVIEWING." }]);
    }
    initialStatus = s as PoBRecordStatus;
  }

  const now = new Date();
  const slaDeadline = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

  const record = await prisma.poBRecord.create({
    data: {
      businessType,
      baseValue, weight, qualityMult, timeMult, riskDiscount, score,
      status: initialStatus,
      notes: body?.notes ? String(body.notes) : null,
      taskId: body?.taskId ? String(body.taskId) : null,
      projectId: body?.projectId ? String(body.projectId) : null,
      nodeId: body?.nodeId ? String(body.nodeId) : null,
      dealId: body?.dealId ? String(body.dealId) : null,
      leadNodeId: body?.leadNodeId ? String(body.leadNodeId) : null,
      supportingNodeIds: Array.isArray(body?.supportingNodeIds) ? body.supportingNodeIds.map((s: unknown) => String(s)) : [],
      beneficiaryEntity: body?.beneficiaryEntity ? String(body.beneficiaryEntity) : null,
      resultDate: body?.resultDate ? new Date(String(body.resultDate)) : null,
      loopType: body?.loopType ? String(body.loopType) : null,
      slaDeadlineAt: slaDeadline,
    },
  });

  await writeAudit({
    actorUserId: admin.session.user?.id ?? null,
    action: AuditAction.POB_UPDATE,
    targetType: "POB",
    targetId: record.id,
    metadata: { businessType, score, nodeId: record.nodeId, dealId: record.dealId },
  });

  await eventBus.emit(Events.POB_CREATED, {
    pobId: record.id,
    dealId: record.dealId ?? undefined,
    totalValue: score,
    attributions: [],
  }, { actorId: admin.session.user?.id });

  return apiCreated(record);
}
