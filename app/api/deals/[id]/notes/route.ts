import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requireSignedIn } from "@/lib/admin";
import { isAdminRole } from "@/lib/permissions";
import { apiCreated, apiUnauthorized, apiNotFound, zodToApiError } from "@/lib/core/api-response";
import { parseBody, createDealNoteSchema } from "@/lib/core/validation";
import { getOwnedNodeIds } from "@/lib/member-data-scope";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const userId = auth.session.user!.id;

  if (!isAdminRole(auth.session.user?.role ?? "USER")) {
    const ownedNodeIds = await getOwnedNodeIds(prisma, userId);
    const hasAccess = await prisma.deal.findFirst({
      where: {
        id: params.id,
        OR: [
          { project: { node: { id: { in: ownedNodeIds } } } },
          { participants: { some: { nodeId: { in: ownedNodeIds } } } },
        ],
      },
      select: { id: true },
    });
    if (!hasAccess) return apiNotFound("Deal");
  }

  const body = await req.json().catch(() => ({}));
  const parsed = parseBody(createDealNoteSchema, body);
  if (!parsed.ok) return zodToApiError(parsed.error);

  const note = await prisma.dealNote.create({
    data: { dealId: params.id, authorId: userId, content: parsed.data.content },
  });

  return apiCreated(note);
}
