import { sendEmail } from "@/lib/modules/email/client";
import { sseManager } from "@/lib/modules/realtime/sse";

export type NotificationPayload = {
  userId: string;
  title: string;
  body: string;
  url?: string;
  type?: string;
};

export async function dispatchToEmail(
  email: string,
  payload: NotificationPayload,
): Promise<void> {
  await sendEmail({
    to: email,
    subject: payload.title,
    html: `
      <h3>${payload.title}</h3>
      <p>${payload.body}</p>
      ${payload.url ? `<p><a href="${process.env.NEXTAUTH_URL}${payload.url}">View Details</a></p>` : ""}
    `,
  });
}

export async function dispatchToTelegram(
  chatId: string,
  payload: NotificationPayload,
): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return;

  const text = `*${payload.title}*\n${payload.body}${payload.url ? `\n[View](${process.env.NEXTAUTH_URL}${payload.url})` : ""}`;

  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  }).catch(() => {});
}

export async function dispatchToSlack(
  webhookUrl: string,
  payload: NotificationPayload,
): Promise<void> {
  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: `*${payload.title}*\n${payload.body}`,
      ...(payload.url ? { attachments: [{ text: `<${process.env.NEXTAUTH_URL}${payload.url}|View Details>` }] } : {}),
    }),
  }).catch(() => {});
}

export function dispatchToSSE(userId: string, payload: NotificationPayload): void {
  sseManager.sendToUser(userId, "notification", payload);
}
