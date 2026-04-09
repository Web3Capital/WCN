import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requirePermission, requireSignedIn } from "@/lib/admin";
import { isAdminRole } from "@/lib/permissions";
import { AuditAction, writeAudit } from "@/lib/audit";

export async function GET(req: Request) {
  const auth = await requireSignedIn();
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const isAdmin = isAdminRole(auth.session.user?.role ?? "USER");
  if (!isAdmin) return NextResponse.json({ ok: false, error: "Admin only." }, { status: 403 });

  const prisma = getPrisma();
  const { searchParams } = new URL(req.url);
  const severity = searchParams.get("severity");
  const resolved = searchParams.get("resolved");

  const where: Record<string, unknown> = {};
  if (severity) where.severity = severity;
  if (resolved === "true") where.resolvedAt = { not: null };
  if (resolved === "false") where.resolvedAt = null;

  const flags = await prisma.riskFlag.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ ok: true, flags });
}

export async function POST(req: Request) {
  const auth = await requirePermission("create", "risk");
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const entityType = String(body?.entityType ?? "").trim();
  const entityId = String(body?.entityId ?? "").trim();
  const severity = String(body?.severity ?? "MEDIUM").trim();
  const reason = String(body?.reason ?? "").trim();

  if (!entityType || !entityId || !reason) {
    return NextResponse.json({ ok: false, error: "entityType, entityId, and reason are required." }, { status: 400 });
  }

  const allowed = new Set(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
  if (!allowed.has(severity)) {
    return NextResponse.json({ ok: false, error: "Invalid severity." }, { status: 400 });
  }

  const flag = await prisma.riskFlag.create({
    data: { entityType, entityId, severity, reason, raisedById: auth.session.user?.id ?? null },
  });

  await writeAudit({
    actorUserId: auth.session.user?.id ?? null,
    action: AuditAction.RISK_FLAG_CREATE,
    targetType: entityType,
    targetId: entityId,
    metadata: { severity, reason, riskFlagId: flag.id },
  });

  return NextResponse.json({ ok: true, flag });
}
