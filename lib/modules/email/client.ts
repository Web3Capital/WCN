/**
 * @wcn/email — Email Transport
 *
 * Uses Resend in production (RESEND_API_KEY env var).
 * Falls back to console logging in development.
 */

import { Resend } from "resend";

const FROM_ADDRESS = process.env.EMAIL_FROM ?? "WCN <noreply@wcn.network>";

let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (_resend) return _resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  _resend = new Resend(key);
  return _resend;
}

export interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(payload: EmailPayload): Promise<{ id?: string; success: boolean }> {
  const resend = getResend();

  if (!resend) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[Email/Dev] To: ${Array.isArray(payload.to) ? payload.to.join(", ") : payload.to}`);
      console.log(`[Email/Dev] Subject: ${payload.subject}`);
    }
    return { success: true };
  }

  try {
    const result = await resend.emails.send({
      from: FROM_ADDRESS,
      to: Array.isArray(payload.to) ? payload.to : [payload.to],
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });

    return { id: result.data?.id, success: true };
  } catch (error) {
    console.error("[Email] Send failed:", error);
    return { success: false };
  }
}
