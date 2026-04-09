import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const workspaceId = url.searchParams.get("workspaceId");
  const entityType = url.searchParams.get("entityType");
  const limit = Math.min(Number(url.searchParams.get("limit")) || 20, 50);

  if (!q || q.length < 2) {
    return NextResponse.json({ ok: true, results: [] });
  }

  const where: Record<string, unknown> = {};
  if (workspaceId) where.workspaceId = workspaceId;
  if (entityType) where.entityType = entityType;

  where.OR = [
    { title: { contains: q, mode: "insensitive" } },
    { subtitle: { contains: q, mode: "insensitive" } },
    { body: { contains: q, mode: "insensitive" } },
    { tags: { has: q } },
  ];

  const results = await prisma.searchDocument.findMany({
    where: where as any,
    take: limit,
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ ok: true, results });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));
  const { workspaceId, entityType, entityId, title, subtitle, bodyText, tags } = body;

  if (!workspaceId || !entityType || !entityId || !title) {
    return NextResponse.json({ ok: false, error: "Missing required fields." }, { status: 400 });
  }

  const doc = await prisma.searchDocument.upsert({
    where: { workspaceId_entityType_entityId: { workspaceId, entityType, entityId } },
    create: {
      workspaceId,
      entityType,
      entityId,
      title,
      subtitle: subtitle ?? null,
      body: bodyText ?? null,
      tags: tags ?? [],
    },
    update: {
      title,
      subtitle: subtitle ?? null,
      body: bodyText ?? null,
      tags: tags ?? [],
    },
  });

  return NextResponse.json({ ok: true, doc });
}
