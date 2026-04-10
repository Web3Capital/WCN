import "@/lib/core/init";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const lang = body?.lang === "zh" ? "zh" : "en";

  const res = NextResponse.json({ ok: true, data: { lang } });
  res.cookies.set("wcn_lang", lang, {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
