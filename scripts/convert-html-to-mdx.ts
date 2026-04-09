/**
 * HTML → MDX migration script for WCN docs.
 *
 * Usage:  npx tsx scripts/convert-html-to-mdx.ts
 *
 * Reads every .html in content/wcn/**, converts to .mdx in content/docs/**.
 */

import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";

/* ------------------------------------------------------------------ */
/*  Configuration                                                      */
/* ------------------------------------------------------------------ */

const SRC = path.join(process.cwd(), "content", "wcn");
const DEST = path.join(process.cwd(), "content", "wiki");

const CHAPTER_META: Record<number, { slug: string; title: string; icon: string; description: string }> = {
  1:  { slug: "project-intro",    title: "项目介绍",             icon: "📖", description: "WCN 的定义、边界、愿景与时代窗口" },
  2:  { slug: "industry-problem", title: "行业问题",             icon: "🔍", description: "Web3 的结构性割裂、资本低效与贡献结算难题" },
  3:  { slug: "solution",         title: "WCN 的解法",           icon: "💡", description: "整体解法、核心判断与三个核心创新" },
  4:  { slug: "how-it-works",     title: "WCN 如何运作",         icon: "⚙️", description: "最小业务闭环、节点到结算流程与角色分工" },
  5:  { slug: "network-arch",     title: "网络架构",             icon: "🏗️", description: "五层架构总览与各层详解" },
  6:  { slug: "node-system",      title: "节点系统",             icon: "🌐", description: "节点分类、责任与生命周期" },
  7:  { slug: "ai-agent",         title: "AI Agent 系统",        icon: "🤖", description: "AI Agent 的角色、类型、生命周期与业务闭环" },
  8:  { slug: "pob",              title: "Proof of Business",    icon: "✅", description: "PoB 定义、有效闭环、验证流程与归因逻辑" },
  9:  { slug: "business-model",   title: "商业模式",             icon: "💰", description: "收入来源、节点席位与服务收入" },
  10: { slug: "node-onboarding",  title: "节点加入",             icon: "🚪", description: "谁可以加入、如何加入、席位与授权、Node NFT" },
  11: { slug: "governance",       title: "治理与合规",           icon: "🏛️", description: "当前治理、过渡治理、未来治理与合规原则" },
  12: { slug: "roadmap",          title: "路线图",               icon: "🗺️", description: "三个阶段：Network MVP → PoB 协同 → 结算资产层" },
  13: { slug: "why-wcn",          title: "为什么是 WCN",         icon: "🏆", description: "创始人优势、模型优势与差异化竞争力" },
  14: { slug: "join-wcn",         title: "加入 WCN",             icon: "🤝", description: "申请成为节点、申请合作、获取访问权限" },
  15: { slug: "resources",        title: "资源中心",             icon: "📦", description: "白皮书、One Pager、Pitch Deck、FAQ 与法律声明" },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function chapterNum(dirName: string): number {
  const m1 = dirName.match(/^Chapter_(\d+)/i);
  const m2 = dirName.match(/Chapter(\d+)_HTML/i);
  return parseInt(m1?.[1] ?? m2?.[1] ?? "0", 10);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function fileSlug(fileName: string): string {
  const base = fileName.replace(/\.html$/i, "");
  // "01-项目介绍-首页" → "index" (chapter home)
  if (base.match(/首页$/)) return "index";
  // "1.1-WCN-是什么" → "1-1-wcn-是什么"
  return slugify(base);
}

function cleanText(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, "\u201c")
    .replace(/&#8221;/g, "\u201d")
    .replace(/\s+/g, " ")
    .trim();
}

/* ------------------------------------------------------------------ */
/*  HTML → MDX conversion                                              */
/* ------------------------------------------------------------------ */

function convertFile(htmlPath: string, chNum: number, fileOrder: number): { slug: string; mdx: string; title: string; description?: string } {
  const raw = fs.readFileSync(htmlPath, "utf8");
  const $ = cheerio.load(raw);

  // Extract metadata
  const title = cleanText($("title").text()) || path.basename(htmlPath, ".html");
  const description = $('meta[name="description"]').attr("content") || undefined;

  // Remove elements we don't want
  $("style").remove();
  $("script").remove();
  $(".topbar-wrap, .topbar, .top, .bar").remove();
  $(".foot, .footer").remove();
  $(".bottom, .navCard").remove(); // prev/next nav in HTML
  $(".aside").remove(); // side TOC/next link

  const lines: string[] = [];

  // Build frontmatter
  const chMeta = CHAPTER_META[chNum];
  const fSlug = fileSlug(path.basename(htmlPath));

  lines.push("---");
  lines.push(`title: "${title.replace(/"/g, '\\"')}"`);
  if (description) lines.push(`description: "${description.replace(/"/g, '\\"')}"`);
  lines.push(`chapter: ${chNum}`);
  if (fileOrder > 0) lines.push(`order: ${fileOrder}`);
  else lines.push("order: 0");
  lines.push("---");
  lines.push("");

  // Process hero section
  const $hero = $(".hero").first();
  if ($hero.length) {
    const badge = cleanText($hero.find(".badge").first().text());
    const h1 = cleanText($hero.find("h1").first().text());
    const lead = cleanText($hero.find(".lede, .lead").first().text());

    if (badge || h1) {
      lines.push(`<Hero${badge ? ` badge="${badge.replace(/"/g, '\\"')}"` : ""}${lead ? ` lead="${lead.replace(/"/g, '\\"')}"` : ""}>`);
      if (h1) lines.push(`# ${h1}`);
      lines.push("</Hero>");
      lines.push("");
    }

    // Meta cards in hero
    const $meta = $hero.find(".meta, .hero-meta, .meta-card");
    if ($meta.length > 0) {
      const metaItems: { label: string; value: string }[] = [];
      $hero.find(".meta > div, .meta-card, .mini > div").each((_, el) => {
        const label = cleanText($(el).find(".label, .ey").text());
        const value = cleanText($(el).find(".value, strong").text());
        const desc = cleanText($(el).find("span").last().text());
        if (label && value) metaItems.push({ label, value });
        else if (value && desc) metaItems.push({ label: value, value: desc });
      });

      if (metaItems.length > 0) {
        lines.push("<MetaGrid>");
        for (const m of metaItems) {
          lines.push(`  <Meta label="${m.label.replace(/"/g, '\\"')}" value="${m.value.replace(/"/g, '\\"')}" />`);
        }
        lines.push("</MetaGrid>");
        lines.push("");
      }
    }

    $hero.remove();
  }

  // Process remaining content sections
  const $body = $("body, main, .wrap, .page").last();

  function processSection($sec: cheerio.Cheerio<any>) {
    $sec.children().each((_, child) => {
      const $child = $(child);
      const tag = (child as any).tagName?.toLowerCase();

      if ($child.hasClass("eyebrow") || $child.hasClass("ey")) {
        return;
      }

      // Statement / callout (must check BEFORE generic div/p handler)
      if ($child.hasClass("statement")) {
        const text = cleanText($child.text());
        if (text) {
          lines.push("<Callout type=\"warning\">");
          lines.push(text);
          lines.push("</Callout>");
          lines.push("");
        }
        return;
      }

      // Headings
      if (tag === "h2") {
        lines.push(`## ${cleanText($child.text())}`);
        lines.push("");
        return;
      }

      if (tag === "h3") {
        lines.push(`### ${cleanText($child.text())}`);
        lines.push("");
        return;
      }

      if (tag === "h1") {
        const text = cleanText($child.text());
        if (text) {
          lines.push(`## ${text}`);
          lines.push("");
        }
        return;
      }

      // Card grid (must check BEFORE generic div handler)
      if ($child.hasClass("cards") || $child.hasClass("card-grid-2") || $child.hasClass("bullets")) {
        const cards: { title: string; desc: string; icon?: string }[] = [];
        $child.find(".card, .bullet").each((_, card) => {
          const $card = $(card);
          const t = cleanText($card.find(".t, h3, strong").first().text());
          const d = cleanText($card.find(".d, p, span").first().text());
          const icon = cleanText($card.find(".icon").first().text());
          if (t) cards.push({ title: t, desc: d || "", icon: icon || undefined });
        });

        if (cards.length > 0) {
          const cols = cards.length <= 2 ? 2 : cards.length <= 3 ? 3 : 2;
          lines.push(`<CardGrid cols={${cols}}>`);
          for (const c of cards) {
            const iconAttr = c.icon ? ` icon="${c.icon}"` : "";
            lines.push(`  <Card title="${c.title.replace(/"/g, '\\"')}" description="${c.desc.replace(/"/g, '\\"')}"${iconAttr} />`);
          }
          lines.push("</CardGrid>");
          lines.push("");
        }
        return;
      }

      // Chapter navigation (mini-links)
      if ($child.hasClass("chapter-nav") || $child.find(".mini-link").length) {
        const links: { tag: string; name: string; desc: string }[] = [];
        $child.find(".mini-link").each((_, link) => {
          const $link = $(link);
          const tag = cleanText($link.find(".tag").text());
          const name = cleanText($link.find(".name").text());
          const desc = cleanText($link.find(".desc").text());
          if (name) links.push({ tag, name, desc });
        });

        if (links.length > 0) {
          const cols = links.length <= 2 ? 2 : links.length <= 4 ? 2 : 3;
          lines.push(`<CardGrid cols={${cols}}>`);
          for (const l of links) {
            lines.push(`  <Card title="${l.name.replace(/"/g, '\\"')}" description="${l.desc.replace(/"/g, '\\"')}" />`);
          }
          lines.push("</CardGrid>");
          lines.push("");
        }
        return;
      }

      // Steps / loop
      if ($child.hasClass("loop") || $child.find(".loop-step").length) {
        const steps: { num: string; title: string; desc: string }[] = [];
        $child.find(".loop-step").each((_, step) => {
          const $step = $(step);
          const num = cleanText($step.find(".loop-num").text());
          const t = cleanText($step.find("strong").text());
          const d = cleanText($step.find("span").text());
          if (t) steps.push({ num, title: t, desc: d });
        });

        if (steps.length > 0) {
          lines.push("<Steps>");
          for (const s of steps) {
            const numAttr = s.num ? ` number={${s.num}}` : "";
            lines.push(`  <Step${numAttr} title="${s.title.replace(/"/g, '\\"')}">`);
            if (s.desc) lines.push(`    ${s.desc}`);
            lines.push("  </Step>");
          }
          lines.push("</Steps>");
          lines.push("");
        }
        return;
      }

      // Signal / big + list layout
      if ($child.hasClass("signal")) {
        const $big = $child.find(".big").first();
        if ($big.length) {
          const h3 = cleanText($big.find("h3").text());
          const p = cleanText($big.find("p").text());
          if (h3) { lines.push(`### ${h3}`); lines.push(""); }
          if (p) { lines.push(p); lines.push(""); }
        }
        const listItems: { t: string; d: string }[] = [];
        $child.find(".list-item").each((_, li) => {
          const t = cleanText($(li).find("strong").text());
          const d = cleanText($(li).find("span").text());
          if (t) listItems.push({ t, d });
        });
        if (listItems.length) {
          for (const li of listItems) {
            lines.push(`- **${li.t}**${li.d ? `：${li.d}` : ""}`);
          }
          lines.push("");
        }
        return;
      }

      // UL / OL
      if (tag === "ul" || tag === "ol") {
        $child.find("li").each((_, li) => {
          lines.push(`- ${cleanText($(li).text())}`);
        });
        lines.push("");
        return;
      }

      // Plain paragraph
      if (tag === "p") {
        const text = cleanText($child.text());
        if (text) {
          lines.push(text);
          lines.push("");
        }
        return;
      }

      // Nested section/article/div with class
      if (tag === "section" || tag === "article" || tag === "div") {
        if ($child.hasClass("sec") || $child.hasClass("section") || $child.hasClass("article") ||
            $child.hasClass("layout") || $child.hasClass("section-header") || $child.hasClass("grid")) {
          processSection($child);
          return;
        }
        if ($child.children().length > 0) {
          processSection($child);
          return;
        }
        const text = cleanText($child.text());
        if (text) {
          lines.push(text);
          lines.push("");
        }
      }
    });
  }

  // Process main content containers
  const $article = $("article.article, .article").first();
  if ($article.length) {
    processSection($article);
  }

  // Process remaining sections outside article
  $("section.section, .section").each((_, sec) => {
    processSection($(sec));
  });

  // If no article/section found, process body
  if (!$article.length && !$("section.section").length) {
    const $main = $("main").first();
    if ($main.length) {
      processSection($main);
    } else {
      processSection($("body"));
    }
  }

  // Clean up: remove excessive blank lines
  let mdx = lines.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";

  return { slug: fSlug, mdx, title, description };
}

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */

function main() {
  if (!fs.existsSync(SRC)) {
    console.error(`Source directory not found: ${SRC}`);
    process.exit(1);
  }

  // Clean dest
  if (fs.existsSync(DEST)) {
    fs.rmSync(DEST, { recursive: true });
  }
  fs.mkdirSync(DEST, { recursive: true });

  const dirs = fs.readdirSync(SRC, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .sort((a, b) => {
      const na = chapterNum(a.name);
      const nb = chapterNum(b.name);
      return na - nb;
    });

  let totalFiles = 0;

  for (const dir of dirs) {
    const chNum = chapterNum(dir.name);
    if (chNum === 0) {
      console.warn(`  Skipping directory with unknown chapter number: ${dir.name}`);
      continue;
    }

    const meta = CHAPTER_META[chNum];
    if (!meta) {
      console.warn(`  No meta for chapter ${chNum}, using defaults`);
    }

    const slug = meta?.slug ?? `chapter-${String(chNum).padStart(2, "0")}`;
    const destDir = path.join(DEST, `${String(chNum).padStart(2, "0")}-${slug}`);
    fs.mkdirSync(destDir, { recursive: true });

    // Write _meta.json
    const metaJson = {
      title: meta?.title ?? `Chapter ${chNum}`,
      description: meta?.description ?? "",
      icon: meta?.icon ?? "📄",
      slug,
    };
    fs.writeFileSync(path.join(destDir, "_meta.json"), JSON.stringify(metaJson, null, 2));

    // Convert HTML files
    const htmlFiles = fs.readdirSync(path.join(SRC, dir.name))
      .filter((f) => f.endsWith(".html"))
      .sort((a, b) => a.localeCompare(b, "en"));

    for (let i = 0; i < htmlFiles.length; i++) {
      const htmlPath = path.join(SRC, dir.name, htmlFiles[i]);
      const { slug: fSlug, mdx, title } = convertFile(htmlPath, chNum, i);

      const mdxFileName = `${fSlug}.mdx`;
      fs.writeFileSync(path.join(destDir, mdxFileName), mdx);
      totalFiles++;
      console.log(`  ✓ ${dir.name}/${htmlFiles[i]} → ${String(chNum).padStart(2, "0")}-${slug}/${mdxFileName}`);
    }
  }

  console.log(`\n✅ Converted ${totalFiles} files across ${dirs.length} chapters to ${DEST}`);
}

main();
