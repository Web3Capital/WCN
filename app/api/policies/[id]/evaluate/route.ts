import "@/lib/core/init";
import { route } from "@/lib/core/api/route";
import { evaluatePolicy } from "@/lib/modules/policy";
import { z } from "zod";

const evaluatePolicySchema = z.object({
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  entity: z.record(z.string(), z.unknown()).optional(),
});

export const POST = route.permission<z.infer<typeof evaluatePolicySchema>, unknown, { id: string }>({
  input: evaluatePolicySchema,
  rateLimit: "write",
  permission: { action: "review", resource: "policy" },
  handler: async ({ input, params }) => {
    const { entityType, entityId, entity } = input;

    if (!entityType || !entityId || !entity) {
      return { error: "entityType, entityId, and entity are required" };
    }

    return evaluatePolicy(params.id, entityType, entityId, entity);
  },
});
