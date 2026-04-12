import { TranslatedPage } from "@/lib/i18n/translate-page";
import TwoFactorSetupClient from "./client";

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

export default async function TwoFactorSetupPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <TranslatedPage locale={locale} strings={PAGE_STRINGS}>
      <TwoFactorSetupClient />
    </TranslatedPage>
  );
}
