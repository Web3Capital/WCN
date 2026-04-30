import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requirePermission, requireSignedIn } from "@/lib/admin";
import { isAdminRole } from "@/lib/permissions";
import { ownsProject } from "@/lib/auth/resource-scope";
import { validateUpload } from "@/lib/modules/storage/constraints";
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
  const auth = await requirePermission("create", "file");
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const project = await prisma.project.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!project) return apiNotFound("Project");

  // Row-level: non-admin must own this project to attach files to it.
  const isAdmin = isAdminRole(auth.session.user?.role ?? "USER");
  if (!isAdmin && !(await ownsProject(prisma, auth.session.user!.id, params.id))) {
    return apiUnauthorized();
  }

  const body = await req.json().catch(() => ({}));
  const { filename, contentType, sizeBytes } = body;
  if (!filename || !contentType) {
    return apiValidationError([{ path: "filename", message: "filename and contentType are required." }]);
  }

  // Apply the same MIME / size constraints as /api/files (lib/core/validation.ts)
  // so this side-channel can't bypass the upload allowlist.
  const validationErr = validateUpload({ contentType, sizeBytes: typeof sizeBytes === "number" ? sizeBytes : null });
  if (validationErr) {
    if (validationErr.code === "MIME_NOT_ALLOWED") {
      return apiValidationError([{ path: "contentType", message: `MIME type not allowed: ${validationErr.mime}` }]);
    }
    if (validationErr.code === "SIZE_TOO_LARGE") {
      return apiValidationError([{ path: "sizeBytes", message: `File too large: ${validationErr.sizeBytes} > ${validationErr.maxBytes}` }]);
    }
    if (validationErr.code === "SIZE_REQUIRED") {
      return apiValidationError([{ path: "sizeBytes", message: "sizeBytes is required" }]);
    }
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
      uploaderUserId: auth.session.user!.id,
    },
  });

  return apiOk({ file: record, upload });
}
