import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin";
import { isAdminRole } from "@/lib/permissions";
import { apiOk, apiUnauthorized, apiNotFound, zodToApiError } from "@/lib/core/api-response";
import { parseBody, completeFileUploadSchema } from "@/lib/core/validation";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requirePermission("create", "file");
  if (!auth.ok) return apiUnauthorized();

  const body = await req.json().catch(() => ({}));
  const parsed = parseBody(completeFileUploadSchema, body);
  if (!parsed.ok) return zodToApiError(parsed.error);

  const prisma = getPrisma();
  const file = await prisma.file.findUnique({ where: { id } });
  if (!file) return apiNotFound("File");

  if (!isAdminRole(auth.session.user?.role ?? "USER") && file.uploaderUserId !== auth.session.user!.id) {
    return apiUnauthorized();
  }

  const d = parsed.data;
  const updated = await prisma.file.update({
    where: { id },
    data: {
      sizeBytes: d.sizeBytes ?? file.sizeBytes,
      hash: d.hash ?? file.hash,
      checksumAlgorithm: d.checksumAlgorithm ?? file.checksumAlgorithm,
      scanStatus: "PASSED",
      previewStatus: d.hasPreview ? "READY" : "PENDING",
    },
  });

  return apiOk(updated);
}
