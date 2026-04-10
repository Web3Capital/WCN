/**
 * Translation diff script — finds missing/extra keys in locale files vs en.json.
 *
 * Usage: npx tsx scripts/i18n-diff.ts
 */

import fs from "fs";
import path from "path";

const MESSAGES_DIR = path.resolve(__dirname, "../messages");

function getKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  let keys: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const keyPath = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "object" && v !== null && !Array.isArray(v)) {
      keys = keys.concat(getKeys(v as Record<string, unknown>, keyPath));
    } else {
      keys.push(keyPath);
    }
  }
  return keys;
}

const enPath = path.join(MESSAGES_DIR, "en.json");
const en = JSON.parse(fs.readFileSync(enPath, "utf-8"));
const enKeys = new Set(getKeys(en));

console.log(`\n  Source: en.json — ${enKeys.size} keys\n`);

const files = fs.readdirSync(MESSAGES_DIR).filter((f) => f.endsWith(".json") && f !== "en.json");
let allGood = true;

for (const file of files.sort()) {
  const locale = file.replace(".json", "");
  const data = JSON.parse(fs.readFileSync(path.join(MESSAGES_DIR, file), "utf-8"));
  const locKeys = new Set(getKeys(data));
  const missing = [...enKeys].filter((k) => !locKeys.has(k));
  const extra = [...locKeys].filter((k) => !enKeys.has(k));

  if (missing.length === 0 && extra.length === 0) {
    console.log(`  ✓ ${locale} — ${locKeys.size} keys, in sync`);
  } else {
    allGood = false;
    console.log(`  ✗ ${locale} — ${locKeys.size} keys`);
    if (missing.length > 0) {
      console.log(`    Missing (${missing.length}):`);
      missing.forEach((k) => console.log(`      - ${k}`));
    }
    if (extra.length > 0) {
      console.log(`    Extra (${extra.length}):`);
      extra.forEach((k) => console.log(`      + ${k}`));
    }
  }
}

console.log(allGood ? "\n  All locales in sync.\n" : "\n  Some locales need attention.\n");
process.exit(allGood ? 0 : 1);
