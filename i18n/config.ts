export const locales = ["en", "zh", "ja", "ko", "es", "fr", "de", "pt", "ar", "ru"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeMetadata: Record<Locale, { name: string; nativeName: string; dir: "ltr" | "rtl" }> = {
  en: { name: "English", nativeName: "English", dir: "ltr" },
  zh: { name: "Chinese", nativeName: "中文", dir: "ltr" },
  ja: { name: "Japanese", nativeName: "日本語", dir: "ltr" },
  ko: { name: "Korean", nativeName: "한국어", dir: "ltr" },
  es: { name: "Spanish", nativeName: "Español", dir: "ltr" },
  fr: { name: "French", nativeName: "Français", dir: "ltr" },
  de: { name: "German", nativeName: "Deutsch", dir: "ltr" },
  pt: { name: "Portuguese", nativeName: "Português", dir: "ltr" },
  ar: { name: "Arabic", nativeName: "العربية", dir: "rtl" },
  ru: { name: "Russian", nativeName: "Русский", dir: "ltr" },
};
