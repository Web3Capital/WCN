import { TranslatedPage } from "@/lib/i18n/translate-page";
import TermsAcceptanceClient from "./client";
import type { Metadata } from "next";

const PAGE_STRINGS = [
  "Onboarding", "Terms & Agreements",
  "Please review and accept the following agreements before continuing.",
  "Non-Disclosure Agreement",
  "You agree not to disclose confidential information shared within the WCN platform to unauthorized third parties.",
  "Platform Terms of Service",
  "You agree to abide by the WCN Operating Console terms of service, including data handling, usage policies, and dispute resolution procedures.",
  "Code of Conduct",
  "You agree to maintain professional standards, avoid conflicts of interest, and participate in good faith across all WCN operations.",
  "Accepted", "Accept", "Accept All", "Processing...",
  "Continue to Dashboard", "Loading...", "Network error.",
];


export const metadata: Metadata = { title: "Terms & Agreements", description: "Accept terms", robots: { index: false, follow: false } };
export default async function TermsAcceptancePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <TranslatedPage locale={locale} strings={PAGE_STRINGS}>
      <TermsAcceptanceClient />
    </TranslatedPage>
  );
}
