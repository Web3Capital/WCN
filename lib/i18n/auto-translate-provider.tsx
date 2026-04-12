"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type TranslationMap = Record<string, string>;

interface AutoTranslateContextValue {
  t: (text: string) => string;
  locale: string;
}

const Ctx = createContext<AutoTranslateContextValue>({
  t: (text) => text,
  locale: "en",
});

export function AutoTranslateProvider({
  locale,
  initial,
  children,
}: {
  locale: string;
  initial?: TranslationMap;
  children: ReactNode;
}) {
  const [map, setMap] = useState<TranslationMap>(initial ?? {});
  const pending = useRef<Set<string>>(new Set());
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const isEn = locale === "en";

  const flush = useCallback(() => {
    if (pending.current.size === 0) return;

    const strings = Array.from(pending.current);
    pending.current.clear();

    fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ strings, locale }),
    })
      .then((r) => {
        if (!r.ok) throw new Error(`Translate API failed: ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (data.translations) {
          setMap((prev) => ({ ...prev, ...data.translations }));
        }
      })
      .catch((err) => console.error("[i18n] auto-translate fetch failed", err));
  }, [locale]);

  const t = useCallback(
    (text: string): string => {
      if (isEn || !text) return text;
      if (map[text]) return map[text];

      if (!pending.current.has(text)) {
        pending.current.add(text);
        clearTimeout(timer.current);
        timer.current = setTimeout(flush, 50);
      }

      return text;
    },
    [isEn, map, flush]
  );

  useEffect(() => {
    return () => clearTimeout(timer.current);
  }, []);

  const value = { t, locale };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/**
 * Hook for auto-translating English text in dashboard pages.
 *
 * Usage:
 *   const { t } = useAutoTranslate();
 *   <h1>{t("Matches")}</h1>
 *
 * English locale: returns text as-is, zero overhead.
 * Other locales: returns cached translation or fetches on-demand.
 */
export function useAutoTranslate() {
  return useContext(Ctx);
}
