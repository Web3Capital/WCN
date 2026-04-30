import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requirePermission, requireSignedIn } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";
import { isAdminRole } from "@/lib/permissions";
import { apiOk, apiCreated, apiUnauthorized, apiForbidden, apiValidationError } from "@/lib/core/api-response";

const ALLOWED_ACTIONS = new Set(["DEPOSIT", "WITHDRAW", "FREEZE", "UNFREEZE", "SLASH"]);

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const isAdmin = isAdminRole(auth.session.user?.role ?? "USER");

  if (!isAdmin) {
    const node = await prisma.node.findUnique({ where: { id: params.id }, select: { ownerUserId: true } });
    if (node?.ownerUserId !== auth.session.user!.id) return apiForbidden();
  }

  const entries = await prisma.stakeLedger.findMany({
    where: { nodeId: params.id },
    orderBy: { createdAt: "desc" },
  });

  return apiOk(entries);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requirePermission("manage", "node");
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const action = String(body?.action ?? "").trim();
  if (!ALLOWED_ACTIONS.has(action)) return apiValidationError([{ path: "action", message: "Must be DEPOSIT, WITHDRAW, FREEZE, UNFREEZE, or SLASH." }]);

  const amount = Number(body?.amount ?? 0);
  if (!Number.isFinite(amount)) return apiValidationError([{ path: "amount", message: "Invalid amount." }]);

  const entry = await prisma.stakeLedger.create({
    data: {
      nodeId: params.id,
      action: action as any,
      amount,
      notes: body?.notes ? String(body.notes) : null,
      metadata: body?.metadata ?? null,
    },
  });

  await writeAudit({
    actorUserId: auth.session.user?.id ?? null,
    action: AuditAction.STAKE_ACTION,
    targetType: "STAKE_LEDGER",
    targetId: entry.id,
    metadata: { nodeId: params.id, stakeAction: action, amount },
  });

  return apiCreated(entry);
}
