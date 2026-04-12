/**
 * Rebuild all chapter index.mdx files with consistent Hero + MetaGrid + CardGrid.
 * Usage:  npx tsx scripts/rebuild-indexes.ts
 */

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const WIKI = path.join(process.cwd(), "content", "wiki");

interface ChapterMeta {
  title: string;
  icon: string;
  description: string;
  lead: string;
  heroTitle: string;
  readOrder: string;
  audience: string;
}

const META: Record<string, ChapterMeta> = {
  "01-project-intro": {
    title: "项目介绍",
    icon: "📖",
    description: "WCN 的定义、边界、愿景与时代窗口。",
    lead: "这一章不是背景介绍，而是整个知识库的认知地基。它负责讲清四件事：WCN 是什么、WCN 不只是什么、WCN 想去哪里，以及为什么这件事值得现在做。",
    heroTitle: "先建立对 WCN 的第一印象，再进入系统细节。",
    readOrder: "先总览，再顺读 1.1 → 1.4",
    audience: "投资人、节点、合作方与团队成员",
  },
  "02-industry-problem": {
    title: "行业问题",
    icon: "🔍",
    description: "Web3 的结构性割裂、资本低效与贡献结算难题。",
    lead: "行业并不缺项目、资本、媒体和技术。真正的问题在于这些资源仍然以碎片化、低结构化、强关系依赖的方式存在。",
    heroTitle: "先看清问题的全貌，才能理解 WCN 为什么这么设计。",
    readOrder: "先看 2.1 总结构，再看 2.2 与 2.3 细分",
    audience: "投资人、行业从业者、节点申请人",
  },
  "03-solution": {
    title: "WCN 的解法",
    icon: "💡",
    description: "整体解法、核心判断与三个核心创新。",
    lead: "WCN 的解法不是再加一个工具，而是用节点网络 + AI Agent + PoB + 结算层把资源、执行、证明与结算组织进同一系统。",
    heroTitle: "WCN 的解法是系统性的，而不是单点功能叠加。",
    readOrder: "先看整体解法，再读核心判断与创新",
    audience: "技术决策者、投资人、合作方",
  },
  "04-how-it-works": {
    title: "WCN 如何运作",
    icon: "⚙️",
    description: "最小业务闭环、节点到结算流程与角色分工。",
    lead: "如果第三章说明了解法，那么第四章回答：这个系统具体怎么跑起来的？从节点进入到结算，完整展开最小业务闭环。",
    heroTitle: "从节点引入资源，到任务执行、结果验证与进入结算，WCN 的核心是一条连续的工作流。",
    readOrder: "先看闭环，再看流程，然后看分工",
    audience: "节点运营者、产品设计师、合作方",
  },
  "05-network-arch": {
    title: "网络架构",
    icon: "🏗️",
    description: "五层架构总览与各层详解。",
    lead: "WCN 不是一堆模块的堆叠，而是一个分层清晰、上下联动的网络架构。五层从项目资产到验证结算，各有明确职责。",
    heroTitle: "WCN 的系统骨架由五层组成，每一层都有明确位置与作用。",
    readOrder: "先看 5.1 总览，再逐层展开",
    audience: "架构师、技术团队、投资人",
  },
  "06-node-system": {
    title: "节点系统",
    icon: "🌐",
    description: "节点分类、责任与生命周期。",
    lead: "节点不是普通用户，而是能带来资源、推进业务、承担责任的协作单元。本章完整展开节点的定义、分类、责任与管理。",
    heroTitle: "WCN 的力量不在中心团队，而在全球节点网络。",
    readOrder: "先看定义，再看分类，最后看生命周期",
    audience: "节点申请人、现有节点、运营团队",
  },
  "07-ai-agent": {
    title: "AI Agent 系统",
    icon: "🤖",
    description: "AI Agent 的角色、类型、生命周期与业务闭环。",
    lead: "WCN 不是把 AI 放在旁边当工具，而是让 Agent 进入正式业务闭环——有任务、有权限、有日志、有结算。",
    heroTitle: "Agent 不是营销亮点，而是进入任务体系的正式执行层。",
    readOrder: "先看为什么重要，再看类型与边界",
    audience: "AI 工程师、产品团队、节点运营者",
  },
  "08-pob": {
    title: "Proof of Business",
    icon: "✅",
    description: "PoB 定义、有效闭环、验证流程与归因逻辑。",
    lead: "PoB 不是活跃积分，不是营销分数，而是对真实业务闭环的证明机制。只有被验证的结果，才能进入长期价值层。",
    heroTitle: "PoB 是 WCN 最核心的制度基础——没有证明，就没有结算。",
    readOrder: "先看定义，再看标准，最后看流程",
    audience: "节点、审核人员、治理参与者",
  },
  "09-business-model": {
    title: "商业模式",
    icon: "💰",
    description: "收入来源、节点席位与服务收入。",
    lead: "WCN 的商业模式必须先于 Token 成立。本章展开收入地图：席位收入、服务收入、Agent 商业化，以及为什么不依赖发行 Token 生存。",
    heroTitle: "如果商业模式不能在 Token 之前成立，就很难证明这是业务网络而不是叙事网络。",
    readOrder: "先看收入来源，再看各模块细节",
    audience: "投资人、财务团队、节点",
  },
  "10-node-onboarding": {
    title: "节点加入",
    icon: "🚪",
    description: "谁可以加入、如何加入、席位与授权、Node NFT。",
    lead: "节点加入不是普通注册，而是进入一个有位置、有权限、有责任的网络。本章回答加入的全部问题。",
    heroTitle: "合适的人进入合适的位置，并接受相应责任。",
    readOrder: "先看资格，再看流程，最后看权益",
    audience: "节点申请人、合作方、BD 团队",
  },
  "11-governance": {
    title: "治理与合规",
    icon: "🏛️",
    description: "当前治理、过渡治理、未来治理与合规原则。",
    lead: "WCN 当前采用创始团队主导的集中治理，未来逐步过渡到节点参与的混合治理，最终走向制度化分权治理。",
    heroTitle: "治理不是口号，而是决定系统长期可信度的制度安排。",
    readOrder: "先看当前模型，再看演进路径",
    audience: "治理参与者、合规团队、投资人",
  },
  "12-roadmap": {
    title: "路线图",
    icon: "🗺️",
    description: "三个阶段：Network MVP → PoB 协同 → 结算资产层。",
    lead: "WCN 的路线图分三个阶段：先做网络 MVP，再做 PoB 与 Agent 协同，最后构建结算与资产层。每个阶段有明确的切换信号。",
    heroTitle: "不是一步到位，而是三步递进——每步都必须验证上一步的结果。",
    readOrder: "按阶段顺序阅读，注意切换信号",
    audience: "投资人、战略团队、合作方",
  },
  "13-why-wcn": {
    title: "为什么是 WCN",
    icon: "🏆",
    description: "创始人优势、模型优势与差异化竞争力。",
    lead: "市场不会等你。WCN 要回答的不只是「为什么要做」，还有「为什么你能赢」。本章从创始人、模型和时机三个维度展开。",
    heroTitle: "WCN 的竞争力，不在于概念新，而在于结构性先发优势。",
    readOrder: "先看创始人优势，再看模型差异",
    audience: "投资人、合作方、竞争分析者",
  },
  "14-join-wcn": {
    title: "加入 WCN",
    icon: "🤝",
    description: "申请成为节点、申请合作、获取访问权限。",
    lead: "如果你认同 WCN 的方向，这一章告诉你具体怎么参与：成为节点、申请合作或获取访问权限。",
    heroTitle: "认同方向是第一步，找到你的位置是第二步。",
    readOrder: "找到你最匹配的身份，直接阅读对应页面",
    audience: "节点申请人、合作方、开发者",
  },
  "15-resources": {
    title: "资源中心",
    icon: "📦",
    description: "白皮书、One Pager、Pitch Deck、FAQ 与法律声明。",
    lead: "所有核心文档、演示资料和法律声明汇总。需要向外部传达 WCN 信息时，从这里开始。",
    heroTitle: "一站式获取 WCN 的所有核心资料与常见问答。",
    readOrder: "按需查阅，白皮书是最完整的参考",
    audience: "所有外部读者与内部团队",
  },
};

for (const [dirName, meta] of Object.entries(META)) {
  const chDir = path.join(WIKI, dirName);
  if (!fs.existsSync(chDir)) continue;

  const files = fs.readdirSync(chDir)
    .filter((f) => f.endsWith(".mdx") && f !== "index.mdx")
    .sort();

  const subPages = files.map((f) => {
    const raw = fs.readFileSync(path.join(chDir, f), "utf-8");
    const { data } = matter(raw);
    const slug = f.replace(/\.mdx$/, "");
    return {
      title: (data.title as string || slug).replace(/ · .*$/, ""),
      description: (data.description as string) || "",
      href: `/wiki/${dirName}/${slug}`,
    };
  });

  const chNum = parseInt(dirName.split("-")[0]);
  const metaJson = JSON.parse(fs.readFileSync(path.join(chDir, "_meta.json"), "utf-8"));

  const cardLines = subPages.map(
    (p) => `  <Card title="${p.title}" description="${p.description || "阅读本节内容。"}" />`
  );

  const cols = subPages.length >= 4 ? 2 : 1;

  const mdx = `---
title: "${metaJson.title}"
description: "${meta.description}"
chapter: ${chNum}
order: 0
---

<Hero badge="第${chNum}章 · ${meta.title}" lead="${meta.lead}">
# ${meta.heroTitle}
</Hero>

<MetaGrid>
  <Meta label="核心主题" value="${meta.description.replace(/。$/, "")}" />
  <Meta label="阅读方式" value="${meta.readOrder}" />
  <Meta label="适用对象" value="${meta.audience}" />
</MetaGrid>

## 本章包含 ${subPages.length} 个页面

<CardGrid cols={${cols}}>
${cardLines.join("\n")}
</CardGrid>
`;

  fs.writeFileSync(path.join(chDir, "index.mdx"), mdx, "utf-8");
  console.log(`  ✓ ${dirName}/index.mdx (${subPages.length} pages)`);
}

console.log("\n✅ All index pages rebuilt.\n");
