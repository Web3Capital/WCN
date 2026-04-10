import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { apiOk, apiUnauthorized, apiNotFound } from "@/lib/core/api-response";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requirePermission("create", "file");
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const file = await prisma.file.findUnique({ where: { id } });
  if (!file) return apiNotFound("File");

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

  return apiOk(updated);
}
