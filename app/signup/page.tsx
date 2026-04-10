import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SignupForm } from "./ui";
import { OAuthButtons, WalletLoginButton } from "../login/oauth-buttons";
import { PhoneLoginForm } from "../login/phone-form";
import { SignupTabs } from "./signup-tabs";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Create Account — WCN",
};

export default async function SignupPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) redirect("/dashboard");

  return (
    <main className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Join WCN</h1>
          <p>Create your account to get started</p>
        </div>

        <div className="card auth-card">
          <SignupTabs />

          <p className="auth-footer-link">
            Already have an account?{" "}
            <Link href="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
