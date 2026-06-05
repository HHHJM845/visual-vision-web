# 下一台电脑继续开发交接

更新日期：2026-06-05

这份文档用于把当前未完成事项写进仓库。把当前代码提交并推到 GitHub 后，下一台电脑 clone/pull 下来即可从这里继续。

## 当前已完成的主链路

围绕“2 周内独立交付双角色完整产品”的目标，当前已经补齐了一条可演示的项目交易闭环：

- 甲方发布项目后跳转到创作者推荐页 `/creators`。
- 创作者广场支持基于需求的推荐排序、能力标签、匹配理由和匹配作品展示。
- 甲方可从推荐卡片一键邀约创作者。
- 创作者可回应或谢绝邀约。
- 甲方选定创作者后自动生成合同草稿。
- 合同支持甲乙双方模拟签署，双方签署后进入生效状态。
- 合同生效后可自动生成模拟托管草稿。
- 托管支持自定义总额、里程碑付款比例、确认托管和按节点释放。
- 合作项目支持按里程碑提交交付物、甲方确认、要求修改。
- 交付记录支持版本级预览和批注。
- 项目详情里支持甲乙双方项目沟通和附件消息。
- 消息中心已按项目聚合私信、交付批注、托管和纠纷裁决提醒，点击项目会话可进入项目详情。
- 可发起项目纠纷，后台能看到审核/处理入口。
- 发起纠纷会绑定当前交付版本；旧数据没有版本字段时仍按节点关联。
- 发起纠纷时，如果当前项目已完成托管，会自动冻结当前节点款项，避免继续确认时误释放。
- 后台纠纷详情支持裁决操作：恢复托管、驳回并恢复、全额退款、部分释放并退余款、要求补交付。
- 后台选择“要求补交付”时，会优先把被投诉的具体交付版本标记为需修改，并把项目进度退回乙方待提交。
- 纠纷裁决结果会通知甲乙双方。
- 项目详情会在交付记录、交付预览和纠纷记录里展示关联纠纷、裁决方式、裁决说明、处理人和处理时间。
- 已接入 Playwright E2E，覆盖未登录权限、甲方发布项目、创作者推荐邀约、项目工作台和消息中心项目会话。

## 本次新增/改动过的重点文件

- `src/pages/Creators.tsx`
  - 创作者推荐广场。
  - 支持需求匹配、作品证据、邀约入口。

- `src/services/creatorRecommendationService.ts`
  - 创作者推荐排序、标签匹配、作品证据匹配。

- `src/services/projectMessageService.ts`
  - 项目消息 Supabase-first/localStorage fallback。
  - 支持文本和附件消息。

- `src/services/projectConversationService.ts`
  - 按当前用户聚合项目消息和项目通知。
  - 支持按项目生成会话、未读通知数、最近动态和会话入口。

- `src/pages/Messages.tsx`
  - 消息中心新增项目会话区域。
  - 点击项目会话会标记对应未读项目通知并进入项目详情。

- `src/pages/CommissionDetail.tsx`
  - 项目详情主工作台。
  - 包含邀约回应、合同、托管、交付、批注、项目沟通、纠纷入口和裁决结果展示。
  - 交付卡片和交付预览会显示关联纠纷与裁决结论。

- `src/services/commissionService.ts`
  - 项目、应征、邀约、交付、批注、纠纷相关服务。
  - 纠纷支持绑定 `deliveryId`、`deliveryVersion`、`deliveryTitle`。
  - 本地交付/纠纷 ID 已加随机后缀，避免快速连续创建时撞 ID。

- `src/services/escrowService.ts`
  - 模拟托管付款、里程碑比例、释放记录。
  - 支持纠纷场景冻结/恢复节点款项。
  - 支持后台裁决后的全额退款、部分释放和退款流水。

- `src/services/adminService.ts`
  - 支持纠纷裁决服务 `resolveDisputeReview`。
  - 裁决会同步纠纷状态、托管状态、交付状态、后台审核日志和双方通知。
  - “要求补交付”会优先处理纠纷绑定的具体交付版本。

- `src/pages/admin/AdminReviewDetail.tsx`
  - 纠纷审核项显示专用裁决面板。
  - 支持选择裁决方式、填写说明和部分释放金额。

- `supabase/p0-production-schema.sql`
  - 已补 `project_messages`、`project_delivery_comments` 表、索引和 RLS。
  - 已补项目消息附件 bucket。
  - 已扩展托管状态：`frozen`、`cancelled`，节点状态：`frozen`、`refunded`、`partially_released`。
  - 已扩展 `escrow_releases.release_type` 和 `note`，用于区分正常释放、部分释放和退款。
  - 已扩展 `project_disputes` 裁决字段：`resolution_action`、`resolution_note`、`resolved_by_id`、`resolved_by_name`、`resolved_at`。
  - 已扩展 `project_disputes` 交付版本关联字段：`delivery_id`、`delivery_version`、`delivery_title`。

- `src/types/commission.ts`
  - 新增交付批注等项目交易相关类型。

- `playwright.config.ts`
  - 使用标准 Playwright 配置。
  - 自动启动本地 Vite dev server，默认测试 Chromium。

- `e2e/`
  - 首批 Demo MVP smoke 测试。
  - 测试通过 localStorage 注入 demo 用户和项目数据，避免依赖真实 Supabase 状态。

- `docs/e2e-testing.md`
  - E2E 运行方式、测试数据策略和后续扩展建议。

## 已通过的验证

在当前机器上已经通过：

```bash
PATH=/Users/zzymima0000/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH /Users/zzymima0000/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node ./node_modules/vitest/vitest.mjs run
```

结果：15 个测试文件通过，64 个测试通过，16 个跳过。

```bash
PATH=/Users/zzymima0000/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH /Users/zzymima0000/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node ./node_modules/typescript/bin/tsc --noEmit -p tsconfig.app.json
```

结果：通过。

```bash
PATH=/Users/zzymima0000/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH /Users/zzymima0000/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node ./node_modules/vite/bin/vite.js build
```

结果：通过。仅有 Browserslist 数据过期和 chunk 偏大的常见警告。

```bash
PATH=/Users/zzymima0000/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH /Users/zzymima0000/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node ./node_modules/@playwright/test/cli.js test
```

结果：4 个 E2E 测试通过。

## 当前还没完成的功能

### P0：真实 Supabase 环境回归

当前本地测试和构建已通过，但还需要在真实 Supabase 项目里执行并验证：

- `project_messages` 可由项目发布方和待沟通/已合作创作者读写。
- `project_delivery_comments` 仅合作双方可读写。
- 消息附件 bucket 能上传并读取。
- 发起纠纷后 `escrow_plans.status = frozen`、对应 `escrow_milestones.status = frozen`。
- 后台裁决后：
  - 恢复托管能把节点从 `frozen` 改回 `pending`。
  - 全额退款能生成 `release_type = refund` 流水。
  - 部分释放能生成 `partial_release` 和 `refund` 两条流水。
  - RLS 不允许项目外用户读取消息、批注、托管记录。

### P0：真实支付/托管未接入

现在是模拟托管，适合 Demo，但不是生产支付。

未做：

- 真实充值/扣款。
- 微信/支付宝/Stripe/银行托管接入。
- 平台手续费。
- 退款。
- 创作者提现。
- 付款失败、超时、风控、对账。
- 发票/收据。

下一步现实做法：

先不要直接接真实支付。建议先把托管状态机做扎实：

- `draft`
- `funding_pending`
- `funded`
- `frozen`
- `partially_released`
- `refunding`
- `completed`
- `cancelled`

然后再接真实支付网关。

### P1：合同签署仍是模拟

当前合同可生成、可由甲乙双方确认签署，但不是真实电子签。

未做：

- 电子签章。
- 合同 PDF 导出。
- 合同编号。
- 签署 IP、时间戳、证据链。
- 条款版本管理。
- 第三方电子签平台。

建议下一步：

- 先做 PDF 合同导出和合同编号。
- 再接电子签。

### P1：AI 匹配仍是演示级

当前已能：

- 基于作品文字、简介、风格、工具生成能力标签。
- 根据项目需求匹配创作者。
- 展示匹配理由和匹配作品。

未做：

- 图片/视频内容理解。
- 向量检索。
- 推荐结果持久化。
- 甲方反馈学习。
- 推荐质量评估。
- 更严格的能力标签置信度。

建议下一步：

- 先持久化每次推荐结果。
- 增加“甲方标记匹配/不匹配”反馈。
- 再引入向量检索或多模态模型。

### P1：消息系统还不是完整实时聊天

当前项目详情里有项目沟通，消息中心也已经按项目聚合会话，但还没有做到生产级实时聊天。

已做：

- 项目会话列表。
- 按项目聚合私信和项目通知。
- 项目会话未读通知数。
- 点击会话进入项目详情。

未做：

- 实时消息。
- 已读/未读多端同步。
- 消息搜索。
- 附件长期存储在真实 Supabase 环境中的回归验证。

建议下一步：

- 先在真实 Supabase 环境回归 `project_messages` 表和附件 bucket。
- 然后补 Supabase Realtime、消息搜索和多端已读状态。

### P1：后台审核仍偏演示

已有审核中心、审核详情、用户列表、审核日志。

未做：

- 真实审核队列分配。
- 管理员权限细分。
- 内容违规规则。
- 用户申诉。
- 审核 SLA。
- 操作风险二次确认。

### P2：上线前工程质量

还需要补：

- 继续扩展 Playwright E2E 到合同签署、托管、交付、纠纷和后台裁决全链路。
- 移动端关键路径测试。
- Supabase 真实环境跑通。
- RLS 权限回归测试。
- 错误监控。
- 部署环境变量文档。
- chunk 拆分优化。

## 建议下一台电脑优先顺序

1. 在真实 Supabase 项目里执行 `supabase/p0-production-schema.sql` 并验证 RLS。
2. 做合同 PDF 导出。
3. 扩展 E2E 到合同签署、托管和纠纷裁决全链路。
4. 补 Supabase Realtime 消息和多端已读状态。
5. 规划真实支付/托管接入前的状态机和对账需求。

## 下次继续时的推荐检查命令

```bash
git status --short
```

```bash
npm test
```

```bash
npm run build
```

```bash
npm run test:e2e
```

如果下一台电脑没有可用 npm，但 `node_modules` 已存在，也可以直接用：

```bash
node ./node_modules/vitest/vitest.mjs run
```

```bash
node ./node_modules/typescript/bin/tsc --noEmit -p tsconfig.app.json
```

```bash
node ./node_modules/vite/bin/vite.js build
```

```bash
node ./node_modules/@playwright/test/cli.js test
```

## 注意

当前工作区里有不少未提交改动和新增文件。推到 GitHub 前，需要确认这些文件都被提交进去，否则下一台电脑无法读到本交接文档和本轮代码。
