import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requireSignedIn } from "@/lib/admin";
import { apiOk, apiUnauthorized, apiValidationError } from "@/lib/core/api-response";
import { z } from "zod";

const prefSchema = z.object({
  channel: z.enum(["EMAIL", "TELEGRAM", "SLACK", "IN_APP"]),
  enabled: z.boolean(),
  eventTypes: z.array(z.string()).optional(),
});

export async function GET() {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const prefs = await prisma.notificationPreference.findMany({
    where: { userId: auth.session.user!.id },
  });

  return apiOk(prefs);
}

export async function PATCH(req: Request) {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const body = await req.json().catch(() => ({}));
  const parsed = prefSchema.safeParse(body);
  if (!parsed.success) {
    return apiValidationError(parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })));
  }

  const prisma = getPrisma();
  const userId = auth.session.user!.id;

  const pref = await prisma.notificationPreference.upsert({
    where: { userId_channel: { userId, channel: parsed.data.channel as any } },
    create: {
      userId,
      channel: parsed.data.channel as any,
      enabled: parsed.data.enabled,
      eventTypes: parsed.data.eventTypes ?? [],
    },
    update: {
      enabled: parsed.data.enabled,
      eventTypes: parsed.data.eventTypes ?? undefined,
    },
  });

  return apiOk(pref);
}
