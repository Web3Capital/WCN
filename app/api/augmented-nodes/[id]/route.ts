import "@/lib/core/init";
import { HttpError, route } from "@/lib/core/api/route";
import { resolveAugmentedNode } from "@/lib/modules/augmented-node";
import { z } from "zod";

const emptyInputSchema = z.object({});

export const GET = route.session<z.infer<typeof emptyInputSchema>, unknown, { id: string }>({
  input: emptyInputSchema,
  rateLimit: "auth",
  handler: async ({ params }) => {
    const view = await resolveAugmentedNode(params.id);
    if (!view) throw new HttpError(404, "NOT_FOUND", "Node not found.");

    return view;
  },
});
