# Supabase 数据层接入设计文档

**日期：** 2026-04-13  
**项目：** visual-vision-web-main  
**目标：** 将现有 localStorage mock 数据层替换为 Supabase，Web 和未来 App 共用同一后端

---

## 背景

当前项目数据全部存储在浏览器 localStorage 中（`authService.ts`、`commissionService.ts`、`userService.ts`），导致：
- 数据无法跨设备共享
- 多用户之间互相看不到数据
- 无法支持未来的手机 App

---

## 方案选择

采用**方案一：替换 service 层内部实现**，保持所有函数签名不变，页面组件无需改动。

---

## Supabase 项目信息

- **Project URL：** `https://jvputddodhuvxhqsprlj.supabase.co`
- **Publishable Key：** 存于 `.env` 文件，不提交 git

---

## 架构设计

```
页面组件（不改动）
    ↓
service 层（替换内部实现）
├── authService.ts    → Supabase Auth
├── commissionService.ts → Supabase Database
└── userService.ts    → Supabase Database
    ↓
src/lib/supabase.ts   （新增：客户端单例）
    ↓
Supabase 云端
├── Auth（用户认证）
├── Database（PostgreSQL）
└── Storage（文件存储）
```

---

## 数据库表设计

### profiles（用户资料）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键，对应 auth.users.id |
| nickname | text | 昵称 |
| phone | text | 手机号 |
| role | text | 'aigcer' \| 'client' |
| verification_status | text | 'none' \| 'pending' \| 'verified' |
| client_verification_type | text | 'realname' \| 'enterprise'，可为空 |
| aigcer_bio | text | 创作者简介，可为空 |
| aigcer_styles | text[] | 风格标签数组，可为空 |
| aigcer_tools | text[] | 工具标签数组，可为空 |
| avatar_url | text | 头像文件路径，可为空 |
| created_at | timestamptz | 注册时间 |

### commissions（委托）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | bigint | 主键，自增 |
| title | text | 委托标题 |
| description | text | 需求描述 |
| category | text | 分类 |
| price_range | text | 价格区间 |
| deadline | text | 截止日期 |
| handling_fee | text | 手续费 |
| author_id | uuid | 关联 profiles.id |
| author_nickname | text | 发布者昵称（冗余，方便展示） |
| author_verification | text | 发布者认证状态 |
| purpose | text | 用途 |
| tag | text | 标签 |
| reputation | text | 信誉 |
| applicants | int | 应征人数 |
| rating | numeric | 评分 |
| reviews | int | 评价数 |
| completion_rate | text | 完成率 |
| created_at | timestamptz | 发布时间 |

### applications（应征）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| commission_id | bigint | 关联 commissions.id |
| aigcer_id | uuid | 关联 profiles.id |
| aigcer_nickname | text | 应征者昵称（冗余） |
| message | text | 应征留言 |
| expected_price | text | 期望报价 |
| status | text | 'pending' \| 'accepted' \| 'rejected' |
| applied_at | timestamptz | 应征时间 |

---

## Storage Buckets（文件存储）

| Bucket | 用途 | 访问权限 |
|--------|------|---------|
| avatars | 用户头像 | 公开读，登录写 |
| portfolios | 创作者作品集图片 | 公开读，登录写 |
| artworks | 展示作品图片/视频 | 公开读，登录写 |

---

## 环境变量

```env
VITE_SUPABASE_URL=https://jvputddodhuvxhqsprlj.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_WSJH-JTULpb84SNfvrb5uA_OOXcO6z8
```

存于项目根目录 `.env` 文件，已在 `.gitignore` 中排除。

---

## 用户注册登录方式

- **注册：** 邮箱 + 昵称 + 密码，注册后 Supabase 自动发送验证邮件（免费）
- **登录：** 邮箱 + 密码
- **手机号：** 改为选填，在个人资料里补填，不作为登录凭证
- Register.tsx 需要将手机号字段改为邮箱字段
- Login.tsx 将 placeholder 改为"邮箱"，逻辑不变

---

## 实施范围

### 新增文件
- `src/lib/supabase.ts` — Supabase 客户端单例
- `.env` — 环境变量

### 修改文件
- `src/services/authService.ts` — 替换为 Supabase Auth
- `src/services/commissionService.ts` — 替换为 Supabase Database
- `src/services/userService.ts` — 替换为 Supabase Database
- `src/types/user.ts` — 微调以匹配新字段命名
- `src/pages/Register.tsx` — 手机号字段改为邮箱字段
- `src/pages/Login.tsx` — placeholder 文案微调
- `src/contexts/AuthContext.tsx` — 监听 Supabase session 变化

### 不改动
- 所有其他页面组件
- 所有 UI 组件

---

## 数据迁移

现有 localStorage 中的静态 mock 数据（`STATIC_COMMISSIONS`）迁移为 Supabase 数据库的初始种子数据，通过 SQL 脚本插入。

---

## Row Level Security（RLS）策略

| 表 | 读 | 写 |
|----|----|----|
| profiles | 登录用户可读所有，只能改自己 | 仅本人 |
| commissions | 所有人可读 | 仅登录用户，只能改自己的 |
| applications | 本人可读自己的应征 | 仅登录用户 |

---

## 成功标准

- [ ] 用户可以注册、登录、退出
- [ ] 不同设备登录同一账号数据一致
- [ ] 委托列表从数据库读取
- [ ] 发布委托保存到数据库
- [ ] 应征记录保存到数据库
- [ ] 文件上传到 Storage，URL 存入数据库
