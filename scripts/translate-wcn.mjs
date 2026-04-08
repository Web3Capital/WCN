import fs from "node:fs";
import path from "node:path";

const SRC_ROOT = path.join(process.cwd(), "content", "wcn");
const OUT_ROOT = path.join(process.cwd(), "content", "wcn-en");

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const API_KEY = process.env.OPENAI_API_KEY;

if (!API_KEY) {
  console.error("Missing OPENAI_API_KEY in environment.");
  process.exit(1);
}

function listHtmlFilesRecursive(dirAbs) {
  const entries = fs.readdirSync(dirAbs, { withFileTypes: true });
  const out = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const abs = path.join(dirAbs, entry.name);
    if (entry.isDirectory()) out.push(...listHtmlFilesRecursive(abs));
    else if (entry.isFile() && entry.name.toLowerCase().endsWith(".html")) out.push(abs);
  }
  return out;
}

function extractMeta(html) {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim();
  const description =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i)?.[1]?.trim();
  return { title, description };
}

function extractBody(html) {
  const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? html;
  return body
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "");
}

function decodeHtmlEntities(input) {
  return input
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'")
    .replaceAll("&#8217;", "’")
    .replaceAll("&#8220;", "“")
    .replaceAll("&#8221;", "”");
}

function stripTags(html) {
  return decodeHtmlEntities(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<\/section>/gi, "\n\n")
      .replace(/<\/h[1-6]>/gi, "\n\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<[^>]+>/g, "")
  )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function htmlToDocContent(html) {
  const body = extractBody(html);
  const withHeadings = body
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n\n## $1\n\n")
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\n\n### $1\n\n")
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "\n- $1\n");
  return stripTags(withHeadings)
    .replace(/\n(- )/g, "\n\n$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function escapeHtml(s) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function contentToHtmlBody(content) {
  const blocks = content.split("\n\n").map((b) => b.trim()).filter(Boolean);
  const parts = [];
  for (const block of blocks) {
    if (block.startsWith("## ")) {
      parts.push(`<h2>${escapeHtml(block.replace(/^##\s+/, ""))}</h2>`);
      continue;
    }
    if (block.startsWith("### ")) {
      parts.push(`<h3>${escapeHtml(block.replace(/^###\s+/, ""))}</h3>`);
      continue;
    }
    if (block.startsWith("- ")) {
      const items = block
        .split("\n")
        .map((l) => l.replace(/^-\s*/, "").trim())
        .filter(Boolean);
      parts.push(`<ul>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>`);
      continue;
    }
    parts.push(`<p>${escapeHtml(block)}</p>`);
  }
  return parts.join("\n");
}

async function openaiTranslateToEnglish({ title, description, content }) {
  const payload = {
    model: MODEL,
    input: [
      {
        role: "system",
        content:
          "You are a professional technical writer. Translate Chinese WCN documentation into clear, natural English. Keep structure. Preserve '##' and '###' headings and '-' bullet lists. Do not add new facts. Output ONLY valid JSON with keys: title, description, content."
      },
      {
        role: "user",
        content: JSON.stringify({ title, description, content })
      }
    ]
  };

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenAI error ${res.status}: ${text.slice(0, 500)}`);
  }

  const data = await res.json();
  const outputText =
    data?.output?.flatMap((o) => o?.content ?? [])?.find((c) => c?.type === "output_text")?.text ??
    data?.output_text ??
    "";

  const start = outputText.indexOf("{");
  const end = outputText.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Model did not return JSON.");
  const json = outputText.slice(start, end + 1);
  const parsed = JSON.parse(json);
  return {
    title: String(parsed.title ?? ""),
    description: parsed.description ? String(parsed.description) : undefined,
    content: String(parsed.content ?? "")
  };
}

function writeEnglishHtml({ relPath, title, description, content }) {
  const outAbs = path.join(OUT_ROOT, relPath);
  fs.mkdirSync(path.dirname(outAbs), { recursive: true });

  const body = contentToHtmlBody(content);
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  ${description ? `<meta name="description" content="${escapeHtml(description)}" />` : ""}
</head>
<body>
  <main>
    <h1>${escapeHtml(title)}</h1>
    ${description ? `<p>${escapeHtml(description)}</p>` : ""}
    ${body}
  </main>
</body>
</html>
`;

  fs.writeFileSync(outAbs, html, "utf8");
}

async function main() {
  if (!fs.existsSync(SRC_ROOT)) {
    console.error(`Missing source dir: ${SRC_ROOT}`);
    process.exit(1);
  }

  const srcFiles = listHtmlFilesRecursive(SRC_ROOT);
  console.log(`Found ${srcFiles.length} HTML files under ${SRC_ROOT}`);

  for (let i = 0; i < srcFiles.length; i++) {
    const abs = srcFiles[i];
    const rel = path.relative(SRC_ROOT, abs);
    const outAbs = path.join(OUT_ROOT, rel);

    if (fs.existsSync(outAbs)) {
      continue;
    }

    const raw = fs.readFileSync(abs, "utf8");
    const meta = extractMeta(raw);
    const content = htmlToDocContent(raw);

    console.log(`[${i + 1}/${srcFiles.length}] Translating ${rel}`);
    const translated = await openaiTranslateToEnglish({
      title: meta.title ?? path.basename(rel, ".html"),
      description: meta.description,
      content
    });

    writeEnglishHtml({ relPath: rel, ...translated });
  }

  console.log("Done. English files written to content/wcn-en/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

