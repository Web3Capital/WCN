import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const theme = body?.theme === "light" || body?.theme === "dark" ? body.theme : "system";

  const res = NextResponse.json({ ok: true, theme });
  res.cookies.set("wcn_theme", theme, {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 365
  });
  return res;
}

