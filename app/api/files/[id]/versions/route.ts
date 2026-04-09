import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requirePermission("read", "file");
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const file = await prisma.file.findUnique({ where: { id: params.id } });
  if (!file) {
    return NextResponse.json({ ok: false, error: "File not found." }, { status: 404 });
  }

  const rootId = file.parentFileId || file.id;

  const versions = await prisma.file.findMany({
    where: {
      OR: [
        { id: rootId },
        { parentFileId: rootId },
      ],
    },
    orderBy: { version: "desc" },
    include: { uploader: { select: { name: true, email: true } } },
  });

  return NextResponse.json({ ok: true, versions });
}
