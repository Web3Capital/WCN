import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requireSignedIn } from "@/lib/admin";
import { apiCreated, apiUnauthorized, zodToApiError } from "@/lib/core/api-response";
import { parseBody, createDealNoteSchema } from "@/lib/core/validation";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const body = await req.json().catch(() => ({}));
  const parsed = parseBody(createDealNoteSchema, body);
  if (!parsed.ok) return zodToApiError(parsed.error);

  const prisma = getPrisma();
  const note = await prisma.dealNote.create({
    data: { dealId: params.id, authorId: auth.session.user!.id, content: parsed.data.content },
  });

  return apiCreated(note);
}
