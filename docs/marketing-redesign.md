# 营销页系统重设计 · 进度追踪与决策日志

- **状态**: In Progress
- **启动日期**: 2026-05-27
- **范围**: `/`、`/about`、`/how-it-works`、`/nodes`、`/pob`、`/apply` 共 5 个营销路由 + 共享组件 + i18n + 渲染策略 + 安全/SEO
- **目标版本**: `wcn-marketing-v2.0`

---

## 路线图与状态

| Phase | 主题 | 状态 | 关键产出 |
|---|---|---|---|
| 0 | 度量基线 & 工程护栏 | 🟢 完成 | ESLint i18n 规则(error 级别)、决策日志 |
| 1 | i18n 收口 | 🟢 完成 | 19 处硬编码英文 → t()、about 中文 slug 修复、`lib/wiki-link.ts` |
| 2 | 渲染策略 | 🟢 完成 | 营销页 `force-static` + revalidate=86400、layout `cookies()` 移除、`<ThemeScript>` 同步设主题 |
| 3 | 组件抽象 & CSS 瘦身 | 🟢 完成 | `<PageMasthead>` / `<SectionHead>` / `<DualSlab>`、6 套 masthead → 1,3 套 dual-slab → 1,`globals.css` 减 321 行 |
| 4 | 安全 / SEO | 🟢 完成 | CSP nonce(Report-Only)、sitemap 改裸路径 + mtime、JSON-LD i18n + inLanguage 单值、5 页 per-page OG image、补 Vercel insights CSP 域 |
| 5 | 漏斗 / 视觉系统 | 🟢 完成(LedgersInMotion 形状冗余作为 follow-up) | 4 页 VoltageCallout 漏斗化、章节编号统一 № 01–05(/apply 无编号)、AnimationBudget CSS 配套、移动端 hero-orb 熔断、`prefers-reduced-motion` 全局接管 |

---

## 关键决策(ADR)

### ADR-MR-001 · 不一次性迁 Next 16 Cache Components

**决策**:Phase 2 先用 `export const dynamic = 'force-static'` + `revalidate` 落地静态化。Cache Components(`'use cache'` + `cacheLife` + `cacheTag`)作为 Phase 6 候选,在 force-static 稳定后再迁。

**理由**:Cache Components 与 next-intl 的兼容性需要验证;阶段化降低单次变更面;force-static 已经能解决 P0 的"营销页全部 dynamic"问题。

### ADR-MR-002 · Theme 改为 client inline script(去掉 layout 的 `cookies()`)

**决策**:`app/[locale]/layout.tsx` 不再调用 `cookies()` 读 theme。在 `<head>` 注入同步 inline script,从 `document.cookie` 或 `localStorage` 读取并写入 `<html data-theme>`,paint 前完成。

**理由**:`cookies()` 是 dynamic API,layout 一旦使用就让整树动态化 — 代价大于一次 inline script 的 FOUC 风险。同步 inline script 在 paint 前执行,FOUC 实际可控。

### ADR-MR-003 · `/apply` 不进卷期编号系统

**决策**:`/`、`/about`、`/how-it-works`、`/nodes`、`/pob` 用连续编号 № 01 → № 05。`/apply` 不挂卷期号,改用 "Application" 作为 section 标签。

**理由**:`/apply` 实质是表单页,叙事上是"出版物 → 表格"的跳出。挂上 № 06 会让卷期编号系统语义混乱。

### ADR-MR-004 · 卷期罗马字 `Volume · MMXXVI` 全 locale 保持英文+罗马字

**决策**:`common.editorial.volumeIssue` 在所有 10 个 locale 文件中保持英文字符串 `"Volume · MMXXVI"`。不本地化。

**理由**:卷期罗马字是品牌一致性的一部分(参考 The Atlantic / Stripe Press 的卷期标识)。让它和 brand name `WCN` / `Web3 Capital Network` 同等地位,跨语言不翻。该决策可在 v3 重审。

### ADR-MR-005 · 用 ESLint AST 规则而非 type-system 防 i18n 漏写

**决策**:在 `eslint.config.mjs` 加 `no-restricted-syntax` 规则,匹配 JSX 文本节点中 ≥2 词英文短语 → 报错。Phase 1 期间用 `warn`,Phase 1 完成后升 `error`。白名单:品牌名 `WCN`、`Web3 Capital Network`、`PoB`、`Editor's note`(过渡期间允许,Phase 1 完成后移除)。

**理由**:TypeScript 无法限制 JSX 文本节点;ESLint AST 规则成本最低、生效最快、CI 自动拦截回归。

---

## Phase 0 · 度量基线 & 工程护栏 ✅

### 已做
- 建立本决策日志(本文件)
- ESLint flat config 加 `no-restricted-syntax` 规则(已升 **error** 级别,Phase 1 验证 0 violation 后)
  - `files` 用 `app/*/...` 通配符匹配 `[locale]` 动态段(micromatch 字符类陷阱见 commit 注释)
  - 正则 `[A-Z]\\S* [A-Za-z]+` 覆盖 ASCII 撇号 / Unicode curly quote / `Operating Loop` 这类双大写词

### 待后续(不阻塞 Phase 1)
- Lighthouse CI 加入 5 个营销路由的基线快照(`metrics/marketing-baseline.json`)
- `npm run analyze` 输出 marketing chunk 体积基线

---

## Phase 1 · i18n 收口

### 收口的命名空间

新增 `common.editorial.*`,跨页共享:

| key | en | zh |
|---|---|---|
| `editorsNote` | Editor's note | 编者按 |
| `affirmative` | Affirmative | 肯定 |
| `negative` | Negative | 否定 |
| `rewarded` | Rewarded | 予以奖励 |
| `notRewarded` | Not rewarded | 不予奖励 |
| `designedFor` | Designed for | 面向 |
| `operatingLoop` | Operating Loop | 运行循环 |
| `attribution` | Attribution | 归因 |
| `boundary` | Boundary | 边界 |
| `volumeIssue` | Volume · MMXXVI | Volume · MMXXVI(ADR-MR-004) |

### 修复的硬编码位置

| 文件:行 | 原字符串 | 新调用 |
|---|---|---|
| `app/[locale]/page.tsx:161` | `Designed for` | `t("editorial.designedFor")` |
| `app/[locale]/page.tsx:200` | `Operating Loop` | `t("editorial.operatingLoop")` |
| `app/[locale]/how-it-works/page.tsx:113` | `Editor's note` | `tCommon("editorial.editorsNote")` |
| `app/[locale]/nodes/page.tsx:165` | `Editor's note` | 同上 |
| `app/[locale]/nodes/page.tsx:214` | `Affirmative` | `tCommon("editorial.affirmative")` |
| `app/[locale]/nodes/page.tsx:232` | `Negative` | `tCommon("editorial.negative")` |
| `app/[locale]/pob/page.tsx:138` | `Editor's note` | 同上 |
| `app/[locale]/pob/page.tsx:193` | `Rewarded` | `tCommon("editorial.rewarded")` |
| `app/[locale]/pob/page.tsx:211` | `Not rewarded` | `tCommon("editorial.notRewarded")` |
| `app/[locale]/pob/page.tsx:346` | `Attribution` | `tCommon("editorial.attribution")` |
| `app/[locale]/pob/page.tsx:358` | `Boundary` | `tCommon("editorial.boundary")` |
| 6 处 masthead `Volume · MMXXVI` | 写死 | `tCommon("editorial.volumeIssue")`(实际值仍是英文,但走 i18n 闸门) |

### 新增工具:`lib/wiki-link.ts`

替代 `/about` 写死的 `/wiki/project-intro/1-1-wcn-是什么` 链接。

```ts
export function getWikiHref(locale: string, chapterSlug: string, sectionNumber: number): string
```

实现思路:用 `getAllDocs(locale)` 反查 `(chapterSlug, meta.order === sectionNumber)` 对应的 `href`;未命中则 fallback 到 `zh` locale。

---

## 度量基线(Phase 0 完成后填入)

| Metric | Baseline | Phase 1 后 | Target |
|---|---|---|---|
| 营销页 P75 LCP (mobile) | _待测_ | _待测_ | < 1.5s |
| 营销页 P75 CLS | _待测_ | _待测_ | < 0.05 |
| `globals.css` 行数 | 11,321 | 11,321 | ≤ 5,000 |
| 5 个营销 page.tsx 行数 | ~1,410 | ~1,420 | ≤ 800 |
| i18n 硬编码英文残留 | 19 | **0** ✅ | 0 |
| Lighthouse Performance (mobile) | _待测_ | _待测_ | ≥ 90 |
| Lighthouse SEO | _待测_ | _待测_ | = 100 |
| Lighthouse a11y | _待测_ | _待测_ | ≥ 95 |

---

## 进度日志

- **2026-05-27**:启动 Phase 0 + Phase 1。本日志建立。
- **2026-05-27**:Phase 0 完成 — ESLint i18n 护栏配置并升 `error` 级别;决策日志建立;5 个 ADR 落地。
- **2026-05-27**:Phase 1 完成 — 19 处硬编码英文(8 处短语 + 6 处单词 + 5 处 `Volume · MMXXVI` masthead + `Prologue` + `Example request`)收口到 `common.editorial.*` / `home.mastheadSection` / `about.archFlowExample`,跨 10 个 locale 写入;`lib/wiki-link.ts` 新增,about 页中文 slug 硬编码消除;`ArchitectureLayers` 组件接受 `exampleRequestLabel` prop;`tsc --noEmit` 通过;`npx eslint app components` 0 marketing errors。
- **2026-05-27**:Phase 2 完成 — `<ThemeScript>` 新组件用同步 inline 脚本设 `<html data-theme>`;`layout.tsx` 移除 `cookies()` 调用;6 个营销页全部声明 `dynamic = 'force-static'` + `revalidate = 86400`;`tsc` 通过。
- **2026-05-27**:Phase 4 完成 — `vercel.json` 删除与 `next.config.mjs` 重复的 headers(含已废弃的 `X-XSS-Protection`);`lib/csp.ts` 封装 strict nonce-based CSP + `generateCspNonce()`;`proxy.ts` 每请求生成 nonce,通过 `x-nonce` header + `Content-Security-Policy-Report-Only` 联合发布(待 1 周观察后切 enforcing);`next.config.mjs` 现有 enforcing CSP 补 `https://va.vercel-scripts.com` + `https://vitals.vercel-insights.com` 域,修复 Vercel Analytics/Speed Insights 静默失败;`layout.tsx` 读 nonce 并 propagate 给 `<ThemeScript>` 和 JSON-LD;`app/sitemap.ts` canonical 改裸路径,`lastModified` 改用 `fs.statSync(filePath).mtime` 而非 `new Date()`;JSON-LD `description` 走 `tMeta("ogDescription")`,`inLanguage` 改单值 locale;`lib/og-image-template.tsx` 共享 OG 模板,`[locale]/opengraph-image.tsx` 重写走 i18n,新增 `/about,/how-it-works,/nodes,/pob,/apply` 5 个 per-page OG image。
- **2026-05-27**:Phase 3 完成 — 新增 `components/marketing/page-masthead.tsx`(替代 6 套 masthead 实现)、`section-head.tsx`、`dual-slab.tsx`(替代 3 套 yes/no 卡片);5 个营销页(/, /how-it-works, /nodes, /pob, /apply)迁移到 `<PageMasthead>`(/about 保留 `<EditorialMasthead>`,后者内部 masthead bar 改造作为下一轮 follow-up);/nodes + /pob 的 yes-no 卡片迁移到 `<DualSlab>`(/about 的 split-board 特殊形态保留);新增 `scripts/prune-old-marketing-css.mjs` 自动删除 6 个旧 prefix(`nodes-masthead`/`pob-masthead`/`apply-masthead`/`hiw-issue`/`nodes-dual`/`pob-bound`)的顶层 CSS 规则;`globals.css` 从 11,433 → 11,113 行(-321);`globals.css` 末尾新增 `.dual-slab-*` 统一样式。
- **2026-05-27**:Phase 5 完成 — `VoltageCallout` 支持 `/pob` 路径;4 个营销页的 CTA 重写为渐进漏斗(/→/how-it-works+/about,/about→/how-it-works+/wiki,/how-it-works→/nodes+/pob,/nodes→/apply+/pob,/pob 和 /apply 已经在正确位置);`<PageMasthead>` 的 `issueNumber` 改为可选,/apply 不再挂 № 06(ADR-MR-003);`globals.css` 新增 `[data-anim-paused="true"]` 规则真正暂停 IntersectionObserver-标记的动画 host;`@media (max-width: 768px)` 移动端禁掉 `hero-orb::before` 的 18s 漂移动画;`@media (prefers-reduced-motion: reduce)` 全局接管所有动画/过渡。LedgersInMotion 的形状色觉冗余作为下一轮 follow-up,因为涉及视觉判断。
- **2026-05-27**:**端到端 build 验证通过** — `npm run build` 编译成功,2000 个静态页生成(10 locale × 6 marketing routes 全部 SSG + revalidate=1d),构建用时 21.8s。1 个 Turbopack NFT 信息性 warning 来自 `next-intl/plugin` 的 fs 扫描,不阻塞。
- **2026-05-27**:Follow-up #1 完成(Task 21)— `EditorialMasthead` 内部 masthead bar 切到 `<PageMasthead/>`;`.editorial-masthead-bar` / `-issue` / `-rule` / `-date` 4 个子 className 从 globals.css 删除(prune 脚本扩展)。`globals.css` 11,149 → 11,126(-23)。
- **2026-05-27**:Follow-up #2 完成(Task 22)— 17 个内联 `<div className="section-head section-head-numbered">` JSX 块迁移到 `<SectionHead/>` 组件(home 3 + about 5 + how-it-works 2 + nodes 4 + pob 3)。`<SectionHead/>` 扩展支持 `titleClassName` / `ledeClassName` 保留 page-specific h2/lede 样式(待后续 design token 整合移除)。第二次 build 验证通过,21.8s,2000 静态页全部正常生成。
- **2026-05-27**:user 给 `<PageMasthead/>` 加可选 `issueNumber`(supports /apply 不进入卷期)。/apply 调用方同步移除 `issueNumber="№ 06"`,实现 ADR-MR-003。
- **2026-05-27**:Follow-up #3 完成(Task 23)— `<DualSlab/>` 新增 `variant="feature"`,/about 的 split-slab(watermark + 顶图标 + ul)收口到该 variant。`/about` 删除 `CheckCircle2 / XCircle` import,DualSlab 内部统一处理图标。组件层面 yes/no dual cards 现在是单一信息源(3 套实现 → 1 套)。
- **2026-05-27**:Follow-up #4 完成(Task 24)— 把 12 个 page-specific section style 规则(.about-/.hiw-/.pob- × section-h2/-lede/-head/-eyebrow)的公共定义提升到 `.section-head h2 / .section-head p / .section-head-numbered` 基础选择器,然后从 globals.css 删除 12 个重复规则(净 -53 行)。SectionHead 调用方移除多余的 `titleClassName="*-section-h2" ledeClassName="*-section-lede" className="*-section-head"` props(13 处)。保留 `.nodes-section-h2`(更大字号)和 `.hiw-loop-h2`(最大字号)作为视觉变体。`.section-head h2 em` 多 selector 规则修复(prune 副作用导致首选择器孤悬)。
- **2026-05-27**:**全部 Follow-up 完成后最终 build 验证通过** — `npm run build` 25.1s,2000 静态页全部 SSG。globals.css 从 baseline 11,321 行降到 **11,089 行**(净 -232 行,含新增 dual-slab/section-head/动画规则共 ~88 行,删除旧 prefix 共 ~320 行)。

---

## 当前度量(全 Phase + Follow-up #1/#2 完成后)

| Metric | Baseline | After All Phases | Target | 状态 |
|---|---|---|---|---|
| `globals.css` 行数 | 11,321 | 11,125(净 -196:+88 新 dual-slab + 动画规则,-321 旧 prefix,-23 EditorialMasthead 子样式) | ≤ 5,000 | 🟡 部分(继续 CSS layer 拆分) |
| 5 个营销 page.tsx 总行数 | ~1,410(/ 245 + about 322 + hiw 240 + nodes 338 + pob 382) | 1,544(/ 254 + about 344 + hiw 254 + nodes 324 + pob 368 + apply 137) — 6 个页面 vs baseline 5 个;每页人均下降 | ≤ 800 | 🟡 部分(组件抽象到位,但 page 内仍有较多 page-specific JSX) |
| i18n 硬编码英文残留 | 19 | **0** | 0 | ✅ |
| layout 是否 dynamic | 是(cookies) | 否(`<ThemeScript>`) | 否 | ✅ |
| 营销页是否静态 | 否 | 是(6 路由全部 SSG + revalidate=1d) | 是 | ✅ |
| Production build time | _未测_ | **21.8s**(2000 静态页) | < 60s | ✅ |
| CSP `'unsafe-inline'` script | 是 | 是(enforcing 保留)+ Report-Only 验证 nonce 策略 | 否 | 🟡 进行中(1 周观察后切) |
| sitemap canonical | `/${locale}/about` | `/about` (裸) | 裸 | ✅ |
| 唯一 OG images | 1 共用 | 6 独立(layout-level + 5 page-level) | 5–6 独立 | ✅ |
| 漏斗 CTA 唯一性 | 5 页全部 `/apply` | 4 种渐进路径 | 渐进 | ✅ |
| AnimationBudget 实际生效 | 否(无 CSS 配套) | 是(`animation-play-state: paused`) | 是 | ✅ |
| 单一信息源 masthead | 6 套实现 | **1 套**(`<PageMasthead/>`) | 1 套 | ✅ |
| 单一信息源 section-head | 25+ 内联实现 | **1 套**(`<SectionHead/>`,17 处迁移完成) | 1 套 | ✅ |
| 单一信息源 dual-slab | 3 套实现 | 2 套(`<DualSlab/>` + /about's split-board 特殊形态) | 1 套 | 🟡 部分 |

## 下一轮 Follow-up

### 已完成
- ✅ **Follow-up #1 已完成**:EditorialMasthead 内部 masthead bar 切到 `<PageMasthead>`(Task 21)
- ✅ **Follow-up #2 已完成**:25+ 内联 section-head 迁移到 `<SectionHead>` 组件(Task 22,17 处实际数量)

### 待办
1. **CSP 切换 enforcing**(观察期内):Report-Only 观察 1 周无 violation 后,把 `next.config.mjs` 中的 `Content-Security-Policy` 替换为 `lib/csp.ts` 的 strict 策略,删 `'unsafe-inline'` script。
2. **DualSlab 收口 /about**:`/about` 的 `.about-split-slab` 特殊形态(带 watermark 和不同 grid)合并到 `<DualSlab>`,作为新 variant `tone="watermarked"`。
3. **LedgersInMotion 色觉冗余**:三个节点改用不同 SVG 形状(circle/square/triangle),让色觉缺陷用户能区分。
4. **CSS layer 拆分**:`globals.css` 拆成 `tokens.css` / `base.css` / `marketing/*.css` 多个文件,接入 PostCSS layer,目标 ≤ 5,000 行 critical CSS。`globals.css` 当前 11,125 行。
5. **Hero headline 互换**(可选):/about 的更具体 headline 移到 /,/ 的 "Capital meets proof" 改为 manifesto 区域的 pull-quote。需用户审美 review。
6. **page-specific CSS 整合**:`titleClassName="pob-section-h2"` / `"nodes-section-h2"` / `"about-section-h2"` / `"hiw-section-h2"` 这些为 SectionHead 保留的 page override 类,合并到设计 token,删 4 个 page-specific h2 样式块。
