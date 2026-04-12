import { redirect } from "@/i18n/routing";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { TranslatedPage } from "@/lib/i18n/translate-page";
import { AccountSettings } from "./ui";

export const dynamic = "force-dynamic";

const PAGE_STRINGS = ["Account", "Settings"];

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect({ href: "/login", locale });
    return null;
  }

  const prisma = getPrisma();
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { twoFactorEnabled: true },
  });

  return (
    <TranslatedPage locale={locale} strings={PAGE_STRINGS}>
      <main className="section" style={{ minHeight: "80vh" }}>
        <div className="container" style={{ maxWidth: 600 }}>
          <span className="eyebrow">Account</span>
          <h1>Settings</h1>
          <AccountSettings
            name={session.user.name ?? ""}
            email={session.user.email ?? ""}
            role={(session.user as any).role}
            has2FA={dbUser?.twoFactorEnabled ?? false}
          />
        </div>
      </main>
    </TranslatedPage>
  );
}
