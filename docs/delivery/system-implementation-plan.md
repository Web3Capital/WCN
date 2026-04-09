# WCN Operating Console — 系统级实施规划

> 版本: 1.0 | 日期: 2026-04-09
> 状态: 待审核

---

## 一、当前架构诊断

### 已有能力

| 层面 | 当前状态 | 成熟度 |
|------|---------|--------|
| 认证 | NextAuth v4 + JWT + email/password | ★★☆☆☆ |
| 角色 | 二元 USER/ADMIN | ★☆☆☆☆ |
| 数据隔离 | 节点归属制 (`member-data-scope.ts` + `member-redact.ts`) | ★★★☆☆ |
| Node CRUD | 列表 + 创建 + 状态变更 + 席位/质押/惩罚 | ★★★☆☆ |
| Project/Task | 基础 CRUD + 分配 | ★★★☆☆ |
| PoB/Evidence | 打分 + 归因 + 确认 + 争议 | ★★★☆☆ |
| Settlement | 周期创建 + 生成分配行 + 锁定 | ★★★☆☆ |
| Agent | 注册 + 权限 + 运行记录 | ★★☆☆☆ |
| 审计日志 | 16 种 action + append-only | ★★★☆☆ |
| Review | 应用 + PoB 审核留痕 | ★★☆☆☆ |
| 文件管理 | 无 | ☆☆☆☆☆ |
| 通知 | 无 | ☆☆☆☆☆ |
| Deal Room | 无 | ☆☆☆☆☆ |
| Capital Pool | 无 | ☆☆☆☆☆ |
| 风控 | 无独立模块 | ☆☆☆☆☆ |
| 2FA | 无 | ☆☆☆☆☆ |
| 邀请制 | 无 | ☆☆☆☆☆ |
| 工作区 | 无 | ☆☆☆☆☆ |
| 中间件路由守卫 | 无 middleware.ts | ☆☆☆☆☆ |

### 架构负债

1. **角色过于简单** — 二元 `requireAdmin()` 无法表达 9 种角色 × 4 层权限
2. **无路由级中间件** — 仅靠 layout redirect，绕过前端可直接访问 API
3. **无 workspace 隔离** — 所有数据在同一 namespace
4. **TaskStatus 与 PRD 不统一** — 当前 5 态 vs PRD 要求 9 态
5. **PoBRecord.status 复用 ApplicationStatus** — 应有独立状态枚举
6. **无文件版本化** — Evidence 只存 URL，无法追溯
7. **Session 类型只有 id + role** — 需要扩展 workspace、accountStatus

---

## 二、关键架构决策 (ADR)

### ADR-1: 角色与权限模型

**决策**: 采用 **枚举角色 + 策略表** 双层架构

```
可见/可操作 = hasRole(action) 
            × inTerritory(entity.region) 
            × meetsConfidentiality(entity.level, user.clearance) 
            × isParticipant(entity, user)
```

- `Role` 枚举扩展为 11 个值
- 新建 `Permission` 策略表，定义 `role → resource → action → allow/deny`
- 新建 `lib/permissions.ts` 统一权限检查函数 `can(user, action, resource)`
- **不做**: 完整 ABAC/PBAC 引擎（过度设计）
- **迁移**: 现有 `ADMIN` 映射为 `FOUNDER`，现有 `USER` 映射为 `NODE_OWNER`

### ADR-2: Workspace 隔离

**决策**: 引入 Workspace 但 **Sprint 0 只支持单 workspace**

- 建立 `Workspace` + `WorkspaceMembership` 表
- 所有核心实体加 `workspaceId` 外键
- Sprint 0 自动创建 default workspace 并关联所有用户
- Sprint 2+ 开放多 workspace 切换
- **理由**: 数据模型一步到位，但避免 Sprint 0 scope 爆炸

### ADR-3: 认证升级路径

**决策**: 分两步走

- **Sprint 0a**: 邀请制 + 密码登录 + 账户状态机
- **Sprint 0b**: 2FA (TOTP) + Magic Link + 设备管理
- 依赖新增: `otpauth` (TOTP), `qrcode` (QR 生成)
- 现有 NextAuth CredentialsProvider 保留，在 `authorize()` 中加 2FA 验证步骤

### ADR-4: 状态机统一

**决策**: 5 条独立状态线，每条有明确的合法转换矩阵

| 状态线 | 模型 | 枚举 |
|--------|------|------|
| Account | User.accountStatus | `INVITED → ACTIVE → SUSPENDED → LOCKED → OFFBOARDED` |
| Node | Node.status | `DRAFT → SUBMITTED → UNDER_REVIEW → NEED_MORE_INFO → APPROVED → CONTRACTING → LIVE → PROBATION → SUSPENDED → OFFBOARDED` |
| Deal | Deal.stage | `SOURCED → MATCHED → INTRO_SENT → MEETING_DONE → DD → TERM_SHEET → SIGNED → FUNDED / PASSED / PAUSED` |
| Task | Task.status | `DRAFT → ASSIGNED → IN_PROGRESS → SUBMITTED → ACCEPTED → REWORK → BLOCKED → CANCELLED → CLOSED` |
| Evidence/PoB | 分离为 Evidence.reviewStatus + PoBRecord.pobStatus |

每条状态线实现 `lib/state-machines/<name>.ts`，导出 `canTransition(from, to)` 和 `validNextStates(from)`。

### ADR-5: 文件层

**决策**: S3-compatible 对象存储 + Prisma 元数据

- `File` 模型存元数据 (filename, hash, version, confidentiality, entityBinding)
- `FileAccessLog` 记录每次下载/预览
- 实际文件存储: 先用本地 `uploads/` 目录，后续切 S3
- 集成 `crypto` 模块做 SHA-256 hash
- **不做**: 自建 CDN、实时协同编辑

### ADR-6: Deal Room 数据模型

**决策**: Deal = 业务闭环的容器

- `Deal` 模型是核心枢纽，连接 Project、Capital、Node、Task、Evidence、PoB
- `DealParticipant` 控制可见性（替代简单的 node ownership）
- 所有 Task/Evidence/PoB 支持 `dealId` 外键
- Deal Room 页面 = 单个 Deal 的 360° 视图

---

## 三、Sprint 规划

### Sprint 0: 基础设施层 (预计 3-4 周)

**目标**: 把地基从"原型"升级到"可运营"

#### S0-Phase A: 数据模型重构

| 序号 | 任务 | 涉及文件 | 依赖 |
|------|------|---------|------|
| S0-A1 | 扩展 Role 枚举 (11 值) | `schema.prisma`, `next-auth.d.ts`, `lib/auth.ts` | — |
| S0-A2 | 新建 AccountStatus 枚举 + User 字段扩展 | `schema.prisma` | — |
| S0-A3 | 新建 Workspace + WorkspaceMembership 模型 | `schema.prisma` | — |
| S0-A4 | 新建 Invite 模型 | `schema.prisma` | S0-A3 |
| S0-A5 | 新建 File + FileAccessLog 模型 | `schema.prisma` | — |
| S0-A6 | 新建 Notification 模型 + NotificationType 枚举 | `schema.prisma` | — |
| S0-A7 | 扩展 NodeStatus 枚举 (11 值) | `schema.prisma` | — |
| S0-A8 | 统一 TaskStatus 枚举 (9 值) | `schema.prisma` | — |
| S0-A9 | 新建 PoBEventStatus 枚举，分离 PoBRecord.status | `schema.prisma` | — |
| S0-A10 | 新建 ConfidentialityLevel 枚举 | `schema.prisma` | — |
| S0-A11 | 新建 CapitalStatus + DealStage 枚举 | `schema.prisma` | — |
| S0-A12 | 新建 CapitalProfile 模型 | `schema.prisma` | S0-A11 |
| S0-A13 | 新建 Deal + DealParticipant + DealMilestone + DealNote 模型 | `schema.prisma` | S0-A11 |
| S0-A14 | 扩展 Task (dealId, assigneeUserId, evidenceRequired) | `schema.prisma` | S0-A8 |
| S0-A15 | 扩展 Evidence (fileId, hash, version, reviewStatus, dealId) | `schema.prisma` | S0-A5 |
| S0-A16 | 扩展 PoBRecord (dealId, leadNodeId, pobStatus, loopType 等) | `schema.prisma` | S0-A9 |
| S0-A17 | 新建 RiskFlag 模型 | `schema.prisma` | — |
| S0-A18 | 新建 AgentLog 结构化日志模型 | `schema.prisma` | — |
| S0-A19 | 扩展 AuditLog (deviceInfo, ipAddress, workspaceId) | `schema.prisma` | S0-A3 |
| S0-A20 | 扩展 SettlementCycle (reconciledAt, exportedAt, reopenedAt 等) | `schema.prisma` | — |
| S0-A21 | 运行 prisma migrate dev 生成迁移 | migration | 全部 S0-A* |

#### S0-Phase B: 权限引擎

| 序号 | 任务 | 涉及文件 | 依赖 |
|------|------|---------|------|
| S0-B1 | 新建 `lib/permissions.ts` — `can(user, action, resource)` | `lib/permissions.ts` | S0-A1 |
| S0-B2 | 定义权限策略常量 (role → resource → actions) | `lib/permissions.ts` | S0-B1 |
| S0-B3 | 新建 `lib/state-machines/` 目录 — account, node, deal, task, evidence-pob, settlement | `lib/state-machines/*.ts` | S0-A7-A11 |
| S0-B4 | 重构 `lib/admin.ts` → `requireRole(roles[])` + `requirePermission(action, resource)` | `lib/admin.ts` | S0-B1 |
| S0-B5 | 新建 `middleware.ts` — 路由级 JWT 检查 + workspace 注入 | `middleware.ts` | S0-A1 |
| S0-B6 | 扩展 `next-auth.d.ts` — Session.user 加 accountStatus, workspaceId, permissions | `next-auth.d.ts` | S0-A2 |
| S0-B7 | 更新 `lib/auth.ts` JWT callback — 加载完整角色 + workspace + accountStatus | `lib/auth.ts` | S0-B6 |
| S0-B8 | 数据迁移脚本: ADMIN→FOUNDER, USER→NODE_OWNER, 创建 default workspace | `prisma/seed.ts` | S0-A21 |

#### S0-Phase C: 认证升级

| 序号 | 任务 | 涉及文件 | 依赖 |
|------|------|---------|------|
| S0-C1 | 安装 `otpauth` + `qrcode` 依赖 | `package.json` | — |
| S0-C2 | 新建 `POST /api/invites` — 创建邀请 | `app/api/invites/route.ts` | S0-A4 |
| S0-C3 | 新建 `GET /api/invites` — 列表 | `app/api/invites/route.ts` | S0-C2 |
| S0-C4 | 新建 `POST /api/invites/[token]/activate` | `app/api/invites/[token]/activate/route.ts` | S0-A4 |
| S0-C5 | 新建邀请激活页面 `/invite/[token]` | `app/invite/[token]/page.tsx` | S0-C4 |
| S0-C6 | 新建 2FA 设置 API | `app/api/account/2fa/setup/route.ts` | S0-C1 |
| S0-C7 | 新建 2FA 验证 API | `app/api/account/2fa/verify/route.ts` | S0-C6 |
| S0-C8 | 修改 `authorize()` 加 2FA 检查 + 账户状态检查 | `lib/auth.ts` | S0-C7 |
| S0-C9 | 新建 2FA 设置页面 `/account/2fa` | `app/account/2fa/page.tsx` | S0-C6 |
| S0-C10 | 新建账户设置页面 `/account` | `app/account/page.tsx` | — |
| S0-C11 | 新建会话管理 API + 设备列表 | `app/api/account/sessions/route.ts` | — |
| S0-C12 | 新建密码修改 API | `app/api/account/password/route.ts` | — |
| S0-C13 | 账户状态机: invited→active→suspended→locked→offboarded | `lib/state-machines/account.ts` | S0-B3 |
| S0-C14 | 连续登录失败锁定逻辑 | `lib/auth.ts` | S0-A2 |

#### S0-Phase D: 文件层 + 审计扩展

| 序号 | 任务 | 涉及文件 | 依赖 |
|------|------|---------|------|
| S0-D1 | 新建 `POST /api/files` — 上传 + hash | `app/api/files/route.ts` | S0-A5 |
| S0-D2 | 新建 `GET /api/files/[id]` — 下载 + 访问日志 | `app/api/files/[id]/route.ts` | S0-A5 |
| S0-D3 | 新建 `GET /api/files/[id]/versions` — 版本历史 | `app/api/files/[id]/versions/route.ts` | S0-A5 |
| S0-D4 | 扩展审计日志 action 常量 (登录/退出/邀请/文件下载/导出等) | `lib/audit.ts` | — |
| S0-D5 | 审计 API 增加按对象、用户、时间、动作过滤 | `app/api/audit/route.ts` | S0-D4 |
| S0-D6 | 新建邀请管理页面 `/dashboard/admin/invites` | `app/dashboard/admin/invites/page.tsx` | S0-C2 |

---

### Sprint 1: 入驻与资源结构化 (预计 3 周)

**目标**: Node 全生命周期 + Project Pool + Capital Pool + My Workspace

#### S1-Phase A: Node Console 全生命周期

| 序号 | 任务 | 依赖 |
|------|------|------|
| S1-A1 | 升级 Node API — 完整 11 态状态机，含 territory claim | S0 |
| S1-A2 | 新建 `GET /api/nodes/[id]` — 完整详情 + 关系 | S0 |
| S1-A3 | 新建 `POST /api/nodes/[id]/review` — 审核通过/驳回/补件 | S0 |
| S1-A4 | 新建 `POST /api/nodes/[id]/contract` — 发送合同 | S0 |
| S1-A5 | 新建 `POST /api/nodes/[id]/probation` — 发起考察 | S0 |
| S1-A6 | 新建 `POST /api/nodes/[id]/offboard` — 下线 | S0 |
| S1-A7 | Node 详情页升级 — 合同/计费/onboarding tracker | S1-A2 |
| S1-A8 | Node 审核页 `/dashboard/nodes/[id]/review` | S1-A3 |
| S1-A9 | Node 扩展字段: entityName, allowedServices, riskLevel, billingStatus 等 | S0-A21 |

#### S1-Phase B: Project Pool

| 序号 | 任务 | 依赖 |
|------|------|------|
| S1-B1 | 升级 Project API — 新状态 + 分层可见性 (confidentialityLevel) | S0 |
| S1-B2 | 新建 `GET /api/projects/[id]` — 详情 + 材料分层 | S0 |
| S1-B3 | 新建 `POST /api/projects/[id]/materials` — 带保密级别的材料上传 | S0-D1 |
| S1-B4 | 项目详情页 `/dashboard/projects/[id]` | S1-B2 |
| S1-B5 | 项目材料四层: 基础档案 / 可分享 / 受限 / 内部评分 | S1-B3 |

#### S1-Phase C: Capital Pool

| 序号 | 任务 | 依赖 |
|------|------|------|
| S1-C1 | 新建 Capital CRUD API (GET/POST/PATCH) | S0-A12 |
| S1-C2 | 新建 `GET /api/capital/[id]` | S0-A12 |
| S1-C3 | Capital 列表页 `/dashboard/capital` | S1-C1 |
| S1-C4 | Capital 详情页 `/dashboard/capital/[id]` | S1-C2 |
| S1-C5 | Capital 数据隔离 — 投资人不能看其他投资人 | S0-B1 |

#### S1-Phase D: My Workspace 升级

| 序号 | 任务 | 依赖 |
|------|------|------|
| S1-D1 | Dashboard 首页按角色渲染不同 widget 组合 | S0-B4 |
| S1-D2 | 我的活跃 Deal / Loop 区块 | S1 |
| S1-D3 | 今日待办 Task + 待补件证据 | S1 |
| S1-D4 | 审核队列 / SLA 倒计时 (Reviewer 视图) | S1 |
| S1-D5 | 快捷动作: 新建 Deal、上传证据、发起审核、注册 Agent | S1 |
| S1-D6 | 本月 KPI / 节点评分 / 区域评分 (Node Owner 视图) | S1 |

---

### Sprint 2: 协同主流程 (预计 3-4 周)

**目标**: Deal Room + Task 统一 + Agent 工作台 + 全局搜索

#### S2-Phase A: Deal Room

| 序号 | 任务 | 依赖 |
|------|------|------|
| S2-A1 | Deal CRUD API (GET/POST/PATCH) + 10 态状态机 | S0-A13, S0-B3 |
| S2-A2 | `GET /api/deals/[id]` — 完整 room 数据 | S2-A1 |
| S2-A3 | DealParticipant API — 添加/移除参与人 | S2-A1 |
| S2-A4 | Deal Materials API — 上传 + 访问日志 | S0-D1, S2-A1 |
| S2-A5 | DealNote API — 沟通纪要 | S2-A1 |
| S2-A6 | DealMilestone API — 里程碑 | S2-A1 |
| S2-A7 | Deal Room 列表页 `/dashboard/deals` | S2-A1 |
| S2-A8 | Deal Room 详情页 `/dashboard/deals/[id]` — 360° 视图 | S2-A2 |

#### S2-Phase B: Task 统一

| 序号 | 任务 | 依赖 |
|------|------|------|
| S2-B1 | Task API 升级 — 9 态状态机 + dealId 关联 | S0-A8 |
| S2-B2 | Task 详情页 `/dashboard/tasks/[id]` | S2-B1 |
| S2-B3 | Task 支持 human + agent 混合分配 | S2-B1 |
| S2-B4 | 任务验收流程: submitted → accepted / rework | S2-B1 |

#### S2-Phase C: Agent 工作台

| 序号 | 任务 | 依赖 |
|------|------|------|
| S2-C1 | Agent 详情页 `/dashboard/agents/[id]` | S1 |
| S2-C2 | Agent 日志页 `/dashboard/agents/[id]/logs` + AgentLog API | S0-A18 |
| S2-C3 | Agent freeze 三级 override (L1/L2/L3) | S2-C1 |
| S2-C4 | Agent 硬性限制校验 (不能改 PoB、不能发起付款等) | S2-C1 |

#### S2-Phase D: 全局搜索

| 序号 | 任务 | 依赖 |
|------|------|------|
| S2-D1 | 扩展 Spotlight 搜索 — 支持所有实体 ID 和名称 | S1 |
| S2-D2 | `/api/search` — 跨实体 fulltext 搜索 | S1 |

---

### Sprint 3: 验证主流程 (预计 3 周)

**目标**: Proof Desk + PoB 生命周期 + 争议 + 通知

#### S3-Phase A: Proof Desk

| 序号 | 任务 | 依赖 |
|------|------|------|
| S3-A1 | Evidence API 升级 — reviewStatus + SLA 计时 | S0-A15 |
| S3-A2 | `GET /api/proof/queue` — Reviewer 队列 (SLA 排序) | S3-A1 |
| S3-A3 | `POST /api/proof/[id]/review` — 审核 + 补件 + 驳回 | S3-A1 |
| S3-A4 | 证据最低门槛校验 (按闭环类型) | S3-A1 |
| S3-A5 | 自动驳回规则: 单方口述、不可追溯截图等 | S3-A1 |
| S3-A6 | Proof Desk 队列页 `/dashboard/proof` | S3-A2 |
| S3-A7 | Proof Desk 审核页 `/dashboard/proof/[id]` | S3-A3 |

#### S3-Phase B: PoB 升级

| 序号 | 任务 | 依赖 |
|------|------|------|
| S3-B1 | PoBRecord 使用独立 PoBEventStatus (5 态) | S0-A9 |
| S3-B2 | PoB 详情页 `/dashboard/pob/[id]` | S3-B1 |
| S3-B3 | PoB 归因规则: 一条闭环只允许一个 lead_node_id | S3-B1 |
| S3-B4 | "补件 → 复核 → 仲裁" 回路 | S3-A3 |

#### S3-Phase C: 争议流程升级

| 序号 | 任务 | 依赖 |
|------|------|------|
| S3-C1 | Dispute 关联 Deal (不只是 PoB) | S2-A1 |
| S3-C2 | 争议窗口 5 天计时 | S3-C1 |
| S3-C3 | SLA 倒计时 (初检 24h / 一审 2 工作日 / 高风险二审 2-3 工作日) | S3-C1 |

#### S3-Phase D: 通知系统

| 序号 | 任务 | 依赖 |
|------|------|------|
| S3-D1 | Notification CRUD API | S0-A6 |
| S3-D2 | 通知触发器 (Task 分配 / 补件 / 驳回 / 争议 / 封账前 48h) | S3-D1 |
| S3-D3 | 通知中心页 `/dashboard/notifications` | S3-D1 |
| S3-D4 | 顶部栏通知 bell + badge count | S3-D3 |
| S3-D5 | 每日/每周摘要逻辑 (后续可接邮件) | S3-D2 |

---

### Sprint 4: 结算与风控 (预计 2-3 周)

**目标**: Settlement Cockpit + Data Cockpit + Risk Console

#### S4-Phase A: Settlement Cockpit

| 序号 | 任务 | 依赖 |
|------|------|------|
| S4-A1 | Settlement 状态扩展: RECONCILED / EXPORTED / REOPENED | S0-A20 |
| S4-A2 | Dual control: 锁定/重开需要两人确认 | S4-A1 |
| S4-A3 | 导出 API (CSV/JSON) | S4-A1 |
| S4-A4 | Settlement 详情页 `/dashboard/settlement/[id]` | S4-A1 |
| S4-A5 | 三套账分离显示: 现金收入 / PoB / WCN 权益 | S4-A4 |
| S4-A6 | 结算倒计时顶部栏组件 | S4-A1 |

#### S4-Phase B: Data Cockpit

| 序号 | 任务 | 依赖 |
|------|------|------|
| S4-B1 | `GET /api/data/overview` — 网络健康指标 | S3 |
| S4-B2 | `GET /api/data/nodes` — 节点活跃度 | S3 |
| S4-B3 | `GET /api/data/pob` — PoB 分布 | S3 |
| S4-B4 | Data Cockpit 页面 `/dashboard/data` | S4-B1 |
| S4-B5 | 图表组件 (可考虑 recharts 或 lightweight) | S4-B4 |

#### S4-Phase C: Risk Console

| 序号 | 任务 | 依赖 |
|------|------|------|
| S4-C1 | RiskFlag CRUD API | S0-A17 |
| S4-C2 | 高风险触发检测: 关联方/自成交/跨法域 | S4-C1 |
| S4-C3 | Emergency override API (冻结案件/停用 Agent/锁定结算/关闭入口) | S4-C1 |
| S4-C4 | Risk Console 页面 `/dashboard/risk` | S4-C1 |
| S4-C5 | 权限矩阵可视化 | S4-C4 |
| S4-C6 | Override 48h 补书面报告追踪 | S4-C3 |

---

## 四、技术依赖与新增包

| 包 | 用途 | Sprint |
|----|------|--------|
| `otpauth` | TOTP 2FA | S0 |
| `qrcode` | 2FA QR 码生成 | S0 |
| `@types/qrcode` | TypeScript 类型 | S0 |
| `crypto` (内置) | 文件 SHA-256 hash | S0 |
| `recharts` 或 `@nivo/core` | Data Cockpit 图表 | S4 |

---

## 五、数据迁移策略

### 角色迁移 (S0-B8)

```sql
-- 1. 扩展枚举
ALTER TYPE "Role" ADD VALUE 'FOUNDER';
ALTER TYPE "Role" ADD VALUE 'NODE_OWNER';
-- ... (其他新角色)

-- 2. 映射现有用户
UPDATE "User" SET role = 'FOUNDER' WHERE role = 'ADMIN';
UPDATE "User" SET role = 'NODE_OWNER' WHERE role = 'USER';

-- 3. 创建 default workspace
INSERT INTO "Workspace" (id, name, slug) VALUES (gen_random_uuid(), 'WCN Default', 'default');

-- 4. 关联所有现有用户
INSERT INTO "WorkspaceMembership" (id, "userId", "workspaceId", role)
  SELECT gen_random_uuid(), id, (SELECT id FROM "Workspace" WHERE slug='default'), role
  FROM "User";
```

### TaskStatus 迁移

```
OPEN → DRAFT (if no assignee) or ASSIGNED
IN_PROGRESS → IN_PROGRESS
WAITING_REVIEW → SUBMITTED
DONE → CLOSED
CANCELLED → CANCELLED
```

### PoBRecord.status 迁移

```
PENDING → CREATED (pobStatus)
REVIEWING → PENDING_REVIEW
APPROVED → EFFECTIVE
REJECTED → REJECTED
```

---

## 六、非功能要求实施

| 要求 | 实施方式 | Sprint |
|------|---------|--------|
| 服务端 ACL | `middleware.ts` + `lib/permissions.ts` | S0 |
| 关键操作全量审计 | `writeAudit()` 扩展 30+ action 类型 | S0-S4 |
| 文件版本化 | File 模型 + parentFileId 链 | S0 |
| 敏感文件访问日志 | FileAccessLog 自动记录 | S0 |
| 已锁结算不可修改 | 状态机 + middleware 拦截 | S4 |
| SLA 计时器 | evidence/review 的 `slaDeadlineAt` + cron check | S3 |
| 中文为主 / 英文 key 预留 | 保留现有 cookie-based i18n，未来可迁移 next-intl | 持续 |
| API-first | 所有页面从 RSC 读取，不直接写 SQL | 已遵循 |
| 导出按角色分级 | 导出 API 内 `can(user, 'export', resource)` 检查 | S4 |
| 核心对象不硬删除 | 所有 DELETE 改为 soft delete (status → ARCHIVED) | S0 起 |

---

## 七、风险与缓解

| 风险 | 等级 | 缓解措施 |
|------|------|---------|
| Role 枚举扩展导致大量 API 路由重构 | 高 | S0 先统一 permissions.ts，逐 Sprint 替换 requireAdmin |
| Prisma 迁移可能失败 (字段类型变更) | 中 | 用 `--create-only` 先生成、人工审查后再 apply |
| TaskStatus 迁移丢失语义 | 中 | 编写迁移脚本 + 单元测试验证映射 |
| Deal Room 复杂度远超预期 | 高 | Sprint 2 先做最小可用版 (项目卡片 + 参与人 + 材料 + 阶段) |
| 2FA 影响现有用户登录 | 中 | 2FA 初期只强制高权限角色，低权限角色可选 |
| 文件存储容量 | 低 | 先用本地 + 大小限制，S4 迁移 S3 |
| Workspace 引入后所有 query 都要加 workspaceId | 高 | S0 只创建 default workspace，暂不过滤；Sprint 2 开始 workspace-scoped query |

---

## 八、验收标准 (对应 PRD 十、上线验收标准)

| # | 验收项 | 对应 Sprint | 测试方式 |
|---|--------|------------|---------|
| 1 | 节点在系统内完成申请→补件→审批→合同→上线 | S1 | 端到端走完 11 态流程 |
| 2 | 项目和资本方在 Deal Room 看结构化材料 + 状态 + 下一步 | S2 | 创建 Deal → 加参与人 → 上传材料 → 推进阶段 |
| 3 | 闭环在 Proof Desk 提交证据→多方确认→归因→争议 | S3 | 完整 Proof → PoB → Attribution → Dispute 流程 |
| 4 | 结算周期能关闭: PoB / 争议 / 拒绝 / frozen 清单同时可见 | S4 | 创建周期 → 生成 → reconcile → lock → export |
| 5 | Founder 不需要回聊天记录找真相 | 全部 | 任意对象的审计日志可完整反查 |

---

## 九、实施建议

1. **先 schema，后 API，再 UI** — 每个 Sprint 内部严格按 模型→接口→页面 顺序推进
2. **每个 Sprint 结束时做一次 `tsc --noEmit` + `npm run build`** — 确保类型安全
3. **Sprint 0 是全局地基** — 不要为了速度跳过权限引擎和状态机，后面每个 Sprint 都依赖它
4. **Deal Room 是产品核心** — 如果时间紧，Capital Pool 可以简化，但 Deal Room 不能砍
5. **迁移脚本要可重跑** — 所有数据迁移必须是幂等的
