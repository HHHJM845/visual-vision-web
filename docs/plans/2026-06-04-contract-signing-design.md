# 合同签署流程设计文档

**日期：** 2026-06-04
**项目：** visual-vision-web
**目标：** 在现有“选定创作者、托管付款、里程碑交付”流程之间补齐可演示的合同签署机制，让项目合作闭环从撮合进入正式履约。

---

## 背景

当前项目已经具备需求发布、AIGCer 应征、甲方选定创作者、托管付款、里程碑交付审核与节点释放款项。缺口是“双方确认合作条款”的合同流程。

本次实现不接真实 CA 或第三方电子签平台，而是做一个可演示的模拟签署 MVP：合同数据可持久化，双方各自确认签署，签署时间与合同状态可追踪。

---

## 范围

### 包含

- 甲方选定 AIGCer 后生成合同草稿。
- 合同草稿记录项目、甲方、乙方、预算、交付格式、里程碑、托管付款说明。
- 甲方与乙方分别签署。
- 支持任意一方先签。
- 双方都签署后合同状态变为 `active`。
- 项目详情页展示合同状态、签署人、签署时间、合同条款摘要。
- Supabase 优先，localStorage fallback。
- Supabase schema 与 RLS。
- service 层测试覆盖状态流转和 fallback。

### 不包含

- 真实 CA 数字证书。
- 手写签名图片。
- PDF 合同导出。
- 第三方电子签平台。
- 法律文本自动生成与法律审查。

---

## 核心概念

### ProjectContract

项目合同。

字段：

- `id`：合同 ID。
- `commissionId`：关联委托项目。
- `commissionTitle`：项目标题快照。
- `clientId`、`clientName`：甲方。
- `aigcerId`、`aigcerName`：乙方。
- `budgetText`：预算文本快照。
- `deliveryFormat`：交付格式。
- `milestoneSummary`：里程碑摘要。
- `escrowSummary`：托管付款摘要。
- `terms`：合同条款数组。
- `status`：`draft`、`client_signed`、`aigcer_signed`、`active`。
- `clientSignedAt`、`aigcerSignedAt`。
- `createdAt`、`updatedAt`。

### ContractSignerRole

签署方角色：

- `client`
- `aigcer`

---

## 状态流转

```text
draft
  ├─ client signs → client_signed
  │                  └─ aigcer signs → active
  └─ aigcer signs → aigcer_signed
                     └─ client signs → active
```

重复签署同一方不会创建重复状态，只返回当前合同。

---

## 交互流程

### 1. 生成合同草稿

项目详情页检测到 `acceptedApplicant` 后展示“合作合同”模块。

如果没有合同：

- 甲方可点击“生成合同草稿”。
- 系统用当前项目数据、已选 AIGCer、项目里程碑和托管付款描述生成合同。
- 乙方可看到“等待甲方生成合同”。

### 2. 双方签署

合同生成后：

- 甲方看到“甲方确认签署”。
- 乙方看到“乙方确认签署”。
- 管理员只读。
- 签署按钮点击后记录当前用户、角色和时间。

### 3. 合同生效

当 `clientSignedAt` 和 `aigcerSignedAt` 都存在：

- 合同状态变为 `active`。
- 页面展示“合同已生效”。
- 后续托管付款和交付节点可以继续正常推进。

---

## 页面改动

### CommissionDetail

在“已选定创作者”提示之后、托管付款之前新增“合作合同”模块。

状态一：无合同

- 甲方：显示生成合同草稿按钮。
- 乙方：显示等待甲方生成合同。

状态二：草稿或单方已签

- 展示合同摘要。
- 展示甲方签署状态。
- 展示乙方签署状态。
- 当前登录方如未签署，展示确认签署按钮。

状态三：已生效

- 显示合同已生效。
- 展示双方签署时间。
- 合同条款只读。

---

## 数据层

### 新增文件

- `src/types/contract.ts`
- `src/services/contractService.ts`
- `src/test/services/contractService.test.ts`

### 修改文件

- `src/pages/CommissionDetail.tsx`
- `supabase/p0-production-schema.sql`

### Supabase 表

- `project_contracts`

RLS 原则：

- 项目甲方、被接受创作者、管理员可读取合同。
- 只有项目甲方可创建合同草稿。
- 项目甲方可签署甲方字段。
- 被接受创作者可签署乙方字段。
- 管理员只读。

---

## 错误处理

- Supabase 请求失败时 fallback 到 localStorage。
- 未选定 AIGCer 时不能生成合同。
- 非项目甲方不能生成合同。
- 非合同双方不能签署。
- 合同不存在时签署会抛出明确错误。
- 重复签署返回当前合同，不重复更新时间。

---

## 测试策略

使用 Vitest 先覆盖 service 层：

- 创建合同草稿。
- 同一项目不会重复创建合同。
- 甲方先签后状态为 `client_signed`。
- 乙方先签后状态为 `aigcer_signed`。
- 双方都签后状态为 `active`。
- 重复签署不会改变已签时间。
- Supabase 不可用时 fallback 到 localStorage。

页面层通过 build 与手动可视检查验证：

- 已选定创作者后能看到合同模块。
- 甲方能生成合同并签署。
- 切换乙方登录态后能签署。
- 双方签署后显示合同已生效。

---

## 简历表述边界

实现后可以表述为：

“设计并实现模拟合同签署流程，支持项目选定创作者后自动生成合同草稿、甲乙双方在线确认签署、合同状态流转与签署时间追踪，并与托管付款和里程碑交付流程衔接。”

不应表述为：

- 已接入真实 CA 电子签。
- 合同具备法律认证效力。
- 已支持 PDF 合同导出。
