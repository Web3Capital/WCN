import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { apiOk, apiCreated, apiUnauthorized, zodToApiError } from "@/lib/core/api-response";
import { parseBody, createApplicationSchema } from "@/lib/core/validation";
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = parseBody(createApplicationSchema, body);
  if (!parsed.ok) return zodToApiError(parsed.error);

  const prisma = getPrisma();
  const session = await getServerSession(authOptions);
  const d = parsed.data;

  const app = await prisma.application.create({
    data: {
      applicantName: d.applicantName,
      contact: d.contact,
      organization: d.organization ?? null,
      role: d.role ?? null,
      nodeType: d.nodeType ?? null,
      territory: d.territory ?? null,
      resources: d.resources ?? null,
      lookingFor: d.lookingFor ?? null,
      linkedin: d.linkedin ?? null,
      whyWcn: d.whyWcn ?? null,
      pastCases: d.pastCases ?? null,
      references: d.references ?? null,
      boundaryStatement: d.boundaryStatement ?? null,
      userId: session?.user?.id ?? null,
    },
  });

  await eventBus.emit(Events.APPLICATION_SUBMITTED, {
    applicationId: app.id,
    applicantName: d.applicantName,
    nodeType: d.nodeType ?? undefined,
  });

  return apiCreated({ applicationId: app.id });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return apiUnauthorized();

  const prisma = getPrisma();
  const apps = await prisma.application.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return apiOk(apps);
}
