import { TranslatedPage } from "@/lib/i18n/translate-page";
import TwoFactorChallengeClient from "./client";
import type { Metadata } from "next";

const PAGE_STRINGS = [
  "Security", "Two-Factor Verification",
  "Enter your credentials and the 6-digit code from your authenticator app.",
  "Email", "Password", "Verification code",
  "Please enter a 6-digit code.",
  "Invalid code. Please try again.",
  "Authentication failed. Check your credentials and try again.",
  "Verifying...", "Verify & Sign in",
  "Lost access to your authenticator? Contact your administrator.",
  "Network error.",
];


export const metadata: Metadata = { title: "2FA Challenge", description: "Enter your 2FA code", robots: { index: false, follow: false } };
export default async function TwoFactorChallengePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <TranslatedPage locale={locale} strings={PAGE_STRINGS}>
      <TwoFactorChallengeClient />
    </TranslatedPage>
  );
}
