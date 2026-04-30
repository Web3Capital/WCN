# ADR-0001 — Strangler Fig 演进策略

- **状态**: Accepted
- **日期**: 2026-04-30
- **决策者**: Tech Lead
- **范围**: WCN 整体架构演进（v3 → v4）

## 背景

WCN v3 已落地：~80 个 Prisma model、174 个 dashboard 页、12 角色 RBAC、三账本雏形、policy engine、AI agents。系统在生产中已有用户。

CTO 评审与多学科专家共识同时指向同一个结论：架构需向 **事件溯源 + CQRS + 加密锚定的三账本 + 机制设计驱动的协议层** 演进。但 80 model 的 schema 与 128 个 API route 不能一次重写。

## 决策

采用 **Strangler Fig**（Martin Fowler，2004）作为唯一的演进策略：新代码与老代码并存数月，逐步切换流量，最终淘汰老代码。

具体规约：

1. **不做大爆炸重写**。任何尝试"重写整个 X 域"的 PR 一律拒绝。
2. **每个 bounded context 独立迁移**。优先级：PoB → Capital → Settlement → Governance → Reputation → Node → 其余 reference data 不迁。
3. **每次迁移 5 阶段**：
   - A. Shadow event log（双写到 outbox，只观察）
   - B. Build read model（projection 表，与 DB 双查 diff）
   - C. Cut over read（feature flag 5% → 50% → 100%）
   - D. Cut over write（command bus + aggregate）
   - E. Saga 上线（跨域协调）
4. **每个改动可回滚**：feature flag + 旧路径保留 ≥ 30 天
5. **每个 schema 改动两阶段**：add column / table → backfill → cutover → drop（永远不在一次 deploy 内同时加和减）
6. **每周必须出 demo**：超过 2 周看不见进展的 epic 强制拆分

## 执行原则

- **读路径先于写路径**：新模型先做投影，写路径最后切（风险最低）
- **测试是闸门**：每个 `include → select` / RBAC 替换 / projection 切换必须有 regression test
- **一次只在一个 bounded context 操作**：PoB 跑稳前不启动第二个域
- **modular monolith 优先于微服务**：bounded context ≠ 独立部署

## 不做的事（the no list）

| 拒绝 | 原因 |
|---|---|
| 同步重写所有 80 model 到 ES | 大部分是 reference data，不需要 ES |
| 引入 Kafka | Postgres outbox + Inngest 在 Vercel 已够 |
| 微服务化拆分 | bounded context 不等于独立部署 |
| 自建 DID/VC/ZK 协议 | 用 W3C 标准 + didkit/veramo/zk-email |
| 从 Vercel 迁出 | Fluid Compute + AI Gateway 够用 |
| 用 Temporal | Inngest 在 Vercel 顺手；Temporal 自托管运维负担太重 |
| Q1 升 React 19 / Next 16 | 先把后端架构定下来 |
| 替换 Prisma → Drizzle | Prisma 7 + Accelerate 能吃下，ROI 不够 |
| 「重写整个 dashboard UI」的大 PR | 永远拆成 generic shell 渐进迁移 |
| Q1 启动 federation / 去中心化 | 太早，会让团队迷失方向 |

## 后果

**正面**：
- 生产持续运行，每周可上线
- 任意阶段失败可回滚
- 团队学习曲线可控（一次只学一个新概念）

**负面**：
- 双写期间代码复杂度暂时翻倍
- 整体演进比"clean rewrite"慢（但不会失败）
- 需要严守纪律——这是这个策略最大的风险

## 度量

- **Deploy frequency**：目标每日 ≥ 5（监控 GitHub Actions / Vercel Deployments）
- **Change failure rate**：目标 ≤ 5%（监控 incident count / total deploys）
- **MTTR**：目标 ≤ 30 min
- **每周 demo 出席率**：100%（缺席即失控信号）
- **Bounded context 迁移耗时**：PoB 预算 6 周，第二个域起 4 周

## 参考

- Fowler, M. (2004). [Strangler Fig Application](https://martinfowler.com/bliki/StranglerFigApplication.html)
- Vernon, V. (2013). *Implementing Domain-Driven Design*.
- 配套 ADR：
  - ADR-0002（待写）：PoB 域作为事件溯源首试点
  - ADR-0003（待写）：Outbox + Inngest 作为 event delivery 基础设施
  - ADR-0004（待写）：三账本 Merkle 锚定协议
