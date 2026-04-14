# Stitch Mobile UI 对齐设计方案

**日期**：2026-04-14  
**项目**：跃然承制 AI 影视承制平台 — Mobile App  
**目标**：将 Stitch 导出的 17 个 Kinetic Azure 设计稿全部对齐到 `mobile/` Expo App

---

## 1. 背景与目标

Stitch 导出了 17 个屏幕设计稿，使用 **Kinetic Azure 设计系统**（Space Grotesk 标题字体 + Manrope 正文、#007AFF 主色、毛玻璃卡片、Kinetic 按钮动效）。

目标：
- Mobile App（Expo React Native + NativeWind v4）的所有屏幕视觉对齐 Stitch 设计
- 保留现有数据层（Supabase client、AuthContext、RoleContext、commissionService、TypeScript 类型）
- 替换所有屏幕 JSX 和组件 UI 代码
- 新建当前缺失的路由页面

---

## 2. 整体架构

### 保留不动
- `mobile/shared/lib/supabase.ts`
- `mobile/shared/contexts/AuthContext.tsx`
- `mobile/shared/contexts/RoleContext.tsx`
- `mobile/shared/services/`
- `mobile/shared/types/`
- `mobile/shared/data/mockData.ts`（扩展，不删除）
- 路由目录结构 `app/(tabs)/`、`app/(auth)/`、`app/commission/`

### 完全替换
- `mobile/tailwind.config.js` → Kinetic Azure 设计 token
- `mobile/components/` → 所有共享组件按 Stitch 模式重写
- 所有屏幕文件的 JSX（保留数据逻辑钩子）

### 新增
- `@expo-google-fonts/space-grotesk` 字体包
- 7 个新路由文件（见路由映射表）
- `app/_layout.tsx` 注册新 Stack.Screen

---

## 3. Step 1：Kinetic Azure 设计 Token

更新 `mobile/tailwind.config.js`：

```js
colors: {
  primary: '#007AFF',
  background: '#F2F2F7',
  surface: '#FFFFFF',
  'surface-container-low': '#F3F4F5',
  'on-surface': '#1C1C1E',
  'on-surface-variant': '#3A3A3C',
  outline: '#E5E5EA',
}
fontFamily: {
  headline: ['SpaceGrotesk_700Bold', 'sans-serif'],
  body: ['Manrope_400Regular', 'sans-serif'],
}
borderRadius: {
  DEFAULT: '12px',  // 所有元素最小 rounded-sm
}
```

在 `mobile/global.css` 补充：
```css
.glass-effect {
  backdrop-filter: blur(20px);
  background-color: rgba(243, 244, 245, 0.8);
}
.text-gradient {
  /* RN 不支持 CSS gradient text，用 MaskedView 实现 */
}
.btn-kinetic {
  /* 按下时 transform: scale(0.96)，用 Animated.spring 实现 */
}
```

---

## 4. Step 2：共享组件库（mobile/components/）

| 组件 | 出现屏幕 | 说明 |
|------|----------|------|
| `TopAppBar` | 全部 17 屏 | 毛玻璃 header，Logo（Space Grotesk 渐变文字）+ 右侧图标 |
| `KineticButton` | 全部 17 屏 | pill 形渐变按钮，`Animated.spring` 实现 scale(0.96) 按压效果 |
| `BottomTabBar` | 主 Tab 屏 | 自定义底部导航，替换 Expo Tabs 默认样式 |
| `GlassCard` | _2 _8 _9 _14 | 毛玻璃浮动卡片，`expo-blur` BlurView |
| `CommissionCard` | _11 _13 _15 | 项目卡片，最大圆角，渐变状态标签 |
| `StatsGrid` | _2 _9 _14 | 2×2 数据格，Material icon + 数字 + 标签 |
| `FilterChips` | _11 _5 _10 | 横向滚动 pill 筛选标签，选中态用 primary 填充 |
| `AvatarBadge` | _9 _10 _2 | 圆形头像 + 角标（认证/在线状态） |
| `PageLayout` | 全部 | SafeAreaView + background 色 + 顶部 TopAppBar padding 封装 |

**图标**：Material Symbols（web 字体）→ `@expo/vector-icons/MaterialCommunityIcons`，按需映射图标名称

---

## 5. Step 3：17 屏翻译路由映射

| Stitch 屏 | 文件路径 | 状态 | 数据来源 |
|-----------|----------|------|----------|
| _17 登录 | `app/(auth)/login.tsx` | 替换 UI | AuthContext |
| _16 身份选择 | `app/onboarding/role.tsx` | 新建 | RoleContext |
| _2 工作台 | `app/(tabs)/index.tsx` | 替换 UI | commissionService + mock |
| _11 项目广场 | `app/(tabs)/plaza.tsx` | 替换 UI | commissionService |
| _14 发现/AI | `app/(tabs)/discover.tsx` | 替换 UI | mock AI 数据 |
| _5 消息 | `app/(tabs)/messages.tsx` | 替换 UI | mock 对话列表 |
| _9 我的/钱包 | `app/(tabs)/profile.tsx` | 替换 UI | AuthContext + mock 钱包 |
| _12 发布企划 | `app/commission/new.tsx` | 替换 UI | commissionService |
| _13 项目详情 | `app/commission/[id].tsx` | 替换 UI | commissionService |
| _10 申请者列表 | `app/commission/applicants.tsx` | 替换 UI | commissionService |
| _3 合同与托管 | `app/commission/contract.tsx` | 新建 | mock 合同数据 |
| _4 样片验收 | `app/commission/review.tsx` | 新建 | mock 样片数据 |
| _8 作品详情 | `app/portfolio/[id].tsx` | 新建 | mock 作品数据 |
| _6 作品编辑器 | `app/portfolio/edit.tsx` | 新建 | mock + expo-image-picker |
| _1 通知详情 | `app/notification/[id].tsx` | 新建 | mock 通知数据 |
| _7 申诉支持 | `app/support/appeal.tsx` | 新建 | mock |
| _15 AI趋势 | `app/(tabs)/discover.tsx` 子区块 | 合并入发现页 | mock AI 数据 |

---

## 6. 数据绑定原则

- **已有 Supabase 连接的字段**：直接绑定（委托列表、用户信息、认证状态）
- **Stitch 特有字段**（钱包余额、AI效率、样片进度）：在 `shared/data/mockData.ts` 补充新类型，结构预留真实接口扩展位置
- **新路由注册**：在 `app/_layout.tsx` 的 Stack 里补充 `portfolio`、`notification`、`support`、`onboarding/role` 等 Screen

---

## 7. Stitch 技术转换说明

| Stitch HTML | React Native 等价 |
|-------------|-------------------|
| `backdrop-blur-xl` | `expo-blur` BlurView |
| `material-symbols-outlined` | `MaterialCommunityIcons` |
| `Space Grotesk` 字体 | `@expo-google-fonts/space-grotesk` |
| `active:scale-96` | `Animated.spring` + `Pressable` |
| CSS gradient text | `expo-linear-gradient` + `MaskedView` |
| `overflow-hidden` scroll | `ScrollView` / `FlatList` |

---

## 8. 执行顺序

1. 安装新依赖（space-grotesk 字体、expo-blur、expo-linear-gradient）
2. 更新 `tailwind.config.js` 设计 token
3. 重写 `mobile/components/` 共享组件（9 个）
4. 更新 `app/_layout.tsx` 注册新路由
5. 组 1：翻译登录 + 身份选择（_17 _16）
6. 组 2：翻译 5 个主 Tab（_2 _11 _14 _5 _9）
7. 组 3：翻译项目流程（_12 _13 _10 _3 _4）
8. 组 4：翻译内容 + 支持（_8 _6 _1 _7 _15）
