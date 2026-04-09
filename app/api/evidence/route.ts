import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requireSignedIn, requirePermission } from "@/lib/admin";
import { getOwnedNodeIds, memberEvidenceWhere } from "@/lib/member-data-scope";
import { redactEvidenceForMember } from "@/lib/member-redact";
import { AuditAction, writeAudit } from "@/lib/audit";
import { isAdminRole } from "@/lib/permissions";

export async function GET(req: Request) {
  const auth = await requireSignedIn();
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

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

  return NextResponse.json({
    ok: true,
    evidences: isAdmin ? evidences : evidences.map((e) => redactEvidenceForMember(e, ownedNodeIds)),
  });
}

export async function POST(req: Request) {
  const auth = await requirePermission("create", "evidence");
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const type = body?.type ? String(body.type) : "OTHER";
  const allowed = new Set(["CONTRACT", "TRANSFER", "REPORT", "SCREENSHOT", "LINK", "ONCHAIN_TX", "OTHER"]);
  if (!allowed.has(type)) {
    return NextResponse.json({ ok: false, error: "Invalid evidence type." }, { status: 400 });
  }

  const now = new Date();
  const slaDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const evidence = await prisma.evidence.create({
    data: {
      type: type as any,
      title: body?.title ? String(body.title) : null,
      summary: body?.summary ? String(body.summary) : null,
      url: body?.url ? String(body.url) : null,
      onchainTx: body?.onchainTx ? String(body.onchainTx) : null,
      fileId: body?.fileId ? String(body.fileId) : null,
      hash: body?.hash ? String(body.hash) : null,
      taskId: body?.taskId ? String(body.taskId) : null,
      projectId: body?.projectId ? String(body.projectId) : null,
      nodeId: body?.nodeId ? String(body.nodeId) : null,
      dealId: body?.dealId ? String(body.dealId) : null,
      reviewStatus: body?.submit ? "SUBMITTED" : "DRAFT",
      slaDeadlineAt: body?.submit ? slaDeadline : null,
    },
  });

  await writeAudit({
    actorUserId: auth.session.user?.id ?? null,
    action: AuditAction.EVIDENCE_CREATE,
    targetType: "EVIDENCE",
    targetId: evidence.id,
    metadata: { type, taskId: evidence.taskId, dealId: evidence.dealId },
  });

  return NextResponse.json({ ok: true, evidence });
}
