import "@/lib/core/init";
import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { route } from "@/lib/core/api/route";
import { createApplicationSchema } from "@/lib/core/validation";
import { eventBus } from "@/lib/core/event-bus";
import { Events } from "@/lib/core/event-types";

// Migration to ADR-0005 — first example route on the typed builder.
// See lib/core/api/README.md for the migration cookbook.

/**
 * Public node application form. Anyone can apply (authed or not).
 * If the caller has a session, the application is associated with their user.
 * Rate-limited under the `write` profile (30/min per IP).
 */
export const POST = route.public({
  input: createApplicationSchema,
  rateLimit: "write",
  successStatus: 201,
  handler: async ({ input }) => {
    const prisma = getPrisma();
    // Public endpoint, but opportunistically associate with a logged-in user.
    const session = await getServerSession(authOptions);

    const app = await prisma.application.create({
      data: {
        applicantName: input.applicantName,
        contact: input.contact,
        organization: input.organization ?? null,
        role: input.role ?? null,
        nodeType: input.nodeType ?? null,
        territory: input.territory ?? null,
        resources: input.resources ?? null,
        lookingFor: input.lookingFor ?? null,
        linkedin: input.linkedin ?? null,
        whyWcn: input.whyWcn ?? null,
        pastCases: input.pastCases ?? null,
        references: input.references ?? null,
        boundaryStatement: input.boundaryStatement ?? null,
        userId: session?.user?.id ?? null,
      },
    });

    await eventBus.emit(Events.APPLICATION_SUBMITTED, {
      applicationId: app.id,
      applicantName: input.applicantName,
      nodeType: input.nodeType ?? undefined,
    });

    return { applicationId: app.id };
  },
});

/**
 * List recent applications. Read permission on `node` resource (admins +
 * node-owners + reviewers per the matrix).
 */
export const GET = route.permission({
  input: z.object({}),
  rateLimit: "public",
  permission: { action: "read", resource: "node" },
  handler: async () => {
    const prisma = getPrisma();
    const apps = await prisma.application.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return apps;
  },
});
