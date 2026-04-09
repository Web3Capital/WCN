import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requirePermission("create", "file");
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const file = await prisma.file.findUnique({ where: { id } });
  if (!file) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  const updated = await prisma.file.update({
    where: { id },
    data: {
      sizeBytes: body?.sizeBytes ?? file.sizeBytes,
      hash: body?.hash ?? file.hash,
      checksumAlgorithm: body?.checksumAlgorithm ?? file.checksumAlgorithm,
      scanStatus: "PASSED",
      previewStatus: body?.hasPreview ? "READY" : "PENDING",
    },
  });

  return NextResponse.json({ ok: true, file: updated });
}
