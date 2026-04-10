import type { PrismaClient } from "@prisma/client";
import { sendEmail } from "@/lib/modules/email/client";

export async function sendDigestForUser(
  prisma: PrismaClient,
  userId: string,
  period: "daily" | "weekly",
): Promise<boolean> {
  const since = new Date();
  since.setDate(since.getDate() - (period === "daily" ? 1 : 7));

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });
  if (!user?.email) return false;

  const notifications = await prisma.notification.findMany({
    where: { userId, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  if (notifications.length === 0) return false;

  const grouped = new Map<string, number>();
  for (const n of notifications) {
    const type = n.type ?? "general";
    grouped.set(type, (grouped.get(type) ?? 0) + 1);
  }

  const summaryHtml = [...grouped.entries()]
    .map(([type, count]) => `<li><strong>${type.replace(/_/g, " ")}</strong>: ${count} notification${count > 1 ? "s" : ""}</li>`)
    .join("");

  await sendEmail({
    to: user.email,
    subject: `WCN ${period === "daily" ? "Daily" : "Weekly"} Digest — ${notifications.length} updates`,
    html: `
      <h2>Hi ${user.name ?? "there"},</h2>
      <p>Here's your ${period} summary:</p>
      <ul>${summaryHtml}</ul>
      <p>Total: ${notifications.length} notification${notifications.length > 1 ? "s" : ""}</p>
      <p><a href="${process.env.NEXTAUTH_URL}/dashboard">View Dashboard</a></p>
    `,
  });

  return true;
}

export async function sendDigestsForPeriod(
  prisma: PrismaClient,
  period: "daily" | "weekly",
): Promise<number> {
  const prefs = await prisma.notificationPreference.findMany({
    where: { channel: "EMAIL", enabled: true },
  });

  let sent = 0;
  for (const pref of prefs) {
    const success = await sendDigestForUser(prisma, pref.userId, period);
    if (success) sent++;
  }
  return sent;
}
