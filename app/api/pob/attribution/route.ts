import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { isAdminRole } from "@/lib/permissions";
import { ownsPoB } from "@/lib/auth/resource-scope";
import { AuditAction, writeAudit } from "@/lib/audit";
import { apiOk, apiUnauthorized, apiValidationError } from "@/lib/core/api-response";

export async function POST(req: Request) {
  const auth = await requirePermission("update", "pob");
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const pobId = String(body?.pobId ?? "").trim();
  const items = Array.isArray(body?.items) ? body.items : null;
  if (!pobId || !items) {
    return apiValidationError([{ path: "pobId", message: "Missing pobId or items." }]);
  }

  const isAdmin = isAdminRole(auth.session.user?.role ?? "USER");
  if (!isAdmin && !(await ownsPoB(prisma, auth.session.user!.id, pobId))) {
    return apiUnauthorized();
  }

  const cleaned = items
    .map((it: any) => ({
      nodeId: String(it?.nodeId ?? "").trim(),
      shareBps: Number(it?.shareBps ?? 0),
      role: String(it?.role ?? "COLLAB").trim(),
      evidenceRefs: Array.isArray(it?.evidenceRefs) ? it.evidenceRefs.map((x: any) => String(x)) : [],
    }))
    .filter((it: any) => it.nodeId && Number.isFinite(it.shareBps) && it.shareBps > 0);

  const total = cleaned.reduce((sum: number, it: any) => sum + it.shareBps, 0);
  if (total !== 10000) {
    return apiValidationError([{ path: "items", message: `shareBps total must equal 10000, got ${total}.` }]);
  }

  await prisma.attribution.deleteMany({ where: { pobId } });
  await prisma.attribution.createMany({
    data: cleaned.map((it: any) => ({
      pobId,
      nodeId: it.nodeId,
      shareBps: Math.floor(it.shareBps),
      role: it.role === "LEAD" ? "LEAD" : "COLLAB",
      evidenceRefs: it.evidenceRefs,
    })),
  });

  const attributions = await prisma.attribution.findMany({ where: { pobId }, include: { node: true } });

  await writeAudit({
    actorUserId: auth.session.user?.id ?? null,
    action: AuditAction.POB_ATTRIBUTION_SET,
    targetType: "POB",
    targetId: pobId,
    metadata: { nodeCount: attributions.length, shareBpsTotal: total },
  });

  return apiOk(attributions);
}
