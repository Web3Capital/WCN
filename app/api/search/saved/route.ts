import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { HttpError, route } from "@/lib/core/api/route";
import type { Prisma } from "@prisma/client";
import { z } from "zod";

const savedSearchSchema = z.object({
  name: z.string().min(1).max(100),
  query: z.string().min(1),
  filters: z.record(z.string(), z.string()).optional(),
  notifyOnNew: z.boolean().optional(),
});

const deleteSavedSearchSchema = z.object({
  id: z.preprocess((value) => value ?? "", z.string().min(1, "id required")),
});

export const GET = route.session({
  input: z.object({}),
  rateLimit: "auth",
  handler: async ({ session }) => {
    const prisma = getPrisma();
    const searches = await prisma.savedSearch.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return searches;
  },
});

export const POST = route.session({
  input: savedSearchSchema,
  rateLimit: "write",
  handler: async ({ input, session }) => {
    const prisma = getPrisma();
    const search = await prisma.savedSearch.create({
      data: {
        userId: session.user.id,
        name: input.name,
        query: input.query,
        filters: (input.filters ?? {}) as Prisma.InputJsonObject,
        notifyOnNew: input.notifyOnNew ?? false,
      },
    });

    return search;
  },
});

export const DELETE = route.session({
  input: deleteSavedSearchSchema,
  rateLimit: "write",
  handler: async ({ input, session }) => {
    const prisma = getPrisma();
    const existing = await prisma.savedSearch.findUnique({ where: { id: input.id } });
    if (!existing || existing.userId !== session.user.id) {
      throw new HttpError(404, "NOT_FOUND", "Saved search not found.");
    }

    await prisma.savedSearch.delete({ where: { id: input.id } });
    return { deleted: true };
  },
});
