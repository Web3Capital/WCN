import crypto from "crypto";
import { getRedis } from "@/lib/redis";

const OTP_LENGTH = 6;
const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_TTL_S = Math.ceil(OTP_TTL_MS / 1000);
const MAX_VERIFY_ATTEMPTS = 5;
const MAX_SEND_PER_PHONE = 5;
const SEND_WINDOW_S = 3600;

const memOtpStore = new Map<string, { code: string; expiresAt: number; attempts: number }>();
const memSendCount = new Map<string, { count: number; windowStart: number }>();

function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

function otpKey(phone: string) { return `wcn:otp:${phone}`; }
function sendKey(phone: string) { return `wcn:otp:send:${phone}`; }

export async function sendOTP(phone: string): Promise<{ ok: boolean; error?: string }> {
  const normalizedPhone = phone.replace(/\s+/g, "").trim();
  if (!/^\+?\d{8,15}$/.test(normalizedPhone)) {
    return { ok: false, error: "Invalid phone number format" };
  }

  const redis = getRedis();
  const now = Date.now();

  if (redis) {
    const sendCountStr = await redis.get<string>(sendKey(normalizedPhone));
    const sendCountNum = sendCountStr ? parseInt(sendCountStr, 10) : 0;
    if (sendCountNum >= MAX_SEND_PER_PHONE) {
      return { ok: false, error: "Too many OTP requests. Try again later." };
    }
  } else {
    const sc = memSendCount.get(normalizedPhone);
    if (sc && now - sc.windowStart < SEND_WINDOW_S * 1000 && sc.count >= MAX_SEND_PER_PHONE) {
      return { ok: false, error: "Too many OTP requests. Try again later." };
    }
  }

  const code = generateOTP();

  if (redis) {
    await redis.set(otpKey(normalizedPhone), JSON.stringify({ code, attempts: 0 }), { ex: OTP_TTL_S });
    const existed = await redis.exists(sendKey(normalizedPhone));
    if (existed) {
      await redis.incr(sendKey(normalizedPhone));
    } else {
      await redis.set(sendKey(normalizedPhone), "1", { ex: SEND_WINDOW_S });
    }
  } else {
    memOtpStore.set(normalizedPhone, { code, expiresAt: now + OTP_TTL_MS, attempts: 0 });
    const sc = memSendCount.get(normalizedPhone);
    if (sc && now - sc.windowStart < SEND_WINDOW_S * 1000) {
      sc.count++;
    } else {
      memSendCount.set(normalizedPhone, { count: 1, windowStart: now });
    }
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
    if (process.env.NODE_ENV === "development") {
      console.log(`[SMS OTP] ${normalizedPhone}: ${code}`);
    }
  }

  return { ok: true };
}

export async function verifyOTP(phone: string, code: string): Promise<boolean> {
  const normalizedPhone = phone.replace(/\s+/g, "").trim();
  const redis = getRedis();

  if (redis) {
    const raw = await redis.get<string>(otpKey(normalizedPhone));
    if (!raw) return false;
    const entry = typeof raw === "string" ? JSON.parse(raw) : raw;
    entry.attempts = (entry.attempts ?? 0) + 1;
    if (entry.attempts > MAX_VERIFY_ATTEMPTS) {
      await redis.del(otpKey(normalizedPhone));
      return false;
    }
    if (entry.code !== code) {
      await redis.set(otpKey(normalizedPhone), JSON.stringify(entry), { ex: OTP_TTL_S });
      return false;
    }
    await redis.del(otpKey(normalizedPhone));
    return true;
  }

  const entry = memOtpStore.get(normalizedPhone);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    memOtpStore.delete(normalizedPhone);
    return false;
  }
  entry.attempts++;
  if (entry.attempts > MAX_VERIFY_ATTEMPTS) {
    memOtpStore.delete(normalizedPhone);
    return false;
  }
  if (entry.code !== code) return false;
  memOtpStore.delete(normalizedPhone);
  return true;
}
