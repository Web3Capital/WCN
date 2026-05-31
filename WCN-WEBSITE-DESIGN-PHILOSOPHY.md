# WCN 网站设计哲学规范 · 与首页系统设计

> 依据:四底层设计系统 — 视觉 VS（12 子系统）/ 语言 VB（8）/ 网站 WS（11）/ 智能体 AG。
> 真源:`WCN/Design-System/{Visual-System,Verbal-System,Web-System}/`、白皮书 v2.1。
> 适用:`wcn.network` 全站,首页为第一执行样本。
> 版本:Anno MMXXVI · 与视觉系统 v4「Sovereign Proof Ledger」同源。

---

# 第一部分 · 设计哲学规范

## 0. 一句话哲学

> **网站不是落地页,是一份「已出版的主权证明文件」。**
>
> Capital meets proof. 我们不说服,我们出示账本。

## 1. 四底层如何收敛成一条哲学

四个底层各司其职,但指向同一件事:**让「相信」被「复核后认可」替代**。

| 底层 | 类 | 使命 | 落到网站上 |
|---|---|---|---|
| 视觉 VS | 内容 | 让人**认出** | 墨黑作纸、古铜证真、其余皆信号;一套字、一个母题、一个标 |
| 语言 VB | 内容 | 让人**相信** | 审计师人格:确信而不喧哗,每句断言邻接出处 |
| 网站 WS | 内容 | 让人**用上** | 单一真源、@layer、无障碍、多语言、可机检 |
| 智能体 AG | 执行 | 让事**做成** | audit-first 治理观:每个动作留凭证、可调取复核 |

**收敛点**:网站的每一个像素、每一句话、每一次动效,都要经得起「这能被外部审计调取复核吗?」这一问。

## 2. 九条设计公理

每条 = 公理 · 出处 · 表现 · 守门(可机检)。

**公理一 · 证据先于修辞**
VB 第一支柱 Verifiable(100,不可让渡)。无出处不可断言;每个数字来自白名单 brief。网站是一份让读者亲自复核的案卷,不是一篇推销。
> 守门:禁伪造证言/指标;断言邻接 `documentRef`/来源。

**公理二 · 克制即权威**
VS-01 Decision A:「Ink acts. Bronze certifies. Colour only signals.」主操作=墨黑(非品牌色),强调来自结构与留白,不来自装饰。
> 守门:`--accent`/`--link` 必解析为 ink;voltage 仅 `--signal-info`。

**公理三 · 古铜是语义,不是装饰**
VS-01 §06 古铜律:Bronze is authority, not decoration。古铜仅落在 `data-authority ∈ {verified, sealed, verdict, threshold, proof-pointer, chapter-mark}`,**每视觉组 ≤1**,营销页每视口 ≤1。
> 守门:CI 计每块古铜填充数;营销路由禁三账本三色。

**公理四 · 结构承载层级**
VS-03 网格 + VB 节奏。8pt 网格、hairline 分隔、三类容器宽度(1040/1240/720)、八级字阶——层级用结构表达,不用噪声。
> 守门:无魔法数;正文测量 ≤68ch(EN)/36 字(CN)。

**公理五 · 三类字体,三种职责**
VS-02:「Serif for soul · Sans for system · Mono for evidence。」EB Garamond(封面/标题/引文)、Inter(正文/UI/H2-H3)、JetBrains Mono(数据/编号/ID)。职责不重叠;**数据必 mono**;中文/阿语永不斜体。
> 守门:Fraunces 已清;`em{italic}` 全局禁,斜体仅 `.i-en` 拉丁串。

**公理六 · 一个标,一个母题,零几何套路**
VS-04:WCN **不做图形 icon logo**——只做字母标 wordmark(Inter 800/字距 −60)+ **W³ 标**(衬线 W + 上标 3,墨黑方块,圆角=边长 1/6)。VS-06:唯一允许的几何是**三账本母题**(3 平权横线 + 中线古铜验证节点 + 古铜竖虚线);W³ 答「谁」,三账本答「证明了什么」,**职责严格分开**。
> 守门:禁六边形等 crypto 几何;logo 永不渐变/多色/倾斜;母题每实例绑 `data-motif`。

**公理七 · 动效证明状态,不做氛围**
VS-09:「Motion is choreography, not decoration. Evidence doesn't dance.」动效只为反馈/引导/揭示证据;`transform`/`opacity` only;CLS=0;reduced-motion 全局尊重;每页签名动效 ≤1。
> 例外(已登记):首页云雾为**鼠标交互反馈**,且改用 sand 中性(去古铜)、去自走动画,作为一条有意的氛围豁免。

**公理八 · 可机检的单一真源**
WS-11:`wcn-web-tokens.v1.json` 为真源 → `globals.css :root` 与 `tailwind.config` 为镜像,绝无第三处。新样式进 `@layer`。
> 守门:`check:tokens`(primitive 三处不漂移)、`check:i18n`(en 棘轮)。

**公理九 · 无障碍与多语言是底线**
WS-10:逻辑属性(RTL 自动镜像)、44px 触达、唯一 h1/landmark、skip-link、暗色双轨、focus 可见、10 语言。这是地基,不是附加。
> 守门:暗色双模必备(dark-parity);`/ar` 不漏英文。

## 3. 营销心理学定位

受众 = 11 年老兵 / 机构资本 / Country·Track operator——**已对炒作免疫**(白皮书窗口三:市场重新尊重结果)。对他们,**克制本身就是最强说服**:

- 不制造 FOMO,制造「我在读一家主权机构的创始文件」的庄重感。
- 把「加入」设计成一个**高门槛、被证据支撑的理性决定**,而非空投抢购。
- **自曝其短即信任信号**:风险全谱、audit-first、Token 被推迟——显眼地放,不藏。

> 一句话:别人用 FOMO 卖未来,我们用账本卖已发生。

## 4. 边界与禁令（零容忍）

| 维度 | 禁 |
|---|---|
| 标识 | 几何 icon logo(六边形…)、logo 渐变/多色/倾斜/描边、W³ 当普通图标 |
| 色彩 | 表外色(navy/紫…)、古铜做装饰、三账本三色出现在营销页、原始色值/primitive 进组件 |
| 文字 | 保证收益/稳赚/零风险/最/第一/唯一/革命性/颠覆/最后机会;无据强断言;海量/极速等虚量词;我个人/家人们 |
| 动效 | 装饰性自走动画、改变盒模型尺寸(CLS≠0)、无视 reduced-motion、>3Hz 闪烁 |
| 数据 | 伪造指标/证言、未标注的「示例」当真数据 |
| 图标 | 第三方库当成品(应自绘 24 网格集);1.5px 线宽 |

---

# 第二部分 · 首页系统设计

## 5. 首页的角色

首页 = 这份出版文件的**封面 + 摘要**。它不承担全部论证(那是各内页与 wiki),只做三件事:

1. **定义**:一句话说清 WCN 是什么(协议级定义)。
2. **建立可信**:用证据级的克制,让人愿意往下读。
3. **导向**:把读者送进申请或继续阅读两条路。

## 6. 信息架构与叙事弧

一条「杂志式」叙事弧,每屏只推进一步,互不重复:

```
书眉(身份) → 封面(是什么) → 凭据(协议级) → 纹理(账本长相)
   → 实质(三创新·一条逻辑链) → 母题(三账本验证)
   → 信念(为何用证据) → 机制(五步闭环) → 邀约(成为节点) → 版权页(封存)
```

What → Credentials → Texture → Substance → Motif → Belief → Mechanism → Invitation → Colophon。

## 7. 逐区块系统设计

每块标注:**角色 · 内容源 · 视觉(VS) · 语言(VB) · 交互(WS) · 合规**。

### 7.1 Nav · 书眉
- 角色:身份 + 寻路。内容源:VS-04。
- 视觉:**官方 W³ 原图**(暗色 `invert` 反相)+ Inter 800 wordmark「WCN」+ mono tagline「Sovereign Proof Ledger」。
- 语言:无营销文案,只导航词。交互:sticky + vellum blur + hairline 底;下拉为「索引」面板。
- 合规:logo 仅此 + 页脚;**去刊头线**(求干净)。

### 7.2 Hero · 封面
- 角色:协议级定义。内容源:白皮书 §01-02。
- 视觉:EB Garamond 大标题「资本,遇见<em>证据</em>」(em=唯一古铜);lede=协议定义;ink 主 CTA + 次 CTA;三账本 spine(中性)。**无 logo、无编号 masthead**。
- 语言:审计师定义句,句长 ≤40 字/25 词。交互:**鼠标云雾**(sand 中性,缓动跟随)。
- 合规:hero 古铜 = 1(proof em);云雾零古铜。

### 7.3 架构等级 · 凭据
- 角色:协议级资历(取代假「trusted by」)。内容源:白皮书 audit-first/three-ledger。
- 视觉:四枚中性 badge(Audit-first / Three-ledger / PoB / DAO-ready),**无标签**。合规:badge 颜色作用域中性化。

### 7.4 示例遥测 · 纹理
- 角色:让人看见「账本记录长什么样」。视觉:滚动条 + status-dot(中性化)。
- 语言:**显著标注「SAMPLE · illustrative」**(诚信)。合规:不得伪装真数据。

### 7.5 № 01 三个核心创新 · 实质 ★脊柱
- 角色:全站脊柱——节点网络 / AI Agent / PoB **串在同一条逻辑链**(与单点方案的根本区别)。内容源:白皮书 §01。
- 视觉:三卡等列(强调三者平权);PoB 卡为**验证锚点**,带唯一古铜(顶 rule + 「已验证」标);底部 caption「节点 → Agent → PoB · 同一条逻辑链」。
- 语言:每卡=结果证据式短句。合规:每卡古铜 ≤1;H2 = Inter 700。

### 7.6 № 02 三账本母题 · 签名
- 角色:把「同一笔事实被三账本验证」可视化。内容源:VS-06。
- 视觉:**典范几何**——3 平权横线(PROJECT/CAPITAL/PROOF)+ 中线(Capital)古铜验证节点 + 古铜竖虚线;框成「文献图版」。
- 交互:中线一颗脉冲(签名动效,reduced-motion 停)。合规:绑 `data-motif="verification"`;古铜绝不染三主线。

### 7.7 № 03 宣言 · 信念
- 角色:情感锚——「Trust should be earned by evidence, not granted by reputation」。内容源:白皮书 §06。
- 视觉:EB Garamond 大引文 + 署名。语言:三句陈述 + 一个立场。合规:无 logo、无编号。

### 7.8 № 04 五步闭环 · 机制
- 角色:证据如何变结算(节点→交易→任务→证明→结算)。内容源:白皮书 §08。
- 视觉:五步 + **自绘 WCN 图标**(24/2px/square cap);全中性 ink,**唯 Proof 步古铜**(验证锚点)。合规:三账本色不泄漏;图标非第三方库。

### 7.9 CTA · 邀约
- 角色:成为网络中的一个节点。内容源:白皮书 §17。
- 视觉:墨黑暗带 + 古铜辉光(authority 语义)+ ink/纸 双 CTA。**无 logo、无 eyebrow**。

### 7.10 Footer · 版权页 colophon
- 角色:像主权文件的版权页封存。视觉:serif 结尾名句「整个机构,即一本证明账本」+ W³ 封印;结构化栏目;**合规法律行**(不构成证券要约 / 辖区外部定性 / Phase 1–2 不向美国 Person);排版署名。

## 8. 系统映射表（元素 → 治理规范 → 实现）

| 首页元素 | 治理 | 规则 | 实现 |
|---|---|---|---|
| Logo | VS-04 | 官方 W³ + wordmark,仅页眉脚 | `WCNMark`→`/wcn-mark-w3.png` |
| 三账本母题 | VS-06 | 3 线 + 中线古铜节点 + 竖虚线 | `three-ledger.tsx` |
| 图标 | VS-05 | 24/2px/square/miter/自绘 | `icons.tsx` |
| 标题 | VS-02 | hero/引文=serif;H2=sans 700 | `.hero h1` / `.section-head h2` |
| 古铜 | VS-01 | 仅 authority,每组 ≤1 | PoB 卡 / 母题节点 / Proof 步 / CTA |
| 云雾 | VS-09(例外) | sand 中性 + 鼠标缓动,无自走 | `mist-background.tsx` |
| 文案 | VB | 审计师人格,断言带源 | `messages/*` |
| 真源 | WS-11 | token JSON → globals → tailwind | `check:tokens` |
| i18n/a11y | WS-10 | 10 语言 + 逻辑属性 + 暗色双轨 | `check:i18n` |

## 9. 首页合规自检（可机检）

| # | 检查项 | 判定 |
|---|---|---|
| L1 | logo = 官方 W³,仅页眉脚,暗色反相 | ✅ |
| L2 | 零六边形/几何 icon logo | ✅ |
| L3 | 母题 = 典范几何 + `data-motif` | ✅ |
| L4 | 古铜仅 authority,每组 ≤1;营销页无三账本三色 | ✅ |
| L5 | hero/引文 serif · H2 sans 700 · 数据 mono | ✅ |
| L6 | 图标自绘 24/2px(循环);nav 控件待分期 | ◐ |
| L7 | 动效 transform/opacity·CLS0·reduced-motion;云雾=中性鼠标反馈 | ✅ |
| L8 | 零伪造证言/指标;示例显著标注 | ✅ |
| L9 | 单一真源 `check:tokens` / `check:i18n` 绿 | ✅ |
| L10 | 暗色双轨 + 10 语言 + 逻辑属性 | ✅ |
| L11 | 无编号/eyebrow 杂讯(用户定调:干净) | ✅ |
| L12 | 控制台零报错;亮/暗/移动复测 | ✅ |

**一句话诊断**:首页已是这份设计哲学的合规第一执行样本;唯一未结清为 nav 控件图标(L6,分期)与一条有意的云雾氛围豁免(L7)。

## 10. 首页字体规范（定稿 · VS-02）

**一句话**:**Serif for soul · Sans for system · Mono for evidence。** 三族,三职责,不重叠。

| 角色 | 字族 | 字重 | 字号 | 用在哪 |
|---|---|---|---|---|
| Display 封面 | EB Garamond | **400** | clamp(40→68) | hero h1 |
| Pull-quote 引文 | EB Garamond | **400** | clamp(24→32) | manifesto · footer 名句 |
| Call 号召 | EB Garamond | **400** | clamp(32→40) | CTA 标题 |
| H2 章节标题 | **Inter** | **700** | clamp(26→28) | `.section-head h2` |
| H3 卡片标题 | **Inter** | **700** | 22 | `.innovation-title` |
| Lede 引言 | Inter | 400 | clamp(17→21) | `.hero-lede` |
| Body 正文 | Inter | 400 | 13–17 | 描述 / 卡片正文 |
| Label 名签 | Inter | 600 | 13 | `.step-name` |
| Wordmark | Inter | **800** | 16(字距 −0.06em) | `WCN` |
| Data 数据 | JetBrains Mono | 400–600 | 10–12 | 编号 / 标签 / ticker / caption |

**铁律**:
1. **衬线只给四个「voice」时刻**:hero 封面 · manifesto 引文 · CTA 号召 · 页脚名句;字重一律 **400**(已统一,清除全部 350)。
2. **一切结构标题(H2/H3)与正文用 Inter**——H2/H3 = 700,正文 = 400。卡片标题不再用衬线(原混用已修)。
3. **一切数据/编号/标签/ID 用 JetBrains Mono**(「数据必 mono」)。
4. **中文/阿语永不斜体**;斜体仅 EN `.i-en` 串(如 manifesto 的「*Trust*」)。`em{italic}` 全局禁。
5. 行高:封面 1.05 · 标题 1.16 · 引文 1.35 · 正文 1.55–1.6 · caption 1.5。正文测量 ≤68ch/36 字。
6. 字距:display −0.04em · 标题 tight −0.022em · eyebrow +0.16em · mono 0.01em。

> 取证(实测):hero/manifesto/CTA/footer = EB Garamond **400**;section h2 + 卡片标题 = Inter **700**;编号/标签 = JetBrains Mono;wordmark = Inter **800**。

---

Anno MMXXVI · WCN Foundation · 与 VS v4 / VB v1 / WS v1 同源
