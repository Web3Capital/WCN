import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin, requireSignedIn } from "@/lib/admin";
import { AuditAction, writeAudit } from "@/lib/audit";
import { isAdminRole } from "@/lib/permissions";
import { apiOk, apiCreated, apiUnauthorized, apiForbidden } from "@/lib/core/api-response";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const isAdmin = isAdminRole(auth.session.user?.role ?? "USER");

  if (!isAdmin) {
    const node = await prisma.node.findUnique({ where: { id: params.id }, select: { ownerUserId: true } });
    if (node?.ownerUserId !== auth.session.user!.id) return apiForbidden();
  }

  const seats = await prisma.nodeSeat.findMany({
    where: { nodeId: params.id },
    orderBy: { createdAt: "desc" },
  });

  return apiOk(seats);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const level = Number(body?.level ?? 1);
  const status = body?.status ? String(body.status) : "ACTIVE";

  const seat = await prisma.nodeSeat.create({
    data: { nodeId: params.id, level, status },
  });

  await writeAudit({
    actorUserId: admin.session.user?.id ?? null,
    action: AuditAction.NODE_SEAT_CREATE,
    targetType: "NODE_SEAT",
    targetId: seat.id,
    metadata: { nodeId: params.id, level, status },
  });

  return apiCreated(seat);
}
