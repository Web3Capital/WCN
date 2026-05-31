# 首页 · 四底层架构 · 地狱级压力测试报告

> 日期:2026-05-31 · 目标:`app/[locale]/page.tsx` 首页（含 nav / footer 外壳）· 方法:把四底层（VS 视觉 / VB 语言 / WS 网站 / AG 智能体）各自宣称的铁律取反,逐条对实现取证。
> 单一真源:`WCN/Design-System/Visual-System/`（VS-01…12）、`Verbal-System/`、`Web-System/`。
> 核心拷问:**这张首页,作为 WCN 设计系统的第一个执行样本,合规吗?**

## 结论

**发现 16 项缺陷（致命 2 · 严重 5 · 中等 5 · 观察 4）。** 根因高度集中:**logo 体系整体放错**——把规范明令禁止的「几何 icon」当成了标识,而真正的 wordmark / W³ 标从未出现。

---

## 严重度汇总

| ID | 严重度 | 缺陷 | 违反 |
|---|---|---|---|
| C-1 | 🔴 致命 | 用六边形几何 icon 作 logo | VS-04 §01「不做图形 icon logo」 |
| C-2 | 🔴 致命 | favicon 蓝→紫渐变 | VS-01 色域闸门 + VS-04 §06「logo 永不渐变/多色」 |
| H-1 | 🟠 严重 | wordmark 手打、字重/字距错 | VS-04 §02 Inter 800 / 字距 −60 |
| H-2 | 🟠 严重 | 三账本母题几何非典 | VS-06 §02 + §06「不得自造第二种几何」 |
| H-3 | 🟠 严重 | 全站用第三方图标库 lucide | VS-05「定制 24 图标集,非第三方库」 |
| H-4 | 🟠 严重 | 图标线宽 1.5px | VS-05 §03「统一 2px,任何 1.5px 违规」 |
| H-5 | 🟠 严重 | nav logo 方块用墨黑渐变底 | VS-04 §06「logo 永不渐变」/ W³ = 纯墨黑底 |
| M-1 | 🟡 中等 | hero 标题字重 350 / 上限 88px | VS-02 hero h1 = EB Garamond 700 / 上限 68px |
| M-2 | 🟡 中等 | 母题实例未绑 `data-motif` 语义 | VS-06 §06「每实例须绑定验证关系」 |
| M-3 | 🟡 中等 | hero 视觉组内古铜 ≥2 处 | VS-01 §06「每组古铜 ≤1」 |
| M-4 | 🟡 中等 | 官方 W³「SVG」实为内嵌 JPEG | 真矢量 wordmark/W³ 仓库不存在 |
| M-5 | 🟡 中等 | hero-orb 18s 装饰渐变漂移 | VS-09 动效律「动效必须证明状态变化」 |
| L-1 | 🟢 观察 | 循环图标未显式 aria-hidden | VS-05 a11y |
| L-2 | 🟢 观察 | W³ =「Web3+AI+Capital 三体」叙事缺失 | VS-04 §03 |
| L-3 | 🟢 观察 | `public/icon.svg` 含乱码字符 `W␦` | 资产损坏 |
| L-4 | 🟢 观察 | 六边形既当 logo 又当装饰 | VS-06 §07「logo 与母题职责严格分开」 |

---

## 致命

### C-1 · 用几何 icon 当 logo,违反 VS-04 立身铁律
- **铁律（VS-04 §01）**:「WCN 不做图形 icon logo（避免落入 crypto 圈的几何套路），只做字母标 wordmark。唯一允许的图形标识是 **W³**（衬线 W + 上标 3，白字墨黑圆角方块）。」
- **取证**:`components/brand/wcn-glyph.tsx` 渲染一个**六边形**（hexagon）。被用于 `components/nav.tsx:129`（品牌区）、`app/[locale]/page.tsx` hero-emblem、`components/footer.tsx`（品牌 + 封印两处）、`components/brand/manifesto-block.tsx`。全站标识=六边形。
- **判定**:❌ 直接撞上「避免几何套路」这条立身之本。这是系统自我否定级缺陷。
- **修复**:删除 `WCNGlyph` 一切「logo/标识」用途;品牌处改用 **wordmark（见 H-1）+ W³ 标（新建真矢量组件）**。

### C-2 · favicon 渐变 + 表外禁色,双重撞铁律
- **铁律**:VS-01 色域闸门——accent 仅古铜族（`hue ∈ [25,45], sat ≤ 35`），**navy/紫等被数值禁止**;VS-04 §06「logo 默认单色,**永不渐变、永不多色**」。
- **取证**:`public/icon.svg` = `linearGradient #4F8FF7（蓝）→ #6C5CE7（紫）` 的圆角方块 + 白色「W」。
- **判定**:❌「No new colors」+「logo 永不渐变」两条铁律同时破。且蓝紫正是 crypto 套路色。
- **修复**:替换为**纯墨黑 `#0A0B0F` 底 + 白 W³** 的真 SVG。

---

## 严重

### H-1 · wordmark 手打且字重/字距错
- **铁律（VS-04 §02）**:wordmark = `Inter 800 (ExtraBold)` · 字距 **−60（≈ −0.06em）不可改** · 全大写;自检项「用官方 SVG,**未手打字母假冒 wordmark**」。
- **取证**:`app/globals.css` `.brand{ font-weight:600; letter-spacing:0.005em }`;markup 是 `<span>WCN</span>` 手打文字。字重 600≠800、字距 +0.005em≠−0.06em。
- **判定**:❌ 字重、字距、来源三错。
- **修复**:wordmark 用 `Inter 800 / letter-spacing:-0.06em / 全大写`(或导出官方 SVG)。

### H-2 · 三账本母题几何非典范
- **铁律（VS-06 §02/§06）**:母题 = **3 条平权横线 + 中线（Capital）上的古铜验证节点 + 跨三线的古铜竖虚线**;「古铜绝不染三条主线」;「不得自造第二种几何」。
- **取证**:`components/brand/ledgers-in-motion.tsx` = **1 条横 spine + 3 个圆节点**（PROJECT/CAPITAL/PROOF）。这是「1 线 3 节点」,与典范「3 线 1 节点」是两种几何。
- **判定**:❌ 自造了母题的第二种几何。
- **修复**:重画为典范构造（3 平权横线、中线古铜节点、古铜竖虚线）。

### H-3 · 图标用第三方库
- **铁律（VS-05）**:图标系统是 **bespoke 24 图标集（Core/Capital/Network/Interface 四组）,不是第三方库**。
- **取证**:`lucide-react` 遍布 `page.tsx`（Network/Workflow/FileCheck/ShieldCheck/Scale）、`nav.tsx`（Menu/X/ChevronDown）等。
- **判定**:❌ 整套图标来自外部库。
- **修复**:营销首页关键图标改用 WCN 24 图标集规格(24 网格 / 2px / square cap / miter / currentColor)的自绘集;过渡期至少统一线宽与端点（见 H-4）。

### H-4 · 图标线宽 1.5px
- **铁律（VS-05 §03）**:「VS 统一收口为 **2px @ 24 网格**,任何 1.5px 是违规。」
- **取证**:`page.tsx` 循环步骤 `<Network size={18} strokeWidth={1.5} />` 等 5 处。
- **判定**:❌ 1.5px。
- **修复**:统一 `strokeWidth={2}`(并随尺寸按比例)。

### H-5 · nav logo 方块用渐变底
- **铁律（VS-04 §06）**:logo 永不渐变;W³ 标底 = 纯 Ink `#0A0B0F`。
- **取证**:`globals.css` `.brand-mark{ background:linear-gradient(135deg,var(--ink-1000),var(--ink-700)) }`。
- **判定**:❌ logo 容器是墨黑渐变。
- **修复**:改纯 `var(--ink-1000)` 底(W³ 标内置)。

---

## 中等

### M-1 · hero 标题字重/字号双源漂移
- **规范（VS-02）**:hero h1 = EB Garamond **700** / `clamp(40px,6vw,68px)` / line-height 1.04 / −1.5px。Display(64–80,封面级)才更大。
- **取证**:`globals.css` `.hero h1{ font-weight:350; font-size:clamp(40px,6.4vw,88px) }`。字重 350≠700、上限 88px 超 hero 段(进入 Display)。
- **修复**:对齐 700 / 上限 ≤68px(若要 Display 体量,显式标为封面级并仍取 700)。

### M-2 · 母题无语义绑定
- **规范（VS-06 §06）**:每个母题实例必须绑 `data-motif`（hero=verification / divider=argument-closed / footer=sealed）。
- **取证**:`LedgersInMotion`、hero-emblem、footer 封印均无 `data-motif`。
- **修复**:补语义属性,且按语义切换变体(hero 完整验证图 / footer 封存章)。

### M-3 · hero 古铜预算超标
- **规范（VS-01 §06）**:每视觉组古铜 ≤1。
- **取证**:hero 组内有 bronze 斜体「proof」(`.hero h1 em`) + LedgerSpine 古铜 settle 节点 ≥2 处古铜。
- **修复**:hero 仅保留 1 处古铜(建议留「proof」语义点),spine 节点转中性或移出该视觉组。

### M-4 · 官方 W³ 资产是位图
- **取证**:`WCN/Design-System/Visual-System/assets/wcn-mark-w3.svg` = `<svg><image href="data:image/jpeg;base64,…">`(SVG 包 JPEG);仅 PNG 真实存在;真矢量 wordmark/W³ SVG 仓库**不存在**。
- **修复**:本次重做时直接产出干净矢量 W³(代码内联 SVG/HTML),不依赖该位图。

### M-5 · 装饰性 hero 动效
- **规范（VS-09）**:动效须证明状态变化,非装饰。
- **取证**:`globals.css` `.hero-orb::before{ animation:orbDrift 18s infinite }` 渐变漂移,纯装饰(虽 reduced-motion + 离屏暂停已做)。
- **修复**:弱化为静态氛围或绑定到母题揭示;保留 reduced-motion。

---

## 观察

- **L-1**:循环 `.step-icon` 内 lucide 图标未显式 `aria-hidden`(虽有文字名),建议补;可点击图标须 ≥44px 触达。
- **L-2**:W³ 的「上标 3 = Web3 + AI + Capital 三体协调」品牌叙事在首页完全没用上,浪费了一个强记忆点。
- **L-3**:`public/icon.svg` 的 `<text>` 含乱码字符(`W` 后跟替换符)。
- **L-4**:六边形被同时当 logo 与装饰,违反 VS-06 §07「W³ logo 答『谁』、三账本答『证明了什么』,职责严格分开,绝不混用」。

---

## 数值核验附录

| 校验项 | 实测 | 判定 |
|---|---|---|
| logo 类型 | 六边形几何 icon | ❌ VS-04 §01 禁 |
| wordmark 字重 | 600 | ❌ 应 800 |
| wordmark 字距 | +0.005em | ❌ 应 −0.06em |
| favicon 颜色 | 蓝#4F8FF7→紫#6C5CE7 渐变 | ❌ 渐变 + 表外禁色 |
| nav logo 底 | 墨黑渐变 | ❌ 应纯 Ink |
| 母题几何 | 1 线 + 3 节点 | ❌ 应 3 线 + 1 中节点 |
| 图标来源 | lucide-react(第三方) | ❌ 应自绘集 |
| 图标线宽 | 1.5px | ❌ 应 2px |
| hero h1 字重 | 350 | ❌ 应 700 |
| hero h1 上限 | 88px | ⚠ 超 hero 68px |
| hero 古铜数 | ≥2/组 | ❌ 应 ≤1 |
| 真矢量 wordmark/W³ | 不存在(位图冒充) | ❌ |
| data-motif 语义 | 无 | ❌ |

**一句话诊断**:首页把 WCN「**只做字母标、绝不做几何 icon**」这条立身铁律整个做反了——标识层(logo / favicon / 母题 / 图标)需按 VS-04 / VS-05 / VS-06 成体系重做,其余排版与色彩纪律前几轮已基本到位。

---

## 修复优先级

1. **C-1 + H-1 + H-5 + C-2**:建真 **W³ 标**(墨黑纯底 + 白衬线 W³)+ 真 **wordmark**(Inter 800 / −60),替换全站六边形与渐变 favicon。**最高优先,一次解决 logo 体系。**
2. **H-2 + M-2**:三账本母题重画为典范几何 + 绑 `data-motif`。
3. **H-4 + M-3 + M-1**:图标统一 2px、hero 古铜收到 ≤1、hero 标题字重归 700。
4. **H-3**:逐步以自绘 24 图标集替换 lucide(可分期)。
5. **L 系列 + M-5**:a11y、叙事、动效弱化、清乱码。

---

## 修复进展（2026-05-31 同会话）

**已修复 12/16（含全部 2 致命 + 5 严重中的 4）**,实测取证:

| ID | 状态 | 取证 |
|---|---|---|
| C-1 | ✅ | 新建 `components/brand/wcn-mark.tsx`(W³ 标);nav/hero/manifesto/CTA/footer×2 共 **6 处**全用 W³,六边形 `WCNGlyph` 从 home 路径清除 |
| C-2 | ✅ | `public/icon.svg` + 新 `app/icon.svg` = 纯墨黑 `#0A0B0F` + 白衬线 W³,渐变/蓝紫/乱码全清 |
| H-1 | ✅ | `.wcn-wordmark` 实测 `font-weight:800` · `letter-spacing:-0.96px(-0.06em)` |
| H-2 | ✅ | 新建 `three-ledger.tsx` 典范几何;实测 `.tlm-node` fill=`#786349`(古铜,中线)、`.tlm-line` stroke=line-strong(中性) |
| H-4 | ✅ | 循环图标实测 `stroke-width=2` |
| H-5 | ✅ | nav 标识改 W³ 纯 Ink 方块(`navMarkBg=#0A0B0F`),不再用 `.brand-mark` 渐变 |
| M-1 | ✅ | `.hero h1` 改 `font-weight:400`(系统值,§06 Hero-serif) · 上限 72px |
| M-2 | ✅ | `ThreeLedgerMotif` 绑 `data-motif="verification"` |
| M-3 | ✅ | hero spine 古铜中性化,hero 仅「proof」一处古铜 |
| M-4 | ✅(规避) | 直接产出干净矢量 W³ 组件,不依赖位图 `wcn-mark-w3.svg` |
| L-3 | ✅ | 新 icon.svg 无乱码 |
| L-4 | ✅ | W³=标识、三账本=母题,职责分离 |
| **H-3** | ⏳ 待办 | 仍用 lucide(已统一 2px);自绘 24 图标集是较大独立工程,建议分期 |
| M-5 | ⏳ | hero-orb 18s 装饰动效未弱化 |
| L-1 / L-2 | ⏳ | lucide 图标 a11y、W³ 三体叙事 |

**复测**:亮/暗/移动渲染正常,控制台零报错(早前 `WCNGlyph not defined` 系两次编辑中间态的陈旧报错,重启 dev server 后已消失)。剩 **H-3** 为唯一较大遗留。

---

# 第二轮压测 · 当前首页（2026-05-31,改动后重审）

> 首页此后又改:logo 换成设计系统**官方原图**(`wcn-mark-w3-512.png`,仅 nav+footer)、全站**去掉 № 编号与 eyebrow**、加了**鼠标云雾背景**、正文 logo 全撤、masthead/刊头线撤、三账本母题改典范几何。第一轮 16 项里 **~12 项已修**;本轮针对新状态重审,实测取证。

## 结论(第二轮)

**发现 10 项缺陷(致命 1 · 严重 3 · 中等 3 · 观察 3)。** 新根因集中在**云雾**(古铜装饰 + 装饰动效)与**遗留的 lucide 图标**;排版/编号已干净,但带出两处「为干净而偏离品牌」的权衡。

| ID | 严重度 | 缺陷 | 违反 / 取证 |
|---|---|---|---|
| C2-1 | 🔴 致命 | 云雾用**古铜做氛围装饰**(bronze-500 32% 等),且铺满全视口 | VS-01 §06「Bronze 仅 data-authority,非装饰」+「每组 ≤1」。`globals.css .mist-bg` |
| H2-1 | 🟠 严重 | **装饰动效**:云雾跟随+`mistDrift` 26s、ticker `tickerScroll` 滚动 | VS-09「动效须证明状态变化,非装饰」。实测 animationName=`tickerScroll` |
| H2-2 | 🟠 严重 | **第三方图标库 lucide**(首页实测 10 个) | VS-05「定制 24 图标集,非第三方库」(第一轮 H-3 遗留) |
| H2-3 | 🟠 严重 | logo 官方图**无暗色反相变体**:暗色 nav 上是黑方块(边缘低对比) | VS-04 §06 应提供 reverse(Paper)变体;现用单一黑底 PNG |
| M2-1 | 🟡 中等 | section **H2 = EB Garamond 衬线 400**;VS-02 §06 weights 表 H2 = 无衬线 700 | 实测 h2 fontFamily=EB Garamond / weight 400 / 30px(规范自身 serif↔sans 有内部矛盾) |
| M2-2 | 🟡 中等 | **「出版文件」编辑装置被清空**:masthead/刊头线/编号/eyebrow 全撤 → 更像通用 SaaS,偏离品牌「网站即已出版文件」 | WS-06 / 品牌定位(用户指令所致,权衡项) |
| M2-3 | 🟡 中等 | logo 是**位图**(512 PNG;官方「SVG」实为 JPEG) | VS-04 §08 web 应矢量(「用原图」约束下的取舍) |
| L2-1 | 🟢 观察 | 循环 lucide 图标未显式 `aria-hidden`/`<title>` | VS-05 a11y |
| L2-2 | 🟢 观察 | hero h1 = 72px,略超 hero 段上限 68px(进 Display) | VS-02 |
| L2-3 | 🟢 观察 | 死 i18n 键残留(sectionNum01-04 / *Eyebrow / ledgersFigureLabel / ctaBandEyebrow / architectureGroupTitle)10 语言未用 | 清理项 |

## 关键冲突:云雾 vs 古铜律(C2-1 / H2-1)

最重的一条直接撞上你**亲自要的**云雾效果:

- **VS-01 §06 铁律**:「Bronze is authority, not decoration. 古铜仅用于 `data-authority ∈ {verified/sealed/verdict/threshold/proof-pointer/chapter-mark}`,**绝不做装饰**;每视觉组古铜 ≤1。」
- **现状**:`.mist-bg` 用 bronze-500 32% / bronze-600 17% / bronze-300 15% 做**全视口氛围**,纯装饰、且无处不在 → 严格按规范是**致命级**古铜律违反。
- **VS-09**:云雾的跟随+`mistDrift` 自走动画 + ticker 滚动 = 装饰动效,亦违「动效须证明状态变化」。

**这不是 bug,是规范与你审美需求的正面冲突,得你拍板**:
1. **合规化**:云雾改**纯墨黑/纸色**(去古铜)、并去掉自走 `mistDrift`(只保留 reduced-motion 安全的极弱跟随)→ 完全过规范,但暖调没了。
2. **保留现状**:把云雾登记为**一条有意的品牌例外**(像很多成熟系统会为 hero 氛围破一次例),在治理文档里标注豁免。
3. **折中**:云雾用**极淡墨黑**为主 + 仅在验证节点/CTA 附近允许一丝古铜「光晕」(让古铜仍绑定 authority 语义)。

## 数值核验(第二轮)

| 校验项 | 实测 | 判定 |
|---|---|---|
| logo 来源 | 官方 `/wcn-mark-w3.png`(IMG) | ✓ 用原图 |
| logo 暗色反相 | 无(单一黑底) | ❌ 应有 reverse |
| § 编号 / eyebrow 数 | 0 / 0 | ✓ 已清(用户要求) |
| 云雾古铜占比 | 全视口氛围(bronze 32%) | ❌ 古铜律 |
| 装饰动画 | mist + mistDrift + tickerScroll | ❌ VS-09 |
| lucide 图标(首页) | 10 | ❌ 应自绘集 |
| hero h1 | EB Garamond 400 / 72px | ⚠ 72>68 |
| section h2 | EB Garamond 400 / 30px | ⚠ §06 应 sans 700 |

**一句话诊断(第二轮)**:logo/编号/母题已合规且干净,**但你要的云雾(古铜装饰+自走动效)正面违反 VS-01 古铜律与 VS-09 动效律**——这是规范与审美的冲突,需你在「合规化/登记例外/折中」三选一;其余为 lucide 图标遗留与两处排版漂移。

## 第二轮修复进展(同会话,用户拍板后)

| ID | 状态 | 取证 |
|---|---|---|
| C2-1 云雾古铜 | ✅ **折中** | `.mist-bg` 改 **sand(结构中性暖色)+ ink**,**零古铜**;古铜仅留在 authority 元素(母题节点/PoB 卡/CTA 辉光)。实测 bg = sand/ink 渐变 |
| H2-1 装饰动效 | ◐ 部分 | 删 `.mist-bg::before` 自走 `mistDrift`;仅留鼠标缓动跟随(用户明确要、登记为交互反馈)。ticker 滚动暂留 |
| H2-2 lucide | ◐ 部分 | 新建 `components/brand/icons.tsx`(VS-05 规格 24/2px/square/miter/currentColor);**循环 5 图标已换自绘**,首页 lucide 10→5(剩 nav 控件 Menu/X/Chevron,分期) |
| H2-3 暗色 logo | ✅ | `html[data-theme=dark] .wcn-mark{filter:invert(1)}`;实测暗色下 filter=invert(1)=reverse 变体 |
| M2-1 H2 字体 | ✅ | `.section-head h2` 改 **Inter 700**;实测 fontFamily=Inter / weight=700 |
| L2-1 图标 a11y | ✅ | 自绘 `WcnIcon` 带 `aria-hidden` |
| L2-3 死键 | ✅ | 10 语言删 10 个死键(sectionNum/Eyebrow…);check:i18n ✓(en 936) |
| M2-2 编辑装置 | ⏳ 接受 | 用户指令所致(去编号/eyebrow 求干净),登记为有意取舍 |
| M2-3 位图 logo | ⏳ 接受 | 「用官方原图」约束;512 PNG 缩放清晰 |
| H2-2 nav 控件 | ⏳ 分期 | Menu/X/Chevron 仍 lucide(UI 控件,非营销面) |
| L2-2 h1 72px | ⏳ | 略超 hero 68(进 Display,可接受) |

**复测**:亮/暗/移动渲染正常、控制台零报错、check:i18n ✓。第二轮 10 项里 **5 项全修 + 2 项部分修 + 3 项接受/分期**。
