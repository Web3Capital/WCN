// Warm the auto-translate cache by translating every string that appears in
// `<T>...</T>` across the dashboard subtree. Running this once (per locale)
// ensures the dashboard renders in-locale on first paint everywhere, instead
// of relying on per-page client-side cache fills.
//
// Usage:
//   node scripts/warm-translate-cache.mjs <locale> [<locale> ...]
//   node scripts/warm-translate-cache.mjs zh ja ko
//
// With no args, warms all non-en locales known to the auto-translate module.

import "dotenv/config";
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const DASHBOARD_DIR = join(ROOT, "app", "[locale]", "dashboard");
const CACHE_DIR = join(ROOT, "messages", "cache");

const T_RE = /<T>([^<]+)<\/T>/g;

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) yield* walk(full);
    else if (/\.(tsx?|jsx?)$/.test(entry)) yield full;
  }
}

function extractStrings() {
  const out = new Set();
  for (const file of walk(DASHBOARD_DIR)) {
    const src = readFileSync(file, "utf-8");
    let m;
    while ((m = T_RE.exec(src)) !== null) {
      const s = m[1].trim();
      if (s) out.add(s);
    }
  }
  return [...out].sort();
}

const LOCALE_TO_GOOGLE = {
  zh: "zh-CN", ja: "ja", ko: "ko", es: "es", fr: "fr",
  de: "de", pt: "pt", ar: "ar", ru: "ru",
};

async function googleTranslateBatch(texts, targetLang) {
  const url = "https://translate.googleapis.com/translate_a/t?" +
    new URLSearchParams({ client: "dict-chrome-ex", sl: "en", tl: targetLang });
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: texts.map((t) => `q=${encodeURIComponent(t)}`).join("&"),
  });
  if (!res.ok) throw new Error(`Google ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data)) return texts;
  if (texts.length === 1) {
    const item = data[0];
    return [typeof item === "string" ? item : item?.[0] ?? texts[0]];
  }
  return data.map((item, i) => {
    if (typeof item === "string") return item;
    if (Array.isArray(item) && typeof item[0] === "string") return item[0];
    return texts[i];
  });
}

function loadCache(locale) {
  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
  const fp = join(CACHE_DIR, `${locale}.json`);
  if (!existsSync(fp)) return {};
  try { return JSON.parse(readFileSync(fp, "utf-8")); } catch { return {}; }
}

function saveCache(locale, cache) {
  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
  const fp = join(CACHE_DIR, `${locale}.json`);
  // Sorted for stable diffs.
  const sorted = Object.fromEntries(Object.entries(cache).sort(([a],[b]) => a.localeCompare(b)));
  writeFileSync(fp, JSON.stringify(sorted, null, 2) + "\n", "utf-8");
}

async function warmLocale(strings, locale) {
  const cache = loadCache(locale);
  const missing = strings.filter((s) => !cache[s]);
  if (missing.length === 0) {
    console.log(`[${locale}] all ${strings.length} strings already cached`);
    return 0;
  }
  console.log(`[${locale}] ${strings.length} strings, ${missing.length} missing — translating…`);

  const target = LOCALE_TO_GOOGLE[locale] || locale;
  const BATCH = 50;
  let added = 0;
  for (let i = 0; i < missing.length; i += BATCH) {
    const batch = missing.slice(i, i + BATCH);
    try {
      const translated = await googleTranslateBatch(batch, target);
      for (let j = 0; j < batch.length; j++) {
        const original = batch[j];
        const translation = translated[j] || original;
        if (translation !== original) {
          cache[original] = translation;
          added++;
        }
      }
      process.stdout.write(`  batch ${i + batch.length}/${missing.length} (+${added}) `);
    } catch (err) {
      console.warn(`\n[${locale}] batch ${i} failed: ${err.message}`);
    }
    // be polite to the free endpoint
    await new Promise((r) => setTimeout(r, 250));
  }
  saveCache(locale, cache);
  console.log(`\n[${locale}] saved, +${added} new entries (total ${Object.keys(cache).length})`);
  return added;
}

const requested = process.argv.slice(2).filter(Boolean);
const locales = requested.length > 0 ? requested : Object.keys(LOCALE_TO_GOOGLE);

const strings = extractStrings();
console.log(`Found ${strings.length} unique <T> strings under app/[locale]/dashboard/`);

let totalAdded = 0;
for (const locale of locales) {
  totalAdded += await warmLocale(strings, locale);
}
console.log(`\nDone. ${totalAdded} new entries written across ${locales.length} locale(s).`);
