import "@/lib/core/init";
import { AuditAction, writeAudit } from "@/lib/audit";
import { route } from "@/lib/core/api/route";
import { activatePolicy } from "@/lib/modules/policy";
import { z } from "zod";

const emptyInputSchema = z.object({});

export const POST = route.permission<z.infer<typeof emptyInputSchema>, unknown, { id: string }>({
  input: emptyInputSchema,
  rateLimit: "write",
  permission: { action: "manage", resource: "policy" },
  handler: async ({ params, session }) => {
    const { id } = params;
    const userId = session.user.id;

    await activatePolicy(id, userId);

    await writeAudit({
      actorUserId: userId,
      action: AuditAction.POLICY_ACTIVATE,
      targetType: "POLICY",
      targetId: id,
      metadata: { action: "activate" },
    });

    return { id, status: "ACTIVE" };
  },
});
