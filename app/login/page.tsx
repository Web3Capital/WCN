import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LoginTabs } from "./login-tabs";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign In — WCN",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string; error?: string };
}) {
  const session = await getServerSession(authOptions);
  const blocked = searchParams.error === "blocked";
  if (session?.user && !blocked) redirect("/dashboard");

  const oauthError = searchParams.error === "OAuthAccountNotLinked"
    ? "An account with this email already exists. Please sign in with your original method."
    : searchParams.error && searchParams.error !== "blocked"
      ? "Authentication failed. Please try again."
      : null;

  return (
    <main className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Welcome back</h1>
          <p>Sign in to your WCN account</p>
        </div>

        <div className="card auth-card">
          {oauthError && (
            <p className="form-error" role="alert" style={{ marginBottom: 16 }}>
              {oauthError}
            </p>
          )}

          <LoginTabs />

          <p className="auth-footer-link">
            Don&apos;t have an account?{" "}
            <Link href="/signup">Create one</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
