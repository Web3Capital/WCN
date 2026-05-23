import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { AuditAction, writeAudit } from "@/lib/audit";
import { route, routeResult } from "@/lib/core/api/route";
import { acceptTermsSchema } from "@/lib/core/validation";
import type { TermsAcceptance } from "@prisma/client";
import { z } from "zod";

type AcceptTermsResponse =
  | TermsAcceptance
  | { acceptance: TermsAcceptance; alreadyAccepted: true };

export const GET = route.session({
  input: z.object({}),
  rateLimit: "auth",
  handler: async ({ session }) => {
    const prisma = getPrisma();
    const acceptances = await prisma.termsAcceptance.findMany({
      where: { userId: session.user.id },
      orderBy: { acceptedAt: "desc" },
    });

    return acceptances;
  },
});

export const POST = route.session<z.infer<typeof acceptTermsSchema>, AcceptTermsResponse>({
  input: acceptTermsSchema,
  rateLimit: "write",
  handler: async ({ input, request, session }) => {
    const prisma = getPrisma();
    const { documentType, documentVer, workspaceId } = input;

    const existing = await prisma.termsAcceptance.findFirst({
      where: { userId: session.user.id, documentType, documentVer },
    });
    if (existing) {
      return { acceptance: existing, alreadyAccepted: true };
    }

    const acceptance = await prisma.termsAcceptance.create({
      data: {
        userId: session.user.id,
        documentType,
        documentVer,
        workspaceId: workspaceId ?? null,
        ipAddress: request.headers.get("x-forwarded-for") ?? null,
        deviceInfo: request.headers.get("user-agent") ?? null,
      },
    });

    await writeAudit({
      actorUserId: session.user.id,
      action: AuditAction.TERMS_ACCEPT,
      targetType: "TERMS",
      targetId: acceptance.id,
      metadata: { documentType, documentVer },
    });

    return routeResult(acceptance, 201);
  },
});
