import { TranslatedPage } from "@/lib/i18n/translate-page";
import TwoFactorSetupClient from "./client";
import type { Metadata } from "next";

const PAGE_STRINGS = [
  "Account", "Two-Factor Authentication",
  "Secure your account with a TOTP authenticator app (Google Authenticator, Authy, 1Password, etc.)",
  "Generating...", "Generate secret",
  "Scan the QR code or enter the secret manually in your authenticator app:",
  "OTP Auth URL:", "Verification code", "Verifying...", "Verify & enable",
  "2FA enabled successfully",
  "Your account is now secured with two-factor authentication.",
  "Go to Dashboard", "Network error.",
];


export const metadata: Metadata = { title: "Two-Factor Authentication", description: "Set up 2FA", robots: { index: false, follow: false } };
export default async function TwoFactorSetupPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <TranslatedPage locale={locale} strings={PAGE_STRINGS}>
      <TwoFactorSetupClient />
    </TranslatedPage>
  );
}
