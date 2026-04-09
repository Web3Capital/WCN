import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requireSignedIn } from "@/lib/admin";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireSignedIn();
  if (!auth.ok) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));
  const content = String(body?.content ?? "").trim();
  if (!content) return NextResponse.json({ ok: false, error: "Content required." }, { status: 400 });

  const note = await prisma.dealNote.create({
    data: { dealId: params.id, authorId: auth.session.user!.id, content },
  });

  return NextResponse.json({ ok: true, note });
}
