# Node Network System PRD v1.0

> **Status:** v1.0 baseline | **Layer:** WCN 组织中枢（Layer 1）  
> **Audience:** 产品、研发、设计、投资人  
> **Related:** [PRD-02 Node Management (legacy draft)](./02-node-management-system.md) · [Node system architecture](../architecture/node-system.md)

---

## 一、系统定位

节点系统是 WCN 的**核心组织系统（Layer 1）**，负责把「资源关系」转化为：

- 可审核的节点
- 可协同的责任单元
- 可结算的贡献主体
- 可治理的网络结构

**节点不是会员，不是标签**，是承担 **资源 → 闭环 → 证据 → PoB → 结算** 责任的最小运营单元。

---

## 二、系统目标（P0）

1. 建立全球节点池（Genesis 100）
2. 标准化节点准入与审核
3. 让节点进入 Deal / Task / Proof 流程
4. 建立节点评分与淘汰机制
5. 为 PoB 和记账提供责任主体

---

## 三、节点分类体系

### 3.1 节点类型（Node Type）

| 类型 | 定义 | 核心职责 |
|------|------|----------|
| Genesis / Core | 创世核心节点 | 起盘、重大资源 |
| Regional | 区域节点 | 本地资源整合 |
| City | 城市节点 | 本地项目/活动 |
| Vertical | 行业节点 | 专业筛选 |
| Functional | 功能节点 | 服务交付 |
| Agent Operator | Agent 节点 | Agent 执行 |

> **实现映射说明：** 当前代码库 Prisma `NodeType` 使用 `GLOBAL`, `REGION`, `CITY`, `INDUSTRY`, `FUNCTIONAL`, `AGENT` 等枚举；与上表语义对齐时需在产品层约定命名对照（如 GLOBAL ≈ Genesis/Core，INDUSTRY ≈ Vertical）。

### 3.2 节点维度结构（必须字段）

```text
Node:
  node_id
  node_type
  territory
  vertical
  owner_user_id
  legal_entity
  seat_level
  status
  risk_level
  score
```

### 3.3 Territory 模型

```text
Territory:
  region: Singapore / HK / UAE
  scope: Country / City / Vertical
  exclusivity: None / Conditional
  protected_accounts: []
```

---

## 四、核心模块设计

### 4.1 Node Apply（节点申请）

**功能**

- 外部节点申请入口

**字段（NodeApplication）**

- name, type, territory, contact, entity_info, resource_description, past_cases, references, boundary_statement, compliance_docs

**状态机**

`Draft → Submitted → Need Info → Under Review → Approved / Rejected → Contracting`

### 4.2 Node Review Queue（审核台）

**功能**

- 初审 / 面谈 / 风控 / Founder 审批

**动作**

- approve, reject, request_more_info, escalate_to_founder, escalate_to_risk

### 4.3 Node Dashboard（节点工作台）

节点登录后的核心页面，展示：

- Node Profile
- Pipeline
- Tasks
- Deals
- PoB
- KPI
- Risk status

### 4.4 Territory Console（边界管理）

**功能**

- 区域划分
- protected accounts
- 节点冲突处理
- 排他规则

**关键规则**

- Territory ≠ 自动独占
- 必须绑定 KPI 才能独占
- 跨区域必须走系统协同

### 4.5 Scorecard（节点评分）

| 维度 | 说明 |
|------|------|
| Pipeline 质量 | 资源真实度 |
| 闭环率 | 转化能力 |
| 证据质量 | PoB 质量 |
| 协作能力 | 响应速度 |
| 风控记录 | 是否违规 |

**输出（Scorecard）**

- score_total
- status: Upgrade / Maintain / Watchlist / Downgrade / Remove

---

## 五、节点核心流程

### 5.1 准入流程

`Apply → 初审 → 面谈 → 风控 → Founder 批准 → 合同 → 上线`

### 5.2 Onboarding（14 天）

| 阶段 | 内容 |
|------|------|
| Day 1–3 | 建档 + 权限 |
| Day 4–7 | 提交 pipeline |
| Day 8–10 | 参与协同 |
| Day 11–14 | 首个业务推进 |

### 5.3 日常运行

- **周：** 更新任务 / pipeline  
- **月：** 提交报告 / PoB  
- **季：** 评分 + 升降级  

### 5.4 升级机制

**条件：** 多周期有效 PoB、高质量闭环、协作稳定  

**动作：** Upgrade / Maintain / Watchlist / Downgrade / Remove  

---

## 六、节点状态机

### 6.1 节点状态（运营）

`Probation → Live → Watchlist → Suspended → Offboarded`

（准入前阶段另见 4.1 / 架构图：Draft → … → Contracting → Onboarding → Probation → Live 等。）

### 6.2 席位动作

Upgrade / Maintain / Watch / Downgrade / Remove  

---

## 七、权限设计

### 7.1 角色

| 角色 | 权限 |
|------|------|
| Founder | 全局控制 |
| Node Ops | 审核 |
| Node Owner | 管理节点 |
| Reviewer | 审核证据 |
| Risk Desk | 风控 |
| Finance | 结算 |
| Observer | 只读 |

### 7.2 权限规则

- 禁止自审
- 禁止越权导出
- 禁止修改结算
- 高风险需双签

---

## 八、与其他系统关系

节点系统必须连接：

- Portal（入口）
- Identity（身份）
- Deal Room（业务）
- Task（执行）
- Proof Desk（验证）
- Settlement（结算）
- Governance（风控）

节点是整个系统的**责任锚点**。

---

## 九、数据对象关系

```text
Node
 ├── NodeApplication
 ├── Territory
 ├── Membership
 ├── Pipeline
 ├── Task
 ├── Deal
 ├── Evidence
 ├── PoB
 ├── Settlement
 └── Scorecard
```

---

## 十、P0 / P1 / P2 开发范围

| 阶段 | 范围 |
|------|------|
| **P0** | Node Apply；Node Review；Dashboard；Scorecard；Territory 基础；与 Deal/Task/Proof 打通 |
| **P1** | 跨节点协同；Territory 冲突处理；节点委员会；分润结构 |
| **P2** | 链上节点身份；节点质押；节点治理 |

---

## 十一、验收标准

系统必须做到：

1. 节点 14 天内可上线  
2. 每个节点有清晰责任  
3. 节点进入 Deal → Task → Proof 闭环  
4. 有评分与淘汰机制  
5. 所有行为可审计  

---

## 十二、核心原则

1. **节点不是「谁都可以进」** — 只允许能带来资源的人  
2. **节点必须有责任** — 带资源、推闭环、提证据  
3. **节点必须被淘汰** — 没有贡献必须清退  
4. **节点必须进入结算系统** — 否则就是社群  

---

## 十三、一句话总结

**节点系统 = 资源入口 + 责任绑定 + 闭环执行 + 证据归因 + 价值分配**

---

## 附录 A — WCN 节点系统总架构图

```mermaid
flowchart TD
    A["外部入口 Portal Layer\n官网 / Apply Hub / Demo / Lead Capture"] --> B["身份与账户 Identity Layer\nUser / Invite / Session / Security"]
    B --> C["角色与权限 Permission Layer\nRole / Scope / Membership / Audit"]

    C --> D["节点系统 Node Network System"]

    D --> D1["Node Apply\n节点申请"]
    D --> D2["Node Review Queue\n审核 / 补件 / 面谈 / 风控"]
    D --> D3["Node Dashboard\n节点工作台"]
    D --> D4["Territory Console\n区域 / 赛道边界"]
    D --> D5["Node Scorecard\n评分 / 升降级 / 清退"]
    D --> D6["Node Membership\n节点成员与责任关系"]

    D3 --> E["项目与 Deal 系统\nProject Intake / Capital Intake / Deal Room"]
    E --> F["任务协同系统\nTask Dispatch / Human Work / Agent Workbench"]
    F --> G["Proof Desk / PoB 系统\nEvidence / Review / Attribution / Dispute"]
    G --> H["Settlement 系统\nSettlement Run / Allocation / Freeze / Export"]

    H --> I["Data Cockpit\n节点健康度 / KPI / 闭环质量 / 区域表现"]
    G --> J["Governance & Risk\nRisk Console / Override / Policy / Committee"]
    H --> J
    D --> J

    F --> K["Agent Registry\nAgent Owner / Permission / Logs / Freeze"]
    K --> G

    subgraph NodeTypes["节点分类"]
        N1["Genesis / Core Node"]
        N2["Regional Node"]
        N3["City Node"]
        N4["Vertical Node"]
        N5["Functional Node"]
        N6["Agent Operator"]
    end

    D --- NodeTypes
```

---

## 附录 B — 节点系统内部架构图

```mermaid
flowchart TD
    A["Node Apply\n申请表单"] --> B["Node Application Record"]
    B --> C["Node Review Queue"]

    C --> C1["资格初审"]
    C --> C2["补件"]
    C --> C3["面谈评估"]
    C --> C4["Risk Review"]
    C --> C5["Founder Approval"]

    C5 --> D["Contracting\n签约 / 席位费 / 保证金"]
    D --> E["Node Onboarding\n14 天上线流程"]
    E --> F["Node Live"]

    F --> G["Node Dashboard"]
    G --> G1["Profile"]
    G --> G2["Pipeline"]
    G --> G3["Tasks"]
    G --> G4["Deals"]
    G --> G5["Evidence / PoB"]
    G --> G6["Reports"]
    G --> G7["KPI"]

    F --> H["Territory Console"]
    H --> H1["Territory Claim"]
    H --> H2["Protected Accounts"]
    H --> H3["Boundary Rules"]
    H --> H4["Conflict Resolution"]

    F --> I["Node Scorecard Engine"]
    I --> I1["Pipeline Quality"]
    I --> I2["Closure Rate"]
    I --> I3["Evidence Quality"]
    I --> I4["Collaboration Reliability"]
    I --> I5["Risk Record"]

    I --> J["Seat Action"]
    J --> J1["Upgrade"]
    J --> J2["Maintain"]
    J --> J3["Watchlist"]
    J --> J4["Downgrade"]
    J --> J5["Remove"]

    J --> K["Governance / Risk"]
```

---

## 附录 C — 节点生命周期（状态图）

```mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> Submitted
    Submitted --> NeedMoreInfo
    NeedMoreInfo --> Submitted
    Submitted --> UnderReview
    UnderReview --> Rejected
    UnderReview --> Approved
    Approved --> Contracting
    Contracting --> Onboarding
    Onboarding --> Probation
    Probation --> Live
    Live --> Watchlist
    Watchlist --> Live
    Watchlist --> Suspended
    Suspended --> Live
    Suspended --> Offboarded
    Live --> Offboarded
```

---

## 附录 D — 节点与主业务闭环

```mermaid
flowchart LR
    A["节点 Node"] --> B["带入资源\n项目 / 资本 / 服务 / 本地关系"]
    B --> C["Deal Room\n形成商业机会"]
    C --> D["Task Dispatch\n人类节点 / Agent 执行"]
    D --> E["Evidence Packet\n提交证据"]
    E --> F["Proof Desk\n审核 / 归因 / 风控"]
    F --> G["PoB Event"]
    G --> H["Settlement Run"]
    H --> I["节点成绩单 / 权益 / Watchlist"]
```

---

## 附录 E — 工程分层（研发口径）

```mermaid
flowchart TD
    subgraph Frontend["前端层 Frontend"]
        F1["Portal / Apply Pages"]
        F2["Node Console"]
        F3["Deal Room UI"]
        F4["Task UI"]
        F5["Proof Desk UI"]
        F6["Settlement UI"]
        F7["Admin / Risk UI"]
    end

    subgraph Backend["业务服务层 Backend Services"]
        B1["Auth Service"]
        B2["User / Role Service"]
        B3["Node Service"]
        B4["Territory Service"]
        B5["Deal Service"]
        B6["Task Service"]
        B7["Proof Service"]
        B8["Settlement Service"]
        B9["Risk / Governance Service"]
        B10["Agent Service"]
        B11["Notification Service"]
        B12["Audit Log Service"]
    end

    subgraph Data["数据层 Data Layer"]
        D1["(Postgres)"]
        D2["Object Storage\nS3 / R2"]
        D3["Search Index"]
        D4["Analytics / BI"]
    end

    subgraph Integration["集成层 Integrations"]
        I1["Email"]
        I2["Telegram / Slack / Webhook"]
        I3["CRM / Form"]
        I4["Future Wallet / Onchain"]
    end

    Frontend --> Backend
    Backend --> Data
    Backend --> Integration
```

---

## 附录 F — 核心数据关系（类图）

```mermaid
classDiagram
    class Node {
      node_id
      node_type
      territory
      vertical
      owner_user_id
      seat_level
      status
      risk_level
      score
    }

    class NodeApplication {
      application_id
      node_type
      territory
      resource_description
      references
      compliance_docs
      review_status
    }

    class TerritoryClaim {
      claim_id
      region
      scope
      exclusivity
      protected_accounts
      status
    }

    class NodeMembership {
      membership_id
      node_id
      user_id
      role
      status
    }

    class NodeScorecard {
      scorecard_id
      node_id
      pipeline_score
      closure_score
      evidence_score
      collaboration_score
      risk_score
      action
    }

    class Deal {
      deal_id
      project_id
      owner_node_id
      stage
      status
    }

    class Task {
      task_id
      node_id
      deal_id
      assignee
      status
    }

    class EvidencePacket {
      evidence_id
      node_id
      deal_id
      completeness
      review_status
    }

    class PoBEvent {
      pob_event_id
      node_id
      effective_pob
      status
    }

    class SettlementRun {
      settlement_run_id
      period
      status
    }

    NodeApplication --> Node : approved_to_create
    Node --> TerritoryClaim
    Node --> NodeMembership
    Node --> NodeScorecard
    Node --> Deal
    Node --> Task
    Node --> EvidencePacket
    Node --> PoBEvent
    PoBEvent --> SettlementRun
```

---

## 附录 G — 权限架构图

```mermaid
flowchart TD
    A["Founder / Admin"] --> P1["全局配置"]
    A --> P2["高等级审批"]
    A --> P3["冻结 / 清退"]
    A --> P4["Override"]

    B["Node Ops / Regional Lead"] --> P5["初审"]
    B --> P6["补件"]
    B --> P7["Onboarding"]
    B --> P8["月度复盘"]

    C["Node Owner"] --> P9["维护节点资料"]
    C --> P10["提交 Pipeline"]
    C --> P11["创建任务"]
    C --> P12["上传证据"]

    D["Reviewer / Risk Desk"] --> P13["审核"]
    D --> P14["风险标记"]
    D --> P15["冻结建议"]

    E["Finance Admin"] --> P16["查看结算"]
    E --> P17["锁定周期"]

    F["Observer"] --> P18["只读"]
```

---

## 附录 H — 研发实施顺序（建议 Waves）

| Wave | 内容 |
|------|------|
| **Wave 1** | Node Apply；Node Review；Role / Permission；Basic Dashboard |
| **Wave 2** | Territory Console；Membership；Scorecard；Pipeline |
| **Wave 3** | 打通 Deal / Task / Proof |
| **Wave 4** | 打通 Settlement / Governance / Risk |

---

## 附录 I — 分层交付口径（可直接拆 Epic）

1. **展示层：** Node Apply；Node Review Queue；Node Dashboard；Territory Console；Scorecard & Review  
2. **业务层：** Node Service；Territory Service；Membership Service；Score Engine；Lifecycle Engine  
3. **审计与治理层：** Risk Engine；Approval Engine；Audit Log；Override Log  
4. **结算联动层：** Deal Linker；Task Linker；Proof Linker；Settlement Linker  

---

## 最重要的一句话

节点系统不是「招募页面」，而是 **WCN 的组织操作系统**：把外部资源拥有者，变成系统里有边界、有任务、有证据、有评分、有结算、有清退机制的**责任主体**。
