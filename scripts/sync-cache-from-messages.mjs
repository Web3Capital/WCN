// Bulk-curate messages/cache/{locale}.json from messages/{locale}.json.
//
// The auto-translate cache holds machine translations for English `<T>`
// strings. Many of those English strings also exist as values in the
// hand-curated next-intl message bundles (messages/{locale}.json) — the
// translations there are higher quality and aligned to project terminology
// (e.g. "Agents" → "智能体" in zh, "エージェント" in ja).
//
// This script walks every `(enValue, localeValue)` leaf pair in
// messages/en.json and the matching locale file, and overwrites
// matching cache entries with the canonical locale value. Entries the
// message bundle doesn't cover are left as-is (raw machine translations).
//
// Usage:
//   node scripts/sync-cache-from-messages.mjs            (all 9 locales)
//   node scripts/sync-cache-from-messages.mjs ja ko es   (subset)

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const MESSAGES_DIR = join(ROOT, "messages");
const CACHE_DIR = join(MESSAGES_DIR, "cache");

const LOCALES = ["zh", "ja", "ko", "es", "fr", "de", "pt", "ar", "ru"];

function walkLeaves(en, loc, out, path = []) {
  for (const k of Object.keys(en)) {
    const enVal = en[k];
    const locVal = loc?.[k];
    if (enVal && typeof enVal === "object") {
      walkLeaves(enVal, locVal && typeof locVal === "object" ? locVal : {}, out, [...path, k]);
    } else if (
      typeof enVal === "string" &&
      typeof locVal === "string" &&
      enVal.length > 0 &&
      locVal.length > 0 &&
      enVal !== locVal
    ) {
      // Skip ICU-template strings — they have placeholders that would mismatch
      // the auto-translate cache (which only stores literal `<T>` strings).
      if (enVal.includes("{") || enVal.includes("%s")) continue;
      out.push([enVal, locVal]);
    }
  }
}

function canonicalPairs(locale) {
  const en = JSON.parse(readFileSync(join(MESSAGES_DIR, "en.json"), "utf-8"));
  const loc = JSON.parse(readFileSync(join(MESSAGES_DIR, `${locale}.json`), "utf-8"));
  const out = [];
  walkLeaves(en, loc, out);
  // De-dupe — last wins (later in the tree may override earlier, but values
  // for the same English string are usually identical).
  const map = new Map();
  for (const [en, lo] of out) map.set(en, lo);
  return map;
}

function applyToCache(locale, map) {
  const fp = join(CACHE_DIR, `${locale}.json`);
  if (!existsSync(fp)) {
    console.log(`[${locale}] no cache file — skipping`);
    return 0;
  }
  const cache = JSON.parse(readFileSync(fp, "utf-8"));
  let changed = 0;
  for (const [en, lo] of map) {
    if (cache[en] !== undefined && cache[en] !== lo) {
      cache[en] = lo;
      changed++;
    }
  }
  const sorted = Object.fromEntries(Object.entries(cache).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(fp, JSON.stringify(sorted, null, 2) + "\n", "utf-8");
  return changed;
}

const requested = process.argv.slice(2).filter(Boolean);
const targets = requested.length > 0 ? requested : LOCALES;

let total = 0;
for (const locale of targets) {
  const map = canonicalPairs(locale);
  const changed = applyToCache(locale, map);
  console.log(`[${locale}] canonical pairs: ${map.size}, cache entries updated: ${changed}`);
  total += changed;
}
console.log(`\nDone. ${total} cache entries synced from message bundles across ${targets.length} locale(s).`);
