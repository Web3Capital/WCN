import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import { Link, redirect } from "@/i18n/routing";
import { LoginTabs } from "./login-tabs";
import { WCNGlyph } from "@/components/brand/wcn-glyph";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("loginTitle") };
}

export default async function LoginPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { callbackUrl?: string; error?: string };
}) {
  const session = await getServerSession(authOptions);
  const blocked = searchParams.error === "blocked";
  if (session?.user && !blocked) {
    redirect({ href: "/dashboard", locale });
  }

  const t = await getTranslations("auth");

  const oauthError =
    searchParams.error === "OAuthAccountNotLinked"
      ? t("oauthAccountLinked")
      : searchParams.error && searchParams.error !== "blocked"
        ? t("authFailed")
        : null;

  return (
    <main className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <span className="auth-glyph" aria-hidden>
            <WCNGlyph size={22} variant="ledger" />
          </span>
          <h1>{t.rich("welcomeBack", { em: (chunks) => <em>{chunks}</em> })}</h1>
          <p>{t("signInToAccount")}</p>
        </div>

        <div className="card auth-card">
          {oauthError && (
            <p className="form-error" role="alert" style={{ marginBottom: 16 }}>
              {oauthError}
            </p>
          )}

          <LoginTabs />

          <p className="auth-footer-link">
            {t("noAccount")}{" "}
            <Link href="/signup">{t("createOne")}</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
