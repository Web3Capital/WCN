import "@/lib/core/init";
import { getPrisma } from "@/lib/prisma";
import { requireSignedIn } from "@/lib/admin";
import { apiOk, apiUnauthorized, apiValidationError, apiNotFound } from "@/lib/core/api-response";
import { z } from "zod";

const savedSearchSchema = z.object({
  name: z.string().min(1).max(100),
  query: z.string().min(1),
  filters: z.record(z.string(), z.string()).optional(),
  notifyOnNew: z.boolean().optional(),
});

export async function GET() {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const prisma = getPrisma();
  const searches = await prisma.savedSearch.findMany({
    where: { userId: auth.session.user!.id },
    orderBy: { createdAt: "desc" },
  });

  return apiOk(searches);
}

export async function POST(req: Request) {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const body = await req.json().catch(() => ({}));
  const parsed = savedSearchSchema.safeParse(body);
  if (!parsed.success) {
    return apiValidationError(parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })));
  }

  const prisma = getPrisma();
  const search = await prisma.savedSearch.create({
    data: {
      userId: auth.session.user!.id,
      name: parsed.data.name,
      query: parsed.data.query,
      filters: (parsed.data.filters ?? {}) as any,
      notifyOnNew: parsed.data.notifyOnNew ?? false,
    },
  });

  return apiOk(search);
}

export async function DELETE(req: Request) {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return apiValidationError([{ path: "id", message: "id required" }]);

  const prisma = getPrisma();
  const existing = await prisma.savedSearch.findUnique({ where: { id } });
  if (!existing || existing.userId !== auth.session.user!.id) return apiNotFound("Saved search");

  await prisma.savedSearch.delete({ where: { id } });
  return apiOk({ deleted: true });
}
