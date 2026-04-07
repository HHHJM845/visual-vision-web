# 用户系统与认证流程设计文档

**日期：** 2026-04-07
**项目：** AI影制承制平台（visual-vision-web-main）
**阶段：** Phase 1 — 前端 Mock 实现

---

## 1. 背景与目标

当前平台为纯前端展示原型，已有项目列表、项目详情、橱窗、画廊、活动等页面，均使用 mock 数据。导航栏有"登录/注册"按钮但无实际功能。

本次设计目标：为甲方和 AIGCer 两种角色建立完整的用户系统，包括注册、身份认证、专属工作台，以及对应的发布/应征项目能力。Phase 1 使用前端 mock 实现（localStorage 持久化），后端接入作为 Phase 2。

---

## 2. 技术架构

### 2.1 方案选择

采用 **Mock Service 层 + React Query** 方案：

- `src/services/` 目录封装所有数据操作，返回 `Promise`
- 组件通过 React Query (`useQuery` / `useMutation`) 调用 service
- 登录态由 `AuthContext` 管理，持久化到 `localStorage`
- Phase 2 只需替换 service 层实现，组件代码不动

### 2.2 新增文件结构

```
src/
├── services/
│   ├── authService.ts       # 登录、注册、登出
│   ├── userService.ts       # 用户信息、认证状态更新
│   └── commissionService.ts # 项目 CRUD、应征操作
├── contexts/
│   └── AuthContext.tsx      # 当前用户、角色、认证状态
├── types/
│   ├── user.ts              # User、VerificationStatus 类型
│   └── commission.ts        # Commission、Application 类型
└── pages/
    ├── Login.tsx
    ├── Register.tsx
    ├── OnboardingAigcer.tsx
    ├── OnboardingClient.tsx
    ├── DashboardClient.tsx
    └── DashboardAigcer.tsx
```

### 2.3 新增路由

| 路径 | 页面 | 访问限制 |
|------|------|----------|
| `/login` | 登录 | 仅未登录 |
| `/register` | 注册 | 仅未登录 |
| `/onboarding/aigcer` | AIGCer 认证引导 | 已登录 AIGCer，未认证 |
| `/onboarding/client` | 甲方认证引导 | 已登录甲方，未认证 |
| `/dashboard/aigcer` | AIGCer 工作台 | 已登录 AIGCer |
| `/dashboard/client` | 甲方工作台 | 已登录甲方 |

---

## 3. 数据模型

### 3.1 User

```ts
type UserRole = 'aigcer' | 'client';
type VerificationStatus = 'none' | 'pending' | 'verified';
type ClientVerificationType = 'realname' | 'enterprise';

interface User {
  id: string;
  email: string;
  phone: string;
  nickname: string;
  role: UserRole;
  verificationStatus: VerificationStatus;
  clientVerificationType?: ClientVerificationType; // 仅甲方
  avatar?: string;
  createdAt: string;
}
```

### 3.2 Commission（扩展现有）

```ts
interface Commission {
  // 现有字段（保持不变）
  title: string;
  description: string;
  tag: '实名认证' | '企业认证' | '未认证';
  reputation: string;
  deadline: string;
  category: string;
  applicants: number;
  priceRange: string;
  // 新增字段
  id: number;
  authorId: string;
  authorNickname: string;
  authorVerification: 'realname' | 'enterprise' | 'none';
  purpose: '商业用途' | '个人用途';
  style?: string;
  resolution?: string;
  format?: string;
}
```

### 3.3 Application（新增）

```ts
interface Application {
  id: string;
  commissionId: number;
  aigcerId: string;
  aigcerNickname: string;
  message: string;     // 应征留言
  status: 'pending' | 'accepted' | 'rejected';
  appliedAt: string;
}
```

---

## 4. 用户角色与注册流程

### 4.1 角色规则

- 注册时在甲方 / AIGCer 中**二选一，角色不可更改**
- 每个账号只能持有一种角色

### 4.2 注册页 `/register`

字段：手机号（或邮箱）、密码、昵称、角色选择（单选卡片）。

提交后：
1. mock service 创建用户，写入 localStorage
2. 自动登录（更新 AuthContext）
3. 根据角色跳转：
   - AIGCer → `/onboarding/aigcer`
   - 甲方 → `/onboarding/client`

### 4.3 登录页 `/login`

字段：手机号/邮箱、密码。登录成功后：AIGCer 跳转 `/dashboard/aigcer`，甲方跳转 `/dashboard/client`。

---

## 5. 认证流程

### 5.1 AIGCer 认证 `/onboarding/aigcer`

分两步：

**Step 1 — 资质表单**
- 个人简介（100字以内）
- 擅长风格（多选标签：二次元、国风、欧美写实、科幻、写实渲染等）
- 常用工具（多选标签：Midjourney、Runway、Kling、Sora、ComfyUI 等）

**Step 2 — 上传作品集**
- 最少 3 件作品
- 每件作品：图片上传（mock：转 base64 存入 localStorage）+ 作品标题 + 简短说明
- 提交后状态变为 `pending`
- Mock 实现：3 秒延迟后自动变为 `verified`，跳转 `/dashboard/aigcer`

### 5.2 甲方认证 `/onboarding/client`

选择认证类型后填写对应表单：

**个人实名认证**
- 真实姓名
- 身份证号（mock：格式校验即可）
- 手机验证码（mock：任意 6 位数字通过）

**企业认证**
- 公司名称
- 统一社会信用代码（mock：格式校验）
- 法定代表人 / 联系人姓名
- 联系方式

提交后：mock 即时通过，状态变为 `verified`，跳转 `/dashboard/client`。

认证类型决定用户标签：个人实名 → `实名认证`，企业 → `企业认证`（与现有 CommissionCard 标签对应）。

---

## 6. 工作台页面

### 6.1 甲方工作台 `/dashboard/client`

**顶部区域**
- 欢迎语 + 用户昵称 + 认证标签
- "发布新项目"按钮（仅已认证甲方可见；未认证时显示引导至认证）

**统计卡片（4个）**
- 已发布 / 招募中 / 进行中 / 待验收

**项目列表**
- Tab 切换：全部 / 招募中 / 进行中 / 已完成
- 每行：项目标题、预算、截止日期、应征人数、状态标签
- 点击进入项目详情

**发布新项目 → 独立页面 `/commissions/new`**
字段：标题、描述、影片类别、风格、分辨率、格式、预算区间（最低/最高）、截止日期、用途（商业/个人）。提交后写入 localStorage 并跳回工作台。

### 6.2 AIGCer 工作台 `/dashboard/aigcer`

**顶部区域**
- 欢迎语 + 用户昵称 + 已认证标签
- "去找项目"快捷按钮

**统计卡片（4个）**
- 应征中 / 进行中 / 已完成 / 累计收入（¥）

**Tab 切换**
- 我的项目：应征/进行中的项目卡片，含进度条（项目里程碑百分比）
- 我的橱窗：已发布的服务卡片（复用 ShowcaseCard 样式）
- 作品集：认证时上传的作品

---

## 7. 现有页面联动改造

### 7.1 Navbar

- 未登录：显示"登录"/"注册"按钮（现有）
- 已登录：显示用户头像（取昵称首字）+ 认证标签 + 下拉菜单（工作台、退出登录）

### 7.2 CommissionDetail — 应征按钮

- 未登录：点击"应征项目"→ 跳转登录页
- 已登录甲方：按钮置灰，提示"甲方账号无法应征"
- 已登录 AIGCer 但未认证：提示"请先完成认证"，引导至 Onboarding
- 已认证 AIGCer：弹出应征表单（留言 + 预期报酬），提交后加入应征列表

### 7.3 Commissions 列表页

- 已认证甲方：显示"发布项目"入口（右上角）

---

## 8. Mock 实现细节

| 操作 | Mock 行为 |
|------|-----------|
| 注册 | 生成随机 UUID，存 localStorage |
| 登录 | 从 localStorage 找匹配账号，验证密码 |
| AIGCer 提交审核 | 3 秒后 `verificationStatus` 自动变 `verified` |
| 甲方提交认证 | 即时变 `verified` |
| 发布项目 | 生成新 Commission 对象，存 localStorage |
| 应征项目 | 生成 Application，存 localStorage，更新 applicants 数 |
| 上传作品 | 转 base64 存入 localStorage，组件用 `<img src={base64}>` 显示 |

---

## 9. 不在本次范围内（Phase 2）

- 真实后端 API（Node.js / Supabase 等）
- 管理员审核后台
- 支付 / 保证金托管
- 站内消息系统
- 项目进度里程碑实时更新
- 评价系统
