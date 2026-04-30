import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requirePermission, requireSignedIn } from "@/lib/admin";
import { isAdminRole } from "@/lib/permissions";
import { AuditAction, writeAudit } from "@/lib/audit";
import { apiOk, apiUnauthorized, apiForbidden, apiValidationError, apiNotFound, apiCreated } from "@/lib/core/api-response";
import { upsertScorecard, getLatestScorecard, getScorecardHistory } from "@/lib/modules/nodes/scorecard";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const isAdmin = isAdminRole(auth.session.user?.role ?? "USER");

  // Check node exists and verify ownership or admin
  const node = await prisma.node.findUnique({
    where: { id: params.id },
    select: { id: true, ownerUserId: true },
  });

  if (!node) return apiNotFound("Node");

  // Only node owner or admin can access scorecard
  if (!isAdmin && node.ownerUserId !== auth.session.user?.id) {
    return apiForbidden();
  }

  // Get latest scorecard and history
  const latest = await getLatestScorecard(params.id);
  const history = await getScorecardHistory(params.id);

  return apiOk({ latest, history });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requirePermission("manage", "node");
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  // Verify node exists
  const node = await prisma.node.findUnique({
    where: { id: params.id },
    select: { id: true },
  });

  if (!node) return apiNotFound("Node");

  // Validate required fields
  const period = String(body?.period ?? "").trim();
  if (!period) {
    return apiValidationError([{ path: "period", message: "Period is required." }]);
  }

  const notes = body?.notes ? String(body.notes).trim() : undefined;

  // Calculate and upsert scorecard
  const scorecard = await upsertScorecard(params.id, period, auth.session.user?.id ?? undefined, notes);

  // Write audit log
  await writeAudit({
    actorUserId: auth.session.user?.id ?? null,
    action: AuditAction.NODE_SCORECARD_CALCULATE,
    targetType: "NODE_SCORECARD",
    targetId: params.id,
    metadata: {
      period,
      totalScore: scorecard.totalScore,
      action: scorecard.action,
    },
  });

  return apiCreated(scorecard);
}
