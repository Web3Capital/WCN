import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin, requireSignedIn } from "@/lib/admin";

export async function GET() {
  const auth = await requireSignedIn();
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const agents = await prisma.agent.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { ownerNode: true, permissions: true }
  });
  return NextResponse.json({ ok: true, agents });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const name = String(body?.name ?? "").trim();
  const type = String(body?.type ?? "").trim();
  const ownerNodeId = String(body?.ownerNodeId ?? "").trim();
  if (!name || !type || !ownerNodeId) {
    return NextResponse.json({ ok: false, error: "Missing name/type/ownerNodeId." }, { status: 400 });
  }

  const allowedTypes = new Set(["DEAL", "RESEARCH", "GROWTH", "EXECUTION", "LIQUIDITY"]);
  if (!allowedTypes.has(type)) {
    return NextResponse.json({ ok: false, error: "Invalid agent type." }, { status: 400 });
  }

  const agent = await prisma.agent.create({
    data: {
      name,
      type: type as any,
      endpoint: body?.endpoint ? String(body.endpoint) : null,
      ownerNodeId
    },
    include: { ownerNode: true, permissions: true }
  });

  return NextResponse.json({ ok: true, agent });
}

