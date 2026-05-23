#!/usr/bin/env tsx
/**
 * Fix translator-induced JSX attribute-quote collisions in content/wiki/en/.
 *
 * Background: Google Translate converts CJK guillemets「…」 into ASCII " … ",
 * which collides with JSX attribute delimiters and breaks MDX compilation.
 *
 * Strategy: replace inner straight quotes inside JSX attribute values with
 * typographic quotes (“ ”). We detect "inner" via lookbehind/lookahead — a
 * straight " whose left neighbor is not `=` and whose right neighbor is not a
 * value-terminator (`=`, `/`, `>`, end of line) is an inner quote.
 *
 * Idempotent — running twice is a no-op.
 *
 * Usage: npx tsx scripts/fix-mdx-quotes.ts
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "content", "wiki", "en");

function listMdx(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listMdx(abs));
    else if (entry.isFile() && entry.name.endsWith(".mdx")) out.push(abs);
  }
  return out;
}

/**
 * Replace inner ASCII straight quotes with typographic ones inside JSX attribute
 * values on a single line. We scan attribute boundaries using a regex that
 * matches `\b\w+=["']`, take the segment ending right before the NEXT such
 * boundary (or tag close), find the last `"`/`'` matching the opener — that's
 * the real closing quote — and convert any quotes strictly between opener and
 * closer to typographic “ ”.
 */
function fixLine(line: string): string {
  if (!line.includes('="') && !line.includes("='")) return line;

  // Find every JSX opening tag's `<…>` span first, so we never let attribute
  // scanning leak into the body content that follows the tag.
  // Greedy match across `<Tag ... attr="…with > inside…">` is risky, but our
  // MDX dataset uses `>` only as the tag terminator (no `>` inside string
  // attribute values). A simple `<[A-Z][^>]*>` is correct for this corpus.
  const tagRe = /<[A-Z][^>]*>/g;
  const replacements: { start: number; end: number; replacement: string }[] = [];
  let tm: RegExpExecArray | null;
  while ((tm = tagRe.exec(line)) !== null) {
    const tagStart = tm.index;
    const tagText = tm[0];
    const tagEnd = tagStart + tagText.length; // position just after `>`

    // Find attribute opening-quote positions within this tag span.
    const attrRe = /\b([A-Za-z_][\w-]*)=(["'])/g;
    const starts: { quoteIdx: number; quote: '"' | "'" }[] = [];
    let am: RegExpExecArray | null;
    while ((am = attrRe.exec(tagText)) !== null) {
      starts.push({
        quoteIdx: tagStart + am.index + am[0].length - 1,
        quote: am[2] as '"' | "'",
      });
    }
    if (starts.length === 0) continue;

    for (let i = 0; i < starts.length; i++) {
      const { quoteIdx, quote } = starts[i];
      // Segment end is the next attribute's opening quote, or — for the last
      // attribute — the tag's `>` (or `/>` — same closing index).
      const segmentEnd = i + 1 < starts.length ? starts[i + 1].quoteIdx : tagEnd - 1;
      const sub = line.slice(quoteIdx + 1, segmentEnd);
      const lastQuote = sub.lastIndexOf(quote);
      if (lastQuote < 0) continue;
      const closeAbs = quoteIdx + 1 + lastQuote;
      const inner = line.slice(quoteIdx + 1, closeAbs);
      if (!inner.includes(quote)) continue;
      let open = true;
      const fixed = inner.replace(new RegExp(quote, "g"), () => (open = !open) ? "”" : "“");
      replacements.push({ start: quoteIdx + 1, end: closeAbs, replacement: fixed });
    }
  }

  if (replacements.length === 0) return line;
  let out = line;
  for (const r of replacements.sort((a, b) => b.start - a.start)) {
    out = out.slice(0, r.start) + r.replacement + out.slice(r.end);
  }
  return out;
}

let total = 0;
let touched = 0;
for (const file of listMdx(ROOT)) {
  total++;
  const raw = fs.readFileSync(file, "utf8");
  const lines = raw.split("\n");
  let changed = false;
  for (let i = 0; i < lines.length; i++) {
    const before = lines[i];
    const after = fixLine(before);
    if (after !== before) {
      lines[i] = after;
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(file, lines.join("\n"), "utf8");
    touched++;
    console.log(`  ✓ ${path.relative(process.cwd(), file)}`);
  }
}
console.log(`\nFixed ${touched} / ${total} files.`);
