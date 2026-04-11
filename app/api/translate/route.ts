import { NextRequest, NextResponse } from "next/server";
import { autoTranslate } from "@/lib/i18n/auto-translate";
import { requireSignedIn } from "@/lib/admin";
import { apiUnauthorized } from "@/lib/core/api-response";

export async function POST(req: NextRequest) {
  const auth = await requireSignedIn();
  if (!auth.ok) return apiUnauthorized();

  try {
    const { strings, locale } = await req.json();

    if (!locale || typeof locale !== "string") {
      return NextResponse.json({ error: "Missing locale" }, { status: 400 });
    }

    if (!Array.isArray(strings) || strings.length === 0) {
      return NextResponse.json({ translations: {} });
    }

    if (strings.length > 200) {
      return NextResponse.json({ error: "Too many strings (max 200)" }, { status: 400 });
    }

    const translations = await autoTranslate(strings, locale);
    return NextResponse.json({ translations });
  } catch {
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}
