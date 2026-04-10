import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requirePermission, requireSignedIn } from "@/lib/admin";
import { isAdminRole } from "@/lib/permissions";
import { AuditAction, writeAudit } from "@/lib/audit";
import { apiOk, apiCreated, apiUnauthorized, zodToApiError } from "@/lib/core/api-response";
import { parseBody, createCapitalSchema } from "@/lib/core/validation";

export async function GET(req: Request) {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const isAdmin = isAdminRole(auth.session.user?.role ?? "USER");
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  if (!isAdmin) {
    const ownedNodes = await prisma.node.findMany({
      where: { ownerUserId: auth.session.user?.id },
      select: { id: true },
    });
    where.nodeId = { in: ownedNodes.map((n) => n.id) };
  }

  const profiles = await prisma.capitalProfile.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { node: { select: { id: true, name: true } } },
  });

  return apiOk(profiles);
}

export async function POST(req: Request) {
  const auth = await requirePermission("create", "capital");
  if (!auth.ok) return apiUnauthorized();

  const body = await req.json().catch(() => ({}));
  const parsed = parseBody(createCapitalSchema, body);
  if (!parsed.ok) return zodToApiError(parsed.error);

  const prisma = getPrisma();
  const d = parsed.data;

  const profile = await prisma.capitalProfile.create({
    data: {
      name: d.name,
      entity: d.entity ?? null,
      investmentFocus: d.investmentFocus,
      ticketMin: d.ticketMin ?? null,
      ticketMax: d.ticketMax ?? null,
      jurisdictionLimit: d.jurisdictionLimit,
      structurePref: d.structurePref,
      blacklist: d.blacklist,
      restrictions: d.restrictions ?? null,
      contactName: d.contactName ?? null,
      contactEmail: d.contactEmail ?? null,
      notes: d.notes ?? null,
      nodeId: d.nodeId ?? null,
    },
  });

  await writeAudit({
    actorUserId: auth.session.user?.id ?? null,
    action: AuditAction.CAPITAL_CREATE,
    targetType: "CAPITAL",
    targetId: profile.id,
    metadata: { name: d.name },
  });

  return apiCreated(profile);
}
