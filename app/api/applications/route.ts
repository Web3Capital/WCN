import { getPrisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const applicantName = String(body?.applicantName ?? "").trim();
  const contact = String(body?.contact ?? "").trim();

  if (!applicantName || !contact) {
    return NextResponse.json({ ok: false, error: "Missing required fields." }, { status: 400 });
  }

  const session = await getServerSession(authOptions);

  const app = await prisma.application.create({
    data: {
      applicantName,
      contact,
      organization: body?.organization ? String(body.organization).trim() : null,
      role: body?.role ? String(body.role).trim() : null,
      nodeType: body?.nodeType ? String(body.nodeType).trim() : null,
      resources: body?.resources ? String(body.resources).trim() : null,
      lookingFor: body?.lookingFor ? String(body.lookingFor).trim() : null,
      linkedin: body?.linkedin ? String(body.linkedin).trim() : null,
      whyWcn: body?.whyWcn ? String(body.whyWcn).trim() : null,
      userId: session?.user?.id ?? null
    }
  });

  return NextResponse.json({ ok: true, applicationId: app.id });
}

export async function GET() {
  const prisma = getPrisma();
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const apps = await prisma.application.findMany({
    orderBy: { createdAt: "desc" },
    take: 200
  });

  return NextResponse.json({ ok: true, applications: apps });
}

