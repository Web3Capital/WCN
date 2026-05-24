#!/usr/bin/env tsx
/**
 * Fill missing UI keys in messages/{locale}.json by diffing against en.json
 * and translating the missing strings via Google Translate (en → target).
 *
 * Preserves nested JSON structure and existing translations; only writes the
 * keys that were absent. Idempotent — re-running on an already-complete locale
 * is a no-op.
 *
 * Usage:
 *   npx tsx scripts/fill-missing-i18n.ts            # all non-en locales
 *   npx tsx scripts/fill-missing-i18n.ts ja ko es   # specified subset
 */
import fs from "node:fs";
import path from "node:path";

const MESSAGES_DIR = path.join(process.cwd(), "messages");
const EN_PATH = path.join(MESSAGES_DIR, "en.json");

const ALL_LOCALES = ["zh", "ja", "ko", "es", "fr", "de", "pt", "ar", "ru"];
const LOCALE_TO_GOOGLE: Record<string, string> = {
  zh: "zh-CN", ja: "ja", ko: "ko", es: "es", fr: "fr",
  de: "de", pt: "pt", ar: "ar", ru: "ru",
};

const targets = process.argv.slice(2).filter((a) => ALL_LOCALES.includes(a));
const locales = targets.length > 0 ? targets : ALL_LOCALES;

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

function getByPath(obj: Json, parts: string[]): Json | undefined {
  let cur: Json | undefined = obj;
  for (const p of parts) {
    if (cur && typeof cur === "object" && !Array.isArray(cur) && p in cur) {
      cur = (cur as { [k: string]: Json })[p];
    } else {
      return undefined;
    }
  }
  return cur;
}

function setByPath(obj: { [k: string]: Json }, parts: string[], value: Json): void {
  let cur: { [k: string]: Json } = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    const next = cur[p];
    if (!next || typeof next !== "object" || Array.isArray(next)) {
      cur[p] = {};
    }
    cur = cur[p] as { [k: string]: Json };
  }
  cur[parts[parts.length - 1]] = value;
}

/** Walk an object and yield ["dot.path", value] for every leaf string. */
function* walkStringLeaves(obj: Json, prefix: string[] = []): Generator<[string[], string]> {
  if (typeof obj === "string") {
    yield [prefix, obj];
    return;
  }
  if (Array.isArray(obj)) return;
  if (obj && typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) {
      yield* walkStringLeaves(v, [...prefix, k]);
    }
  }
}

/* ------------------------- google translate ------------------------- */
async function gtranslate(texts: string[], targetLang: string): Promise<string[]> {
  const url = "https://translate.googleapis.com/translate_a/t?" +
    new URLSearchParams({ client: "dict-chrome-ex", sl: "en", tl: targetLang });
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: texts.map((t) => `q=${encodeURIComponent(t)}`).join("&"),
  });
  if (!res.ok) throw new Error(`Google ${res.status}: ${await res.text()}`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("Unexpected response shape");
  if (texts.length === 1) {
    const item = data[0];
    return [typeof item === "string" ? item : (item?.[0] ?? texts[0])];
  }
  return data.map((item: unknown, i: number) => {
    if (typeof item === "string") return item;
    if (Array.isArray(item) && typeof item[0] === "string") return item[0];
    return texts[i];
  });
}

async function translateBatched(texts: string[], targetLang: string): Promise<string[]> {
  const out: string[] = new Array(texts.length);
  const BATCH = 50;
  for (let i = 0; i < texts.length; i += BATCH) {
    const slice = texts.slice(i, i + BATCH);
    try {
      const translated = await gtranslate(slice, targetLang);
      for (let j = 0; j < slice.length; j++) out[i + j] = translated[j] || slice[j];
    } catch (err) {
      console.warn(`  ! batch ${i / BATCH} failed: ${(err as Error).message}`);
      for (let j = 0; j < slice.length; j++) out[i + j] = slice[j];
    }
  }
  return out;
}

/* ------------------------- main ------------------------- */
async function main() {
  const enRaw = fs.readFileSync(EN_PATH, "utf8");
  const en = JSON.parse(enRaw) as Json;

  // Collect every leaf-string in en with its path.
  const enLeaves: { path: string[]; value: string }[] = [];
  for (const [p, v] of walkStringLeaves(en)) enLeaves.push({ path: p, value: v });

  for (const loc of locales) {
    const locPath = path.join(MESSAGES_DIR, `${loc}.json`);
    if (!fs.existsSync(locPath)) {
      console.warn(`Skip ${loc}: ${locPath} does not exist`);
      continue;
    }
    const locDoc = JSON.parse(fs.readFileSync(locPath, "utf8")) as { [k: string]: Json };

    const missing: { path: string[]; value: string }[] = [];
    for (const leaf of enLeaves) {
      const existing = getByPath(locDoc, leaf.path);
      if (existing === undefined || existing === null) missing.push(leaf);
    }

    if (missing.length === 0) {
      console.log(`✓ ${loc}: already complete (0 missing)`);
      continue;
    }

    console.log(`→ ${loc}: ${missing.length} missing, translating…`);
    const googleLang = LOCALE_TO_GOOGLE[loc] ?? loc;
    const translated = await translateBatched(missing.map((m) => m.value), googleLang);
    for (let i = 0; i < missing.length; i++) {
      setByPath(locDoc, missing[i].path, translated[i]);
    }

    fs.writeFileSync(locPath, JSON.stringify(locDoc, null, 2) + "\n", "utf8");
    console.log(`✓ ${loc}: wrote ${missing.length} new keys`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
