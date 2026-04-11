"use client";

import { useAutoTranslate } from "@/lib/i18n/auto-translate-provider";

export function T({ children }: { children: string }) {
  const { t } = useAutoTranslate();
  return <>{t(children)}</>;
}
