import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const file = await prisma.file.findUnique({ where: { id } });
  if (!file) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  if (file.previewStatus !== "READY") {
    return NextResponse.json({ ok: false, error: "Preview not available." }, { status: 404 });
  }

  await prisma.fileAccessLog.create({
    data: {
      fileId: id,
      userId: session.user.id,
      action: "PREVIEW",
      workspaceId: file.workspaceId,
    },
  });

  return NextResponse.json({
    ok: true,
    preview: {
      filename: file.filename,
      mimeType: file.mimeType,
      storageKey: file.storageKey,
    },
  });
}
