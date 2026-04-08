import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getPrisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const prisma = getPrisma();
  const body = await req.json().catch(() => ({}));

  const name = body?.name ? String(body.name).trim() : null;
  const emailRaw = String(body?.email ?? "");
  const email = emailRaw.toLowerCase().trim();
  const password = String(body?.password ?? "");

  if (!email || !email.includes("@")) {
    return NextResponse.json({ ok: false, error: "Invalid email." }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return NextResponse.json({ ok: false, error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (exists) {
    return NextResponse.json({ ok: false, error: "Email already registered." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      role: "USER"
    },
    select: { id: true, email: true, name: true }
  });

  return NextResponse.json({ ok: true, user });
}

