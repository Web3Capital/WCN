import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { route } from "@/lib/core/api/route";
import { listAdapters } from "@/lib/modules/ingestion/registry";
import type { Prisma } from "@prisma/client";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.string().min(1),
  config: z.record(z.string(), z.unknown()).optional(),
  schedule: z.string().optional(),
  enabled: z.boolean().optional(),
});

export const GET = route.permission({
  input: z.object({}),
  rateLimit: "auth",
  permission: { action: "manage", resource: "node" },
  handler: async () => {
    const prisma = getPrisma();
    const sources = await prisma.ingestionSource.findMany({
      orderBy: { createdAt: "desc" },
      include: { runs: { take: 3, orderBy: { startedAt: "desc" } } },
    });

    return { sources, adapters: listAdapters() };
  },
});

export const POST = route.permission({
  input: createSchema,
  rateLimit: "write",
  permission: { action: "manage", resource: "node" },
  successStatus: 201,
  handler: async ({ input, session }) => {
    const prisma = getPrisma();
    const source = await prisma.ingestionSource.create({
      data: {
        name: input.name,
        type: input.type,
        config: (input.config ?? {}) as Prisma.InputJsonObject,
        schedule: input.schedule ?? null,
        enabled: input.enabled ?? true,
        createdById: session.user.id,
      },
    });

    return source;
  },
});
