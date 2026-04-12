import { NextResponse } from "next/server";
import { sendOTP } from "@/lib/modules/sms/otp";
import { rateLimitSms } from "@/lib/rate-limit";
import { z } from "zod";

const schema = z.object({
  phone: z.string().min(8).max(20),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid phone number" },
      { status: 400 },
    );
  }

  const rl = await rateLimitSms(parsed.data.phone);
  if (!rl.success) {
    return NextResponse.json(
      { ok: false, error: "Too many SMS requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((rl.reset - Date.now()) / 1000)),
        },
      },
    );
  }

  const result = await sendOTP(parsed.data.phone);

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 429 },
    );
  }

  return NextResponse.json({ ok: true });
}
