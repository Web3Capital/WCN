import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { Link, redirect } from "@/i18n/routing";
import { SignupForm } from "./ui";
import { OAuthButtons, WalletLoginButton } from "../login/oauth-buttons";
import { PhoneLoginForm } from "../login/phone-form";
import { SignupTabs } from "./signup-tabs";
import { WCNGlyph } from "@/components/brand/wcn-glyph";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("signupTitle") };
}

export default async function SignupPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    redirect({ href: "/dashboard", locale });
  }

  const t = await getTranslations("auth");

  return (
    <main className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <span className="auth-glyph" aria-hidden>
            <WCNGlyph size={22} variant="ledger" />
          </span>
          <h1>{t.rich("signupHeadline", { em: (chunks) => <em>{chunks}</em> })}</h1>
          <p>{t("signupSubtext")}</p>
        </div>

        <div className="card auth-card">
          <SignupTabs />

          <p className="auth-footer-link">
            {t("alreadyHaveAccount")}{" "}
            <Link href="/login">{t("signIn")}</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
