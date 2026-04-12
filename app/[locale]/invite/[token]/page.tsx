import { TranslatedPage } from "@/lib/i18n/translate-page";
import InviteActivationClient from "./client";
import type { Metadata } from "next";

const PAGE_STRINGS = [
  "Welcome", "Activate your account",
  "Set your password to join the WCN network.",
  "Full name", "Password (min 8 characters)", "Confirm password",
  "Password must be at least 8 characters.", "Passwords do not match.",
  "Account created! Redirecting to 2FA setup...",
  "Account activated! Redirecting to login...",
  "Activating...", "Activate account", "Network error.",
];


export const metadata: Metadata = { title: "Invitation", description: "Accept your invitation", robots: { index: false, follow: false } };
export default async function InviteActivationPage({ params }: { params: Promise<{ locale: string; token: string }> }) {
  const { locale } = await params;
  return (
    <TranslatedPage locale={locale} strings={PAGE_STRINGS}>
      <InviteActivationClient />
    </TranslatedPage>
  );
}
