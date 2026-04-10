import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AuditAction, writeAudit } from "@/lib/audit";
import { apiOk, apiCreated, apiUnauthorized, zodToApiError } from "@/lib/core/api-response";
import { parseBody, acceptTermsSchema } from "@/lib/core/validation";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return apiUnauthorized();

  const prisma = getPrisma();
  const acceptances = await prisma.termsAcceptance.findMany({
    where: { userId: session.user.id },
    orderBy: { acceptedAt: "desc" },
  });

  return apiOk(acceptances);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return apiUnauthorized();

  const body = await req.json().catch(() => ({}));
  const parsed = parseBody(acceptTermsSchema, body);
  if (!parsed.ok) return zodToApiError(parsed.error);

  const prisma = getPrisma();
  const { documentType, documentVer, workspaceId } = parsed.data;

  const existing = await prisma.termsAcceptance.findFirst({
    where: { userId: session.user.id, documentType: documentType as any, documentVer },
  });
  if (existing) {
    return apiOk({ acceptance: existing, alreadyAccepted: true });
  }

  const acceptance = await prisma.termsAcceptance.create({
    data: {
      userId: session.user.id,
      documentType: documentType as any,
      documentVer,
      workspaceId: workspaceId ?? null,
      ipAddress: req.headers.get("x-forwarded-for") ?? null,
      deviceInfo: req.headers.get("user-agent") ?? null,
    },
  });

  await writeAudit({
    actorUserId: session.user.id,
    action: AuditAction.TERMS_ACCEPT,
    targetType: "TERMS",
    targetId: acceptance.id,
    metadata: { documentType, documentVer },
  });

  return apiCreated(acceptance);
}
