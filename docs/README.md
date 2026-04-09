# 项目文档（`docs/`）

## 结构

| 目录 / 文件 | 说明 |
|-------------|------|
| [`delivery/system-implementation-plan.md`](./delivery/system-implementation-plan.md) | 系统级实施规划：现状诊断、ADR、Sprint 任务、迁移、风险与验收 |
| [`product-spec/overview.md`](./product-spec/overview.md) | PRD 派生 **Implementation Spec** 入口与图例 |
| [`product-spec/pages.md`](./product-spec/pages.md) | 页面与全局组件清单 |
| [`product-spec/api.md`](./product-spec/api.md) | API 端点清单 |
| [`product-spec/schema.md`](./product-spec/schema.md) | Prisma 枚举/模型增量与汇总 |

## 阅读建议

- **做功能 / 对 PRD**：从 `product-spec/overview.md` 进入，按页面 → API → schema 查表。
- **排期与架构**：看 `delivery/system-implementation-plan.md`。

> 站内 Wiki（`/docs/*` 路由）由 `lib/wcn-docs` 维护，与本目录独立。
