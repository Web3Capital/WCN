import crypto from "crypto";

/**
 * In-memory OTP store with TTL. Production should use Redis.
 * Falls back to memory store when Redis is not configured.
 */
const otpStore = new Map<string, { code: string; expiresAt: number; attempts: number }>();

const OTP_LENGTH = 6;
const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_VERIFY_ATTEMPTS = 5;
const MAX_SEND_PER_PHONE = 5;
const SEND_WINDOW_MS = 60 * 60 * 1000;

const sendCount = new Map<string, { count: number; windowStart: number }>();

function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export async function sendOTP(phone: string): Promise<{ ok: boolean; error?: string }> {
  const normalizedPhone = phone.replace(/\s+/g, "").trim();
  if (!/^\+?\d{8,15}$/.test(normalizedPhone)) {
    return { ok: false, error: "Invalid phone number format" };
  }

  const now = Date.now();
  const sc = sendCount.get(normalizedPhone);
  if (sc && now - sc.windowStart < SEND_WINDOW_MS && sc.count >= MAX_SEND_PER_PHONE) {
    return { ok: false, error: "Too many OTP requests. Try again later." };
  }

  const code = generateOTP();
  otpStore.set(normalizedPhone, { code, expiresAt: now + OTP_TTL_MS, attempts: 0 });

  if (sc && now - sc.windowStart < SEND_WINDOW_MS) {
    sc.count++;
  } else {
    sendCount.set(normalizedPhone, { count: 1, windowStart: now });
  }

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (sid && token && from) {
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
      const body = new URLSearchParams({
        To: normalizedPhone,
        From: from,
        Body: `[WCN] Your verification code is: ${code}. Valid for 5 minutes.`,
      });

      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error("Twilio SMS send failed:", err);
        return { ok: false, error: "Failed to send SMS" };
      }
    } catch (err) {
      console.error("Twilio SMS error:", err);
      return { ok: false, error: "Failed to send SMS" };
    }
  } else {
    // Dev fallback: log to console
    console.log(`[SMS OTP] ${normalizedPhone}: ${code}`);
  }

  return { ok: true };
}

export async function verifyOTP(phone: string, code: string): Promise<boolean> {
  const normalizedPhone = phone.replace(/\s+/g, "").trim();
  const entry = otpStore.get(normalizedPhone);

  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(normalizedPhone);
    return false;
  }

  entry.attempts++;
  if (entry.attempts > MAX_VERIFY_ATTEMPTS) {
    otpStore.delete(normalizedPhone);
    return false;
  }

  if (entry.code !== code) return false;

  otpStore.delete(normalizedPhone);
  return true;
}
