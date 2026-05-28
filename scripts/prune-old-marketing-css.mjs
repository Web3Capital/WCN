#!/usr/bin/env node
/**
 * Phase 3 / Task 18: prune CSS rules whose selector list is entirely owned
 * by the now-deleted marketing className prefixes. PageMasthead and DualSlab
 * supersede all of these.
 *
 * Strategy: line-range deletion preserving the rest of the file verbatim.
 * Scan line by line; when a target rule is detected (`.prefix...` at column 0
 * AND part of a top-level rule), find its matching `}` by depth counting and
 * mark the range for deletion. Comma-list selectors mixing pruned/kept
 * selectors fall back to "keep entire rule" (conservative — rare in practice).
 *
 * NOTE: `.editorial-masthead-*` belongs to the EditorialMasthead component
 * used by /about; deliberately preserved.
 */
import { readFileSync, writeFileSync } from "node:fs";

const TARGET = "app/globals.css";
const PRUNE_PREFIXES = [
  "nodes-masthead",
  "pob-masthead",
  "apply-masthead",
  "hiw-issue",
  "nodes-dual",
  "pob-bound",
];
// Specific sub-classes of `.editorial-masthead-*` that were only used as
// extra hooks on top of the inline masthead bar. The bar is now rendered by
// <PageMasthead/> after the Task-21 refactor, so these hooks are orphaned.
// The article-level pieces (`.editorial-masthead`, `-kicker`, `-title`,
// `-lede`, `-lede-dropcap`, `-rule-end`) stay because /about still uses them.
//
// Task 24: also remove the 3 per-page section-h2/-lede/-eyebrow/-head
// triples whose styles are now provided by the consolidated `.section-head`
// base in globals.css. `.nodes-section-h2` and `.hiw-loop-h2` are kept
// because they carry distinct (larger) sizing.
const PRUNE_EXACT = [
  "editorial-masthead-bar",
  "editorial-masthead-issue",
  "editorial-masthead-rule",
  "editorial-masthead-date",
  "about-section-h2",
  "about-section-lede",
  "about-section-head",
  "about-eyebrow",
  "hiw-section-h2",
  "hiw-section-lede",
  "hiw-section-head",
  "hiw-eyebrow",
  "pob-section-h2",
  "pob-section-lede",
  "pob-section-head",
  "pob-eyebrow",
];

const PRUNE_RE = new RegExp(`^\\.(?:${PRUNE_PREFIXES.join("|")})(?:[-A-Za-z0-9_])*`);
const PRUNE_EXACT_RE = new RegExp(
  `^\\.(?:${PRUNE_EXACT.join("|")})(?![-A-Za-z0-9_])`,
);
const isPruneTarget = (sel) => PRUNE_RE.test(sel) || PRUNE_EXACT_RE.test(sel);

const src = readFileSync(TARGET, "utf8");
const lines = src.split("\n");

const drop = new Set();

let i = 0;
while (i < lines.length) {
  const line = lines[i];
  // Only handle top-level rules. Indented lines (inside @media/@supports)
  // are skipped — they're dead anyway and the cost of leaving them is small.
  if (isPruneTarget(line)) {
    // Walk forward to find the opening brace and the matching close brace.
    // Selector lines may span multiple lines: `.foo,\n.bar {\n ... }`.
    // We tolerate that — accumulate selector text until we hit `{`.
    let j = i;
    let selectorText = "";
    while (j < lines.length && !lines[j].includes("{")) {
      selectorText += lines[j] + ",";
      j++;
    }
    if (j >= lines.length) break;
    selectorText += lines[j].slice(0, lines[j].indexOf("{"));
    // Verify EVERY selector in the list is a prune target. If any is not,
    // keep the rule intact (conservative).
    const selectors = selectorText.split(",").map((s) => s.trim()).filter(Boolean);
    const allMatch = selectors.length > 0 && selectors.every((s) => isPruneTarget(s));
    if (!allMatch) {
      i = j + 1;
      continue;
    }
    // Find matching close brace, tracking depth across lines.
    let depth = 0;
    let k = j;
    let done = false;
    while (k < lines.length && !done) {
      for (const ch of lines[k]) {
        if (ch === "{") depth++;
        else if (ch === "}") {
          depth--;
          if (depth === 0) {
            done = true;
            break;
          }
        }
      }
      k++;
    }
    // Mark lines i..k-1 for deletion (inclusive of close-brace line).
    for (let m = i; m < k; m++) drop.add(m);
    i = k;
    continue;
  }
  i++;
}

const out = lines.filter((_, idx) => !drop.has(idx)).join("\n");
writeFileSync(TARGET, out);

const beforeLines = lines.length;
const afterLines = out.split("\n").length;
console.log(`Lines: ${beforeLines} -> ${afterLines} (removed ${beforeLines - afterLines})`);
console.log(`Bytes: ${src.length} -> ${out.length} (removed ${src.length - out.length})`);
