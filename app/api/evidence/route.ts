import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const evidences = await prisma.evidence.findMany({
    orderBy: { createdAt: "desc" },
    take: 200
  });

  return NextResponse.json({ ok: true, evidences });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const type = body?.type ? String(body.type) : "OTHER";
  const allowed = new Set(["CONTRACT", "TRANSFER", "REPORT", "SCREENSHOT", "LINK", "ONCHAIN_TX", "OTHER"]);
  if (!allowed.has(type)) {
    return NextResponse.json({ ok: false, error: "Invalid evidence type." }, { status: 400 });
  }

  const evidence = await prisma.evidence.create({
    data: {
      type: type as any,
      title: body?.title ? String(body.title) : null,
      summary: body?.summary ? String(body.summary) : null,
      url: body?.url ? String(body.url) : null,
      onchainTx: body?.onchainTx ? String(body.onchainTx) : null,
      taskId: body?.taskId ? String(body.taskId) : null,
      projectId: body?.projectId ? String(body.projectId) : null,
      nodeId: body?.nodeId ? String(body.nodeId) : null
    }
  });

  return NextResponse.json({ ok: true, evidence });
}

