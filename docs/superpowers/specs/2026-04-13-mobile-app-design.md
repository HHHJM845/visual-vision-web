# Mobile App Design Spec — AI 影视承制平台

**Date:** 2026-04-13  
**Status:** Approved  
**Platform:** iOS + Android + Web (Expo Managed Workflow)

---

## 1. 概述

在现有 Web 项目（`visual-vision-web-main`）旁新建 `mobile/` 子目录，使用 **Expo Managed Workflow + expo-router** 构建一套跨平台 App，复用 Web 项目的 Supabase 服务层和业务类型定义，新建移动端 UI 层。

目标：
- `npx expo run:ios` → 生成 Xcode 项目并在模拟器/真机运行
- `npx expo run:android` → Android 运行
- `npx expo start --web` → Web 浏览器运行
- UI 风格参考参考图（蓝色主题、底部 Tab、卡片布局、空状态插画）

---

## 2. 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | React Native via Expo SDK ~51 |
| 路由 | expo-router v3（文件路由） |
| 样式 | NativeWind v4（Tailwind CSS for RN） |
| 后端 | Supabase（与 Web 端同一实例） |
| 数据请求 | @tanstack/react-query v5 |
| 认证存储 | expo-secure-store |
| 环境变量 | EXPO_PUBLIC_* 前缀 |

---

## 3. 目录结构

```
visual-vision-web-main/
  src/                           ← 现有 Web 项目（不改动）
  mobile/                        ← 新建 Expo 项目
    app/
      _layout.tsx                ← 根布局（AuthProvider + QueryClient）
      (auth)/
        _layout.tsx
        login.tsx                ← 登录页
        register.tsx             ← 注册页
      (tabs)/
        _layout.tsx              ← 底部 TabBar 配置
        index.tsx                ← 首页（双角色工作台）
        commissions.tsx          ← 项目列表
        gallery.tsx              ← 作品画廊
        messages.tsx             ← 消息中心
        profile.tsx              ← 我的
      commissions/
        [id].tsx                 ← 项目详情 + 申请
        new.tsx                  ← 发布新项目（Client）
      onboarding/
        aigcer.tsx               ← Aigcer 认证流程
        client.tsx               ← Client 认证流程
    shared/                      ← 从 Web 项目复制的共享代码
      lib/
        supabase.ts              ← Supabase 客户端（env 变量适配）
      services/
        authService.ts           ← 登录/注册/profile
        commissionService.ts     ← 委托 CRUD
      types/
        commission.ts
        user.ts
      contexts/
        AuthContext.tsx          ← 改造：useRouter 替换 useNavigate
    components/
      CommissionCard.tsx         ← 委托卡片（RN 版）
      TabBar.tsx                 ← 自定义底部导航栏
      EmptyState.tsx             ← 空状态（插画 + 文案 + 按钮）
      StatsGrid.tsx              ← 统计数字网格
      CertificationBanner.tsx    ← 认证引导 Banner
    assets/
      images/                    ← 空状态插画等
    package.json
    app.json                     ← Expo 配置（bundleId、图标等）
    tailwind.config.js
    tsconfig.json
    .env                         ← EXPO_PUBLIC_SUPABASE_*
    scripts/
      sync-shared.sh             ← 从 Web 项目同步共享代码
```

---

## 4. 导航设计

### 启动路由逻辑

```
App 启动
  └── _layout.tsx 检查 Supabase session
        ├── 无 session → router.replace('/(auth)/login')
        └── 有 session
              ├── role = aigcer → router.replace('/(tabs)/')
              └── role = client → router.replace('/(tabs)/')
```

### 底部 Tab 结构

| Tab | 路由 | 图标 | Aigcer 内容 | Client 内容 |
|-----|------|------|------------|------------|
| 首页 | `(tabs)/index` | home | 工作台（应征中/进行中/收入） | 工作台（已发布/招募中/进行中） |
| 项目 | `(tabs)/commissions` | video | 浏览委托，可申请 | 浏览委托，可发布 |
| 作品 | `(tabs)/gallery` | image | AI 影视作品瀑布流 | 同左 |
| 消息 | `(tabs)/messages` | chat | 申请状态更新 | 新申请提醒 |
| 我的 | `(tabs)/profile` | person | 个人资料、认证、作品集 | 个人资料、认证 |

---

## 5. 各页面详细设计

### 5.1 首页 `(tabs)/index.tsx`

**Aigcer 视图：**
- 顶部：用户名 + 认证状态 Badge
- 若未认证：`CertificationBanner`（蓝色引导横幅，点击跳 `/onboarding/aigcer`）
- 统计网格 4 格：应征中 / 进行中 / 已完成 / 累计收入
- 应用列表：卡片显示委托标题、状态、里程碑进度条

**Client 视图：**
- 顶部：用户名 + 认证状态 Badge + "发布新项目"按钮
- 若未认证：`CertificationBanner`（跳 `/onboarding/client`）
- 统计网格 4 格：已发布 / 招募中 / 进行中 / 待验收
- 项目列表：卡片显示项目标题、报名人数、截止日期、状态

### 5.2 项目列表 `(tabs)/commissions.tsx`

- 顶部 Tab：商业 / 个人
- 搜索框
- 筛选芯片行：类型与风格 / 报酬区间 / 交付日期
- 列表：`CommissionCard` 组件，下拉刷新，上拉加载更多
- Client 且已认证：右上角"+ 发布"按钮

### 5.3 作品画廊 `(tabs)/gallery.tsx`

- 顶部 Tab：最新推荐 / 七日热门
- 横向滚动筛选芯片：影片类别 / 风格 / 技法
- 瀑布流（2 列）：封面图 + 点赞数
- 点击卡片：跳作品详情（全屏图 + 信息）

### 5.4 消息 `(tabs)/messages.tsx`

- 4 个消息分类入口（大图标格：系统通知 / 订阅上新 / 官方推送 / 互动消息）
- 下方会话列表（空时显示空状态组件）
- 顶部搜索框

### 5.5 我的 `(tabs)/profile.tsx`

- 头像 + 昵称 + 角色 Badge
- 快捷入口行：资金 / 赞过 / 徽章 / 足迹
- 创作与收藏统计：创作稿件 / 关注的制作方 / 收藏项目
- 若未认证：认证引导卡片 + "进行认证"按钮
- 若已认证 Aigcer：作品集预览（3 张缩略图）
- 底部：退出登录

### 5.6 项目详情 `commissions/[id].tsx`

- 项目标题、类别、截止日期、报酬区间
- 委托方信息（头像、昵称、认证状态）
- 详情描述、风格要求、交付格式
- Aigcer：底部"申请该项目"按钮 → 填写申请留言 + 期望报酬
- Client（项目作者）：查看申请列表，可接受/拒绝

### 5.7 发布项目 `commissions/new.tsx`

- 仅 Client 且已认证可访问
- 表单：标题、描述、类别、风格、报酬区间、截止日期、商业/个人用途
- 提交 → Supabase 写入 → 跳首页

---

## 6. 共享代码策略

### 复制脚本 `scripts/sync-shared.sh`

```bash
#!/bin/bash
# 从 Web 项目同步共享代码到 mobile/shared/
SRC="../src"
DST="./shared"
cp $SRC/lib/supabase.ts $DST/lib/supabase.ts
cp $SRC/services/authService.ts $DST/services/authService.ts
cp $SRC/services/commissionService.ts $DST/services/commissionService.ts
cp $SRC/types/commission.ts $DST/types/commission.ts
cp $SRC/types/user.ts $DST/types/user.ts
```

### AuthContext 改造点（唯一需要修改的共享文件）

```ts
// mobile/shared/contexts/AuthContext.tsx
// 替换: import { useNavigate } from 'react-router-dom'
// 改为: import { useRouter } from 'expo-router'
// 替换: navigate('/login') → router.replace('/(auth)/login')
```

### supabase.ts 适配

```ts
// 替换 import.meta.env.VITE_* → process.env.EXPO_PUBLIC_*
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
```

---

## 7. UI 规范

| 属性 | 值 |
|------|-----|
| 主色 | `#00BFFF` / `#1DA1F2` |
| 背景 | `#F5F7FA` |
| 卡片背景 | `#FFFFFF` |
| 文字主色 | `#1A1A2E` |
| 文字次色 | `#8A8A9A` |
| 圆角 | `rounded-xl`（12px） |
| 卡片阴影 | `shadow-sm` |
| 空状态 | 插图 + 标题 + 副标题 + CTA 按钮 |
| 认证 Badge | 已认证：蓝底白字；企业：金色；未认证：灰色 |

---

## 8. 错误处理

| 场景 | 处理方式 |
|------|---------|
| 未登录访问 Tab | `_layout.tsx` 检测，自动 redirect 到 `/login` |
| 未认证访问受限操作 | 首页 Banner 引导，不阻断浏览 |
| 网络请求失败 | React Query retry + Toast 提示 |
| Supabase 错误 | catch 后 Alert 显示 error.message |

---

## 9. 环境配置

```
mobile/.env
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

与 Web 端 `.env` 的值相同，只需改变量名前缀。

---

## 10. 实施顺序

1. 初始化 Expo 项目（`npx create-expo-app mobile --template`）
2. 安装依赖（expo-router, nativewind, supabase, react-query）
3. 配置 NativeWind + tailwind.config.js
4. 同步共享代码，改造 AuthContext + supabase.ts
5. 实现根布局 `_layout.tsx`（认证守卫）
6. 实现认证页（Login / Register）
7. 实现底部 Tab 导航框架
8. 逐 Tab 实现页面（首页 → 项目 → 作品 → 消息 → 我的）
9. 实现子页面（项目详情、发布、认证流程）
10. `npx expo run:ios` 验证 Xcode 构建
