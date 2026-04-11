import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const CACHE_DIR = join(process.cwd(), "messages", "cache");

type CacheMap = Record<string, string>;

const memoryCache: Record<string, CacheMap> = {};

function ensureCacheDir() {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function getCacheFilePath(locale: string): string {
  return join(CACHE_DIR, `${locale}.json`);
}

function loadCache(locale: string): CacheMap {
  if (memoryCache[locale]) return memoryCache[locale];

  ensureCacheDir();
  const filePath = getCacheFilePath(locale);

  if (existsSync(filePath)) {
    try {
      const data = JSON.parse(readFileSync(filePath, "utf-8"));
      memoryCache[locale] = data;
      return data;
    } catch {
      memoryCache[locale] = {};
      return {};
    }
  }

  memoryCache[locale] = {};
  return {};
}

function saveCache(locale: string, cache: CacheMap) {
  ensureCacheDir();
  const filePath = getCacheFilePath(locale);
  try {
    writeFileSync(filePath, JSON.stringify(cache, null, 2), "utf-8");
  } catch {
    // In serverless/edge environments, file writes may fail silently
  }
}

async function googleTranslateBatch(
  texts: string[],
  targetLang: string
): Promise<string[]> {
  const url = "https://translate.googleapis.com/translate_a/t?" +
    new URLSearchParams({
      client: "dict-chrome-ex",
      sl: "en",
      tl: targetLang,
    });

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: texts.map((t) => `q=${encodeURIComponent(t)}`).join("&"),
  });

  if (!res.ok) {
    console.warn(`[auto-translate] Google Translate returned ${res.status}`);
    return texts;
  }

  const data = await res.json();

  if (Array.isArray(data)) {
    if (texts.length === 1) {
      const item = data[0];
      return [typeof item === "string" ? item : item?.[0] ?? texts[0]];
    }
    return data.map((item: unknown, i: number) => {
      if (typeof item === "string") return item;
      if (Array.isArray(item) && typeof item[0] === "string") return item[0];
      return texts[i];
    });
  }

  return texts;
}

const LOCALE_TO_GOOGLE: Record<string, string> = {
  zh: "zh-CN",
  ja: "ja",
  ko: "ko",
  es: "es",
  fr: "fr",
  de: "de",
  pt: "pt",
  ar: "ar",
  ru: "ru",
};

/**
 * Translate an array of English strings to the target locale.
 * Returns a map of { englishText: translatedText }.
 * Results are cached to JSON files in messages/cache/.
 */
export async function autoTranslate(
  strings: string[],
  locale: string
): Promise<Record<string, string>> {
  if (locale === "en" || strings.length === 0) {
    return Object.fromEntries(strings.map((s) => [s, s]));
  }

  const cache = loadCache(locale);
  const result: Record<string, string> = {};
  const uncached: string[] = [];

  for (const s of strings) {
    if (cache[s]) {
      result[s] = cache[s];
    } else {
      uncached.push(s);
    }
  }

  if (uncached.length > 0) {
    const googleLang = LOCALE_TO_GOOGLE[locale] || locale;

    const BATCH_SIZE = 50;
    for (let i = 0; i < uncached.length; i += BATCH_SIZE) {
      const batch = uncached.slice(i, i + BATCH_SIZE);
      try {
        const translated = await googleTranslateBatch(batch, googleLang);
        for (let j = 0; j < batch.length; j++) {
          const original = batch[j];
          const translation = translated[j] || original;
          result[original] = translation;
          cache[original] = translation;
        }
      } catch (err) {
        console.warn("[auto-translate] Batch translation failed:", err);
        for (const s of batch) {
          result[s] = s;
        }
      }
    }

    saveCache(locale, cache);
    memoryCache[locale] = cache;
  }

  return result;
}
