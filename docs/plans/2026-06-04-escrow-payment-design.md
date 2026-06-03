# 托管付款与节点释放设计文档

**日期：** 2026-06-04
**项目：** visual-vision-web
**目标：** 在现有项目里程碑交付流程上补齐可演示的托管付款机制，支持自定义节点比例、模拟资金托管、验收后按节点释放款项。

---

## 背景

当前项目已经具备双角色、项目发布、创作者应征、甲方选定创作者、里程碑交付、甲方确认或要求修改、纠纷提交等流程，但“托管付款”只停留在页面文案，没有真实数据模型和状态流转。

本次实现采用 service 层加 Supabase schema 的方式，并保留 localStorage fallback，保证本地没有配置 Supabase 时也能完整演示。

---

## 范围

### 包含

- 创建项目托管计划。
- 基于现有 `projectStages` 生成付款节点。
- 支持甲方在托管前调整每个节点付款比例。
- 校验所有节点比例总和必须为 100%。
- 模拟确认托管，状态从 `draft` 变为 `funded`。
- 甲方确认交付节点后，自动释放该节点金额。
- 记录每次释放流水。
- 展示托管总额、已释放、待释放、节点状态和释放记录。
- Supabase 表结构与 RLS 基础策略。
- localStorage fallback，延续现有服务层模式。

### 不包含

- 真实支付网关。
- 银行卡、支付宝、微信、Stripe 等真实资金扣款。
- 真实电子合同。
- 发票、税务、分账结算。
- 平台手续费真实扣除。

---

## 核心概念

### EscrowPlan

项目级托管计划。

字段：

- `id`：托管计划 ID。
- `commissionId`：关联委托项目。
- `totalAmount`：托管总金额。
- `currency`：币种，默认 `CNY`。
- `status`：`draft`、`funded`、`completed`。
- `releasedAmount`：已释放金额。
- `createdById`：创建者，通常为甲方。
- `fundedAt`：模拟托管确认时间。
- `completedAt`：全部节点释放完成时间。
- `createdAt`、`updatedAt`。

### EscrowMilestone

节点级付款配置。

字段：

- `id`：节点 ID。
- `planId`：关联托管计划。
- `commissionId`：关联委托项目。
- `stageId`：关联现有项目节点。
- `stageLabel`：节点名称快照。
- `percent`：付款比例。
- `amount`：节点金额。
- `status`：`pending`、`released`。
- `releasedAt`。

### EscrowRelease

释放流水。

字段：

- `id`：流水 ID。
- `planId`：关联托管计划。
- `commissionId`：关联委托项目。
- `milestoneId`：关联付款节点。
- `stageId`、`stageLabel`。
- `amount`：释放金额。
- `releasedById`：操作者，通常为甲方。
- `releasedToId`：收款方，通常为被选定创作者。
- `createdAt`。

---

## 交互流程

### 1. 项目进入合作

甲方在委托详情页接受某个 AIGCer 后，页面显示“托管付款”模块。

如果还没有托管计划，系统用项目报价区间推导一个默认总额：

- 优先取报价区间中的最高金额。
- 解析失败时使用 `0`，页面要求甲方手动输入。

系统根据 `projectStages` 生成默认付款比例。为避免 11 个节点过细导致体验重，默认比例按所有节点分配且总和为 100%，最后一个节点吸收四舍五入差值。

### 2. 甲方配置比例

甲方可以修改每个节点比例。页面实时展示：

- 当前总比例。
- 每个节点金额。
- 总金额。

确认托管前必须满足：

- 总金额大于 0。
- 比例合计等于 100%。
- 每个节点比例不小于 0。

### 3. 模拟托管

甲方点击“确认托管”后：

- `EscrowPlan.status` 变为 `funded`。
- 写入 `fundedAt`。
- 所有节点进入待释放状态。

按钮文案使用“确认托管（模拟）”，避免误导为真实支付。

### 4. 节点释放

当甲方在现有交付模块点击确认当前节点时：

1. 现有 `confirmProjectStageDelivery` 先完成交付确认和项目进度推进。
2. 托管服务查找当前节点对应 milestone。
3. 如果计划为 `funded` 且该 milestone 未释放，则释放节点金额。
4. 写入 `EscrowRelease`。
5. 更新 milestone 状态为 `released`。
6. 更新 plan 的 `releasedAmount`。
7. 如果全部 milestone 已释放，plan 状态变为 `completed`。

重复确认同一节点不会重复释放。

---

## 页面改动

### CommissionDetail

在已选定创作者后、合作节点管理附近新增“托管付款”模块。

状态一：未创建计划

- 显示创建入口。
- 允许输入托管总额。
- 自动生成节点比例。

状态二：草稿计划

- 显示节点比例编辑列表。
- 显示比例合计与金额预览。
- 提供“确认托管（模拟）”按钮。
- 比例不合法时禁用确认。

状态三：已托管

- 显示资金总览：托管总额、已释放、待释放、进度。
- 显示每个节点：比例、金额、待释放/已释放。
- 显示释放流水。
- 交付确认时自动释放当前节点。

---

## 数据层

### 新增文件

- `src/types/escrow.ts`
- `src/services/escrowService.ts`
- `src/test/services/escrowService.test.ts`

### 修改文件

- `src/pages/CommissionDetail.tsx`
- `supabase/p0-production-schema.sql`

### Supabase 表

- `escrow_plans`
- `escrow_milestones`
- `escrow_releases`

RLS 原则：

- 项目甲方、被接受创作者、管理员可读取托管数据。
- 只有项目甲方和管理员可创建、确认托管、释放节点。
- 创作者只能读取与自己接受项目相关的托管记录。

---

## 错误处理

- Supabase 请求失败时 fallback 到 localStorage。
- 比例不等于 100% 时返回明确错误。
- 未托管计划不能释放节点。
- 同一节点重复释放时返回当前状态，不创建重复流水。
- 找不到匹配节点时不影响交付确认，但页面显示托管释放未执行。

---

## 测试策略

使用 Vitest 先覆盖 service 层：

- 默认节点比例合计为 100%。
- 创建托管草稿时生成所有项目节点。
- 比例合计不为 100% 时拒绝确认托管。
- 确认托管后状态变为 `funded`。
- 释放节点后生成流水并更新已释放金额。
- 同一节点重复释放不会生成重复流水。
- 全部节点释放后计划变为 `completed`。

页面层以现有组件逻辑为主，重点通过 service 测试保证资金状态正确。

---

## 简历表述边界

实现后可以表述为：

“设计并实现模拟托管付款机制，支持按项目里程碑配置付款比例、托管状态流转、节点验收后自动释放款项，并记录资金释放流水。”

不应表述为：

- 已接入真实支付。
- 平台真实托管资金。
- 已完成电子合同签署。
