import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { route } from "@/lib/core/api/route";
import { z } from "zod";

const prefSchema = z.object({
  channel: z.enum(["EMAIL", "TELEGRAM", "SLACK", "IN_APP"]),
  enabled: z.boolean(),
  eventTypes: z.array(z.string()).optional(),
});

export const GET = route.session({
  input: z.object({}),
  rateLimit: "auth",
  handler: async ({ session }) => {
    const prisma = getPrisma();
    const prefs = await prisma.notificationPreference.findMany({
      where: { userId: session.user.id },
    });

    return prefs;
  },
});

export const PATCH = route.session({
  input: prefSchema,
  rateLimit: "write",
  handler: async ({ input, session }) => {
    const prisma = getPrisma();
    const userId = session.user.id;

    const pref = await prisma.notificationPreference.upsert({
      where: { userId_channel: { userId, channel: input.channel } },
      create: {
        userId,
        channel: input.channel,
        enabled: input.enabled,
        eventTypes: input.eventTypes ?? [],
      },
      update: {
        enabled: input.enabled,
        eventTypes: input.eventTypes ?? undefined,
      },
    });

    return pref;
  },
});
