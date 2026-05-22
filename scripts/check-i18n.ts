#!/usr/bin/env tsx
/**
 * i18n parity gate — ensures non-English locales don't drift further from `en`.
 *
 * Strategy: ratchet, not perfection. We do not require every non-en locale
 * to have every en key (Q2 Week 5 will close that gap with batch translation).
 * Instead we record the current "missing-key count per locale" as a ceiling
 * in `metrics/i18n-baseline.json`, and fail CI if any locale's missing
 * count exceeds its ceiling.
 *
 * Usage:
 *   npx tsx scripts/check-i18n.ts            # verify against ceilings (CI)
 *   npx tsx scripts/check-i18n.ts --update   # rewrite ceilings (post-translation PR)
 *   npx tsx scripts/check-i18n.ts --report   # print full report, exit 0
 *
 * Source of truth: messages/en.json. All other messages/<locale>.json files
 * are compared against it.
 *
 * See:
 *   - docs/architecture/adr/0005-api-platform-layer.md (ratchet pattern)
 *   - docs/delivery/q2-systematic-fix-roadmap.md (Week 5 translation plan)
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, basename } from "node:path";

const REPO_ROOT = join(__dirname, "..");
const MESSAGES_DIR = join(REPO_ROOT, "messages");
const BASELINE_PATH = join(REPO_ROOT, "metrics", "i18n-baseline.json");
const REFERENCE_LOCALE = "en";

type Json = string | number | boolean | null | { [k: string]: Json } | Json[];
type FlatMap = Record<string, string>;

function flatten(value: Json, prefix = ""): FlatMap {
  const out: FlatMap = {};
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    if (prefix) out[prefix] = String(value ?? "");
    return out;
  }
  for (const [k, v] of Object.entries(value)) {
    const nextKey = prefix ? `${prefix}.${k}` : k;
    Object.assign(out, flatten(v as Json, nextKey));
  }
  return out;
}

function loadLocale(locale: string): FlatMap {
  const path = join(MESSAGES_DIR, `${locale}.json`);
  const raw = readFileSync(path, "utf8");
  return flatten(JSON.parse(raw) as Json);
}

function listLocales(): string[] {
  return readdirSync(MESSAGES_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => basename(f, ".json"))
    .sort();
}

interface LocaleReport {
  locale: string;
  totalKeys: number;
  missingKeys: number;
  extraKeys: number;
  missingSample: string[];
  extraSample: string[];
}

function compareLocale(locale: string, ref: FlatMap): LocaleReport {
  const cur = loadLocale(locale);
  const refKeys = new Set(Object.keys(ref));
  const curKeys = new Set(Object.keys(cur));

  const missing: string[] = [];
  for (const k of refKeys) if (!curKeys.has(k)) missing.push(k);
  missing.sort();

  const extra: string[] = [];
  for (const k of curKeys) if (!refKeys.has(k)) extra.push(k);
  extra.sort();

  return {
    locale,
    totalKeys: curKeys.size,
    missingKeys: missing.length,
    extraKeys: extra.length,
    missingSample: missing.slice(0, 5),
    extraSample: extra.slice(0, 5),
  };
}

interface Baseline {
  generatedAt: string;
  referenceLocale: string;
  referenceKeyCount: number;
  ceilings: Record<string, { missingKeys: number; extraKeys: number }>;
}

function loadBaseline(): Baseline | null {
  if (!existsSync(BASELINE_PATH)) return null;
  return JSON.parse(readFileSync(BASELINE_PATH, "utf8")) as Baseline;
}

function buildBaseline(reports: LocaleReport[], refKeyCount: number): Baseline {
  const ceilings: Baseline["ceilings"] = {};
  for (const r of reports) {
    if (r.locale === REFERENCE_LOCALE) continue;
    ceilings[r.locale] = { missingKeys: r.missingKeys, extraKeys: r.extraKeys };
  }
  return {
    generatedAt: new Date().toISOString(),
    referenceLocale: REFERENCE_LOCALE,
    referenceKeyCount: refKeyCount,
    ceilings,
  };
}

function formatReport(reports: LocaleReport[], refKeyCount: number): string {
  const lines: string[] = [];
  lines.push(`Reference locale: ${REFERENCE_LOCALE} (${refKeyCount} keys)`);
  lines.push("");
  lines.push("Locale | Keys | Missing | Extra");
  lines.push("-------|-----:|--------:|-----:");
  for (const r of reports) {
    if (r.locale === REFERENCE_LOCALE) continue;
    lines.push(`${r.locale.padEnd(6)} | ${String(r.totalKeys).padStart(4)} | ${String(r.missingKeys).padStart(7)} | ${String(r.extraKeys).padStart(5)}`);
  }
  return lines.join("\n");
}

function main(): number {
  const args = new Set(process.argv.slice(2));
  const update = args.has("--update");
  const report = args.has("--report");

  const ref = loadLocale(REFERENCE_LOCALE);
  const refKeyCount = Object.keys(ref).length;
  const locales = listLocales();
  const reports = locales.map((l) => compareLocale(l, ref));

  if (report) {
    console.log(formatReport(reports, refKeyCount));
    return 0;
  }

  if (update) {
    const baseline = buildBaseline(reports, refKeyCount);
    writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2) + "\n");
    console.log(`✓ wrote ${BASELINE_PATH}`);
    console.log(formatReport(reports, refKeyCount));
    return 0;
  }

  // Verify mode (default)
  const baseline = loadBaseline();
  if (!baseline) {
    console.error(`✖ no baseline at ${BASELINE_PATH}. Run with --update to create.`);
    return 2;
  }

  const violations: string[] = [];
  for (const r of reports) {
    if (r.locale === REFERENCE_LOCALE) continue;
    const ceiling = baseline.ceilings[r.locale];
    if (!ceiling) {
      violations.push(`✖ locale '${r.locale}' has no ceiling in baseline. Run with --update.`);
      continue;
    }
    if (r.missingKeys > ceiling.missingKeys) {
      violations.push(
        `✖ ${r.locale}: missing ${r.missingKeys} keys (ceiling ${ceiling.missingKeys}). ` +
          `Sample: ${r.missingSample.slice(0, 3).join(", ")}`,
      );
    }
    if (r.extraKeys > ceiling.extraKeys) {
      violations.push(
        `✖ ${r.locale}: ${r.extraKeys} extra keys vs en (ceiling ${ceiling.extraKeys}). ` +
          `Sample: ${r.extraSample.slice(0, 3).join(", ")}`,
      );
    }
  }

  if (violations.length > 0) {
    console.error("i18n parity check FAILED — non-en locales drifted further from en.");
    console.error("");
    for (const v of violations) console.error(v);
    console.error("");
    console.error("If this drift is intentional (e.g. translation PR landing), run:");
    console.error("  npx tsx scripts/check-i18n.ts --update");
    console.error("and commit the updated metrics/i18n-baseline.json.");
    return 1;
  }

  console.log("✓ i18n parity within ceilings");
  console.log(formatReport(reports, refKeyCount));
  return 0;
}

process.exit(main());
