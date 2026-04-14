import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin, requireSignedIn } from "@/lib/admin";
import { isAdminRole } from "@/lib/permissions";
import { apiOk, apiUnauthorized, apiNotFound, apiValidationError } from "@/lib/core/api-response";
import { generatePresignedUpload, buildStorageKey } from "@/lib/modules/storage/service";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const project = await prisma.project.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!project) return apiNotFound("Project");

  const files = await prisma.file.findMany({
    where: { entityType: "PROJECT", entityId: params.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { uploader: { select: { name: true, email: true } } },
  });

  return apiOk({ files });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const project = await prisma.project.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!project) return apiNotFound("Project");

  const body = await req.json().catch(() => ({}));
  const { filename, contentType, sizeBytes } = body;
  if (!filename || !contentType) {
    return apiValidationError([{ path: "filename", message: "filename and contentType are required." }]);
  }

  const storageKey = buildStorageKey("PROJECT", params.id, filename);
  const upload = await generatePresignedUpload(storageKey, contentType);

  const record = await prisma.file.create({
    data: {
      filename,
      mimeType: contentType,
      sizeBytes: sizeBytes ?? null,
      storageKey,
      confidentiality: "RESTRICTED",
      entityType: "PROJECT",
      entityId: params.id,
      uploaderUserId: admin.session.user!.id,
    },
  });

  return apiOk({ file: record, upload });
}
