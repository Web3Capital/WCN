import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { AccountSettings } from "./ui";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const prisma = getPrisma();
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { twoFactorEnabled: true },
  });

  return (
    <main className="section" style={{ minHeight: "80vh" }}>
      <div className="container" style={{ maxWidth: 600 }}>
        <span className="eyebrow">Account</span>
        <h1>Settings</h1>
        <AccountSettings
          name={session.user.name ?? ""}
          email={session.user.email ?? ""}
          role={session.user.role}
          has2FA={dbUser?.twoFactorEnabled ?? false}
        />
      </div>
    </main>
  );
}
