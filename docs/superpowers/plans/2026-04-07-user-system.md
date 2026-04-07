# 用户系统与认证流程 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 AI影制平台实现完整的用户注册/登录、身份认证、工作台和项目发布/应征功能（前端 mock 版本）。

**Architecture:** Mock Service 层封装所有数据操作返回 Promise，组件通过 React Query 调用，AuthContext 持久化登录态到 localStorage。后端接入时只需替换 service 层实现。

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Query v5, react-hook-form, zod, vitest, @testing-library/react

---

## File Map

**新建文件：**
- `src/types/user.ts` — User、PortfolioItem、AigcerProfile 类型
- `src/types/commission.ts` — Commission、Application 类型
- `src/services/authService.ts` — 注册、登录、登出、getCurrentUser
- `src/services/userService.ts` — 更新认证状态、保存 AIGCer 资料
- `src/services/commissionService.ts` — 项目 CRUD、应征操作
- `src/contexts/AuthContext.tsx` — AuthProvider + useAuth hook
- `src/pages/Login.tsx` — 登录页
- `src/pages/Register.tsx` — 注册页（选角色）
- `src/pages/OnboardingAigcer.tsx` — AIGCer 两步认证引导
- `src/pages/OnboardingClient.tsx` — 甲方认证引导（实名/企业）
- `src/pages/DashboardClient.tsx` — 甲方工作台
- `src/pages/DashboardAigcer.tsx` — AIGCer 工作台
- `src/pages/CommissionNew.tsx` — 发布新项目页
- `src/test/services/authService.test.ts`
- `src/test/services/userService.test.ts`
- `src/test/services/commissionService.test.ts`

**修改文件：**
- `src/App.tsx` — 添加路由 + AuthProvider
- `src/components/Navbar.tsx` — 登录态感知
- `src/pages/CommissionDetail.tsx` — 应征按钮逻辑
- `src/pages/Commissions.tsx` — 使用 service + 甲方发布入口

---

## Task 1: 类型定义

**Files:**
- Create: `src/types/user.ts`
- Create: `src/types/commission.ts`

- [ ] **Step 1: 创建 user 类型文件**

```typescript
// src/types/user.ts
export type UserRole = 'aigcer' | 'client';
export type VerificationStatus = 'none' | 'pending' | 'verified';
export type ClientVerificationType = 'realname' | 'enterprise';

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  imageBase64: string;
}

export interface AigcerProfile {
  bio: string;
  styles: string[];
  tools: string[];
  portfolio: PortfolioItem[];
}

export interface User {
  id: string;
  email: string;
  phone: string;
  nickname: string;
  role: UserRole;
  verificationStatus: VerificationStatus;
  clientVerificationType?: ClientVerificationType;
  aigcerProfile?: AigcerProfile;
  avatar?: string;
  createdAt: string;
}

/** localStorage 内部存储格式（包含密码，仅 mock 使用）*/
export interface StoredUser extends User {
  password: string;
}
```

- [ ] **Step 2: 创建 commission 类型文件**

```typescript
// src/types/commission.ts
export interface Commission {
  id: number;
  title: string;
  description: string;
  tag: '实名认证' | '企业认证' | '未认证';
  reputation: string;
  deadline: string;
  category: string;
  applicants: number;
  priceRange: string;
  authorId: string;
  authorNickname: string;
  authorVerification: 'realname' | 'enterprise' | 'none';
  purpose: '商业用途' | '个人用途';
  style?: string;
  resolution?: string;
  format?: string;
  // 静态 mock 扩展字段（用于 CommissionDetail 展示）
  rating?: number;
  reviews?: number;
  completionRate?: string;
  handlingFee?: string;
}

export interface Application {
  id: string;
  commissionId: number;
  aigcerId: string;
  aigcerNickname: string;
  message: string;
  expectedPrice: string;
  status: 'pending' | 'accepted' | 'rejected';
  appliedAt: string;
}
```

- [ ] **Step 3: 确认 TypeScript 编译通过**

```bash
npx tsc --noEmit
```
Expected: 无报错（types 文件本身无依赖）

- [ ] **Step 4: Commit**

```bash
git add src/types/
git commit -m "feat: add User and Commission type definitions"
```

---

## Task 2: authService

**Files:**
- Create: `src/services/authService.ts`
- Create: `src/test/services/authService.test.ts`

- [ ] **Step 1: 写失败测试**

```typescript
// src/test/services/authService.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { register, login, logout, getCurrentUser } from '@/services/authService';

beforeEach(() => {
  localStorage.clear();
});

describe('register', () => {
  it('creates a user and returns it without password', async () => {
    const user = await register({
      phone: '13800000001', email: 'test@test.com',
      password: 'pass123', nickname: '测试用户', role: 'aigcer',
    });
    expect(user.nickname).toBe('测试用户');
    expect(user.role).toBe('aigcer');
    expect(user.verificationStatus).toBe('none');
    expect('password' in user).toBe(false);
  });

  it('throws if phone already registered', async () => {
    await register({ phone: '13800000001', email: 'a@a.com', password: 'p', nickname: 'A', role: 'client' });
    await expect(register({ phone: '13800000001', email: 'b@b.com', password: 'p', nickname: 'B', role: 'client' }))
      .rejects.toThrow('该账号已注册');
  });
});

describe('login', () => {
  it('returns user on correct credentials', async () => {
    await register({ phone: '13900000001', email: '', password: 'secret', nickname: '登录测试', role: 'client' });
    const user = await login({ account: '13900000001', password: 'secret' });
    expect(user.nickname).toBe('登录测试');
  });

  it('throws on wrong password', async () => {
    await register({ phone: '13900000002', email: '', password: 'correct', nickname: 'X', role: 'aigcer' });
    await expect(login({ account: '13900000002', password: 'wrong' })).rejects.toThrow('账号或密码错误');
  });
});

describe('getCurrentUser', () => {
  it('returns null when not logged in', () => {
    expect(getCurrentUser()).toBeNull();
  });

  it('returns user after login', async () => {
    await register({ phone: '13700000001', email: '', password: 'p', nickname: '当前用户', role: 'aigcer' });
    const user = getCurrentUser();
    expect(user?.nickname).toBe('当前用户');
  });
});

describe('logout', () => {
  it('clears current user', async () => {
    await register({ phone: '13600000001', email: '', password: 'p', nickname: 'L', role: 'client' });
    logout();
    expect(getCurrentUser()).toBeNull();
  });
});
```

- [ ] **Step 2: 运行确认失败**

```bash
npx vitest run src/test/services/authService.test.ts
```
Expected: FAIL — `Cannot find module '@/services/authService'`

- [ ] **Step 3: 实现 authService**

```typescript
// src/services/authService.ts
import { StoredUser, User, UserRole } from '@/types/user';

const USERS_KEY = 'vai_users';
const CURRENT_KEY = 'vai_current_user_id';

function getStoredUsers(): StoredUser[] {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); }
  catch { return []; }
}
function saveStoredUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export interface RegisterParams {
  phone: string;
  email: string;
  password: string;
  nickname: string;
  role: UserRole;
}

export interface LoginParams {
  account: string; // phone or email
  password: string;
}

export async function register(params: RegisterParams): Promise<User> {
  await new Promise(r => setTimeout(r, 300));
  const users = getStoredUsers();
  const exists = users.find(u =>
    (params.phone && u.phone === params.phone) ||
    (params.email && u.email === params.email)
  );
  if (exists) throw new Error('该账号已注册');
  const { password, ...rest } = {
    id: crypto.randomUUID(),
    phone: params.phone,
    email: params.email,
    nickname: params.nickname,
    role: params.role,
    verificationStatus: 'none' as const,
    password: params.password,
    createdAt: new Date().toISOString(),
  };
  const storedUser: StoredUser = { ...rest, password };
  users.push(storedUser);
  saveStoredUsers(users);
  localStorage.setItem(CURRENT_KEY, storedUser.id);
  return rest;
}

export async function login(params: LoginParams): Promise<User> {
  await new Promise(r => setTimeout(r, 300));
  const users = getStoredUsers();
  const found = users.find(u =>
    (u.phone === params.account || u.email === params.account) &&
    u.password === params.password
  );
  if (!found) throw new Error('账号或密码错误');
  localStorage.setItem(CURRENT_KEY, found.id);
  const { password: _, ...user } = found;
  return user;
}

export function logout(): void {
  localStorage.removeItem(CURRENT_KEY);
}

export function getCurrentUser(): User | null {
  const id = localStorage.getItem(CURRENT_KEY);
  if (!id) return null;
  const found = getStoredUsers().find(u => u.id === id);
  if (!found) return null;
  const { password: _, ...user } = found;
  return user;
}

export function updateStoredUser(userId: string, updates: Partial<StoredUser>): User {
  const users = getStoredUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) throw new Error('User not found');
  users[idx] = { ...users[idx], ...updates };
  saveStoredUsers(users);
  const { password: _, ...user } = users[idx];
  return user;
}
```

- [ ] **Step 4: 运行确认通过**

```bash
npx vitest run src/test/services/authService.test.ts
```
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/services/authService.ts src/test/services/authService.test.ts
git commit -m "feat: add authService with register/login/logout"
```

---

## Task 3: userService

**Files:**
- Create: `src/services/userService.ts`
- Create: `src/test/services/userService.test.ts`

- [ ] **Step 1: 写失败测试**

```typescript
// src/test/services/userService.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { register } from '@/services/authService';
import { updateVerificationStatus, saveAigcerProfile } from '@/services/userService';

beforeEach(() => { localStorage.clear(); });

describe('updateVerificationStatus', () => {
  it('updates verificationStatus to verified', async () => {
    const user = await register({ phone: '13800000001', email: '', password: 'p', nickname: 'U', role: 'client' });
    const updated = await updateVerificationStatus(user.id, 'verified', 'realname');
    expect(updated.verificationStatus).toBe('verified');
    expect(updated.clientVerificationType).toBe('realname');
  });
});

describe('saveAigcerProfile', () => {
  it('saves profile to user', async () => {
    const user = await register({ phone: '13800000002', email: '', password: 'p', nickname: 'A', role: 'aigcer' });
    const updated = await saveAigcerProfile(user.id, {
      bio: '我是AIGCer', styles: ['二次元'], tools: ['Runway'],
      portfolio: [],
    });
    expect(updated.aigcerProfile?.bio).toBe('我是AIGCer');
    expect(updated.aigcerProfile?.styles).toContain('二次元');
  });
});
```

- [ ] **Step 2: 运行确认失败**

```bash
npx vitest run src/test/services/userService.test.ts
```
Expected: FAIL

- [ ] **Step 3: 实现 userService**

```typescript
// src/services/userService.ts
import { User, VerificationStatus, ClientVerificationType, AigcerProfile } from '@/types/user';
import { updateStoredUser } from '@/services/authService';

export async function updateVerificationStatus(
  userId: string,
  status: VerificationStatus,
  clientVerificationType?: ClientVerificationType,
): Promise<User> {
  await new Promise(r => setTimeout(r, 200));
  return updateStoredUser(userId, {
    verificationStatus: status,
    ...(clientVerificationType ? { clientVerificationType } : {}),
  });
}

export async function saveAigcerProfile(
  userId: string,
  profile: AigcerProfile,
): Promise<User> {
  await new Promise(r => setTimeout(r, 200));
  return updateStoredUser(userId, { aigcerProfile: profile });
}
```

- [ ] **Step 4: 运行确认通过**

```bash
npx vitest run src/test/services/userService.test.ts
```
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/services/userService.ts src/test/services/userService.test.ts
git commit -m "feat: add userService for verification and profile updates"
```

---

## Task 4: commissionService

**Files:**
- Create: `src/services/commissionService.ts`
- Create: `src/test/services/commissionService.test.ts`

- [ ] **Step 1: 写失败测试**

```typescript
// src/test/services/commissionService.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import {
  getCommissions, getCommissionById, createCommission,
  applyToCommission, getApplicationsByAigcer,
} from '@/services/commissionService';

beforeEach(() => { localStorage.clear(); });

describe('getCommissions', () => {
  it('returns static commissions when no user commissions exist', async () => {
    const list = await getCommissions();
    expect(list.length).toBeGreaterThanOrEqual(8);
    expect(list[0].id).toBe(0);
  });

  it('includes newly created commissions', async () => {
    await createCommission({
      title: '新项目', description: '描述', tag: '实名认证',
      deadline: '2026-12-01', category: '创意短片', priceRange: '¥1k - 3k',
      authorId: 'user1', authorNickname: '张三', authorVerification: 'realname',
      purpose: '商业用途', reputation: '信誉优良',
    });
    const list = await getCommissions();
    expect(list.some(c => c.title === '新项目')).toBe(true);
  });
});

describe('getCommissionById', () => {
  it('returns commission with matching id', async () => {
    const c = await getCommissionById(0);
    expect(c?.title).toBe('企业品牌AI宣传片制作');
  });

  it('returns null for unknown id', async () => {
    const c = await getCommissionById(99999);
    expect(c).toBeNull();
  });
});

describe('applyToCommission', () => {
  it('creates application', async () => {
    const app = await applyToCommission(0, 'aigcer1', '李四', '我来应征', '¥5k');
    expect(app.commissionId).toBe(0);
    expect(app.status).toBe('pending');
  });

  it('throws if already applied', async () => {
    await applyToCommission(0, 'aigcer1', '李四', 'msg', '¥5k');
    await expect(applyToCommission(0, 'aigcer1', '李四', 'msg2', '¥5k'))
      .rejects.toThrow('已经应征过该项目');
  });
});

describe('getApplicationsByAigcer', () => {
  it('returns only applications for given aigcer', async () => {
    await applyToCommission(0, 'aigcer-A', 'A', 'msg', '¥1k');
    await applyToCommission(1, 'aigcer-B', 'B', 'msg', '¥2k');
    const apps = await getApplicationsByAigcer('aigcer-A');
    expect(apps).toHaveLength(1);
    expect(apps[0].aigcerId).toBe('aigcer-A');
  });
});
```

- [ ] **Step 2: 运行确认失败**

```bash
npx vitest run src/test/services/commissionService.test.ts
```
Expected: FAIL

- [ ] **Step 3: 实现 commissionService**

```typescript
// src/services/commissionService.ts
import { Commission, Application } from '@/types/commission';

const COMMISSIONS_KEY = 'vai_commissions';
const APPLICATIONS_KEY = 'vai_applications';

const STATIC_COMMISSIONS: Commission[] = [
  { id: 0, title: "企业品牌AI宣传片制作", description: "需要制作一支60秒企业品牌宣传AI影片，风格现代简洁，突出科技感，需包含产品展示、公司文化等内容。", tag: "实名认证", reputation: "信誉优良", deadline: "2026-04-29", category: "商业宣传片", applicants: 0, priceRange: "¥3k - 8k", authorId: "mock", authorNickname: "柚柚酒", authorVerification: "realname", purpose: "商业用途", rating: 5, reviews: 17, completionRate: "17 / 17", handlingFee: "5%" },
  { id: 1, title: "AI科幻短片制作（已有分镜）", description: "未来科幻风格短片，时长约3分钟，已有分镜脚本，需按照我方提供的参考风格进行AI影片生成与合成。", tag: "企业认证", reputation: "信誉优良", deadline: "2026-04-30", category: "创意短片", applicants: 1, priceRange: "¥5k - 15k", authorId: "mock", authorNickname: "画境工作室", authorVerification: "enterprise", purpose: "商业用途", rating: 5, reviews: 32, completionRate: "30 / 32", handlingFee: "5%" },
  { id: 2, title: "游戏宣传AI概念影像制作", description: "需要制作游戏上线宣传概念影像，时长30秒，风格奇幻史诗，需要AI生成角色动态与场景融合。", tag: "实名认证", reputation: "信誉优良", deadline: "2026-04-16", category: "概念影像", applicants: 1, priceRange: "¥2k - 6k", authorId: "mock", authorNickname: "星辰", authorVerification: "realname", purpose: "商业用途", rating: 4, reviews: 8, completionRate: "7 / 8", handlingFee: "5%" },
  { id: 3, title: "虚拟主播AI形象短视频", description: "为虚拟主播制作AI形象宣传短视频，时长约15秒，需要Q版可爱风格，含动态效果。", tag: "企业认证", reputation: "信誉优良", deadline: "2026-04-30", category: "短视频", applicants: 1, priceRange: "¥500 - 2k", authorId: "mock", authorNickname: "V社工作室", authorVerification: "enterprise", purpose: "商业用途", rating: 5, reviews: 15, completionRate: "14 / 15", handlingFee: "5%" },
  { id: 4, title: "个人IP形象AI动态展示视频", description: "为个人原创IP制作AI动态展示视频，时长约20秒，需要配合已有形象设定进行AI生成。", tag: "未认证", reputation: "信誉优良", deadline: "2026-04-29", category: "创意短片", applicants: 0, priceRange: "¥300 - 1k", authorId: "mock", authorNickname: "小鱼", authorVerification: "none", purpose: "个人用途", rating: 3, reviews: 2, completionRate: "2 / 2", handlingFee: "5%" },
  { id: 5, title: "二次元风格AI宣传影片", description: "卡通日系厚涂风格AI影片，含角色动态、场景切换，用于产品发布会宣传展示。", tag: "未认证", reputation: "信誉优良", deadline: "2027-03-01", category: "商业宣传片", applicants: 1, priceRange: "¥3k - 20k", authorId: "mock", authorNickname: "梦想家", authorVerification: "none", purpose: "商业用途", rating: 4, reviews: 5, completionRate: "4 / 5", handlingFee: "5%" },
  { id: 6, title: "暗黑哥特风AI概念影像", description: "整体氛围暗黑哥特风格，AI生成二次元人偶与复古洛丽塔融合场景，低饱和冷色调，破碎感强烈。", tag: "实名认证", reputation: "信誉优良", deadline: "2026-04-15", category: "概念影像", applicants: 0, priceRange: "¥1k - 5k", authorId: "mock", authorNickname: "暗夜蔷薇", authorVerification: "realname", purpose: "个人用途", rating: 5, reviews: 12, completionRate: "11 / 12", handlingFee: "5%" },
  { id: 7, title: "海洋主题AI短片制作", description: "以海天使为原型的海洋主题AI短片，配色以鲜艳蓝色为主，需融入海洋生物元素，时长约30秒。", tag: "实名认证", reputation: "信誉优良", deadline: "2026-04-05", category: "创意短片", applicants: 1, priceRange: "¥500 - 2k", authorId: "mock", authorNickname: "海天使", authorVerification: "realname", purpose: "个人用途", rating: 4, reviews: 6, completionRate: "5 / 6", handlingFee: "5%" },
];

function getUserCommissions(): Commission[] {
  try { return JSON.parse(localStorage.getItem(COMMISSIONS_KEY) || '[]'); }
  catch { return []; }
}
function saveUserCommissions(list: Commission[]) {
  localStorage.setItem(COMMISSIONS_KEY, JSON.stringify(list));
}
function getStoredApplications(): Application[] {
  try { return JSON.parse(localStorage.getItem(APPLICATIONS_KEY) || '[]'); }
  catch { return []; }
}
function saveApplications(list: Application[]) {
  localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(list));
}

export async function getCommissions(): Promise<Commission[]> {
  return [...STATIC_COMMISSIONS, ...getUserCommissions()];
}

export async function getCommissionById(id: number): Promise<Commission | null> {
  const all = await getCommissions();
  return all.find(c => c.id === id) ?? null;
}

export async function getCommissionsByAuthor(authorId: string): Promise<Commission[]> {
  const all = await getCommissions();
  return all.filter(c => c.authorId === authorId);
}

export async function createCommission(
  data: Omit<Commission, 'id' | 'applicants'>,
): Promise<Commission> {
  await new Promise(r => setTimeout(r, 300));
  const commission: Commission = { ...data, id: Date.now(), applicants: 0 };
  const existing = getUserCommissions();
  existing.push(commission);
  saveUserCommissions(existing);
  return commission;
}

export async function applyToCommission(
  commissionId: number,
  aigcerId: string,
  aigcerNickname: string,
  message: string,
  expectedPrice: string,
): Promise<Application> {
  await new Promise(r => setTimeout(r, 300));
  const apps = getStoredApplications();
  if (apps.find(a => a.commissionId === commissionId && a.aigcerId === aigcerId)) {
    throw new Error('已经应征过该项目');
  }
  const application: Application = {
    id: crypto.randomUUID(),
    commissionId, aigcerId, aigcerNickname, message, expectedPrice,
    status: 'pending',
    appliedAt: new Date().toISOString(),
  };
  apps.push(application);
  saveApplications(apps);
  // 更新用户发布的项目的应征人数（静态数据不变，这对 mock 阶段可接受）
  const userCommissions = getUserCommissions();
  const idx = userCommissions.findIndex(c => c.id === commissionId);
  if (idx !== -1) { userCommissions[idx].applicants += 1; saveUserCommissions(userCommissions); }
  return application;
}

export async function getApplicationsByAigcer(aigcerId: string): Promise<Application[]> {
  return getStoredApplications().filter(a => a.aigcerId === aigcerId);
}

export async function getApplicationsByCommission(commissionId: number): Promise<Application[]> {
  return getStoredApplications().filter(a => a.commissionId === commissionId);
}
```

- [ ] **Step 4: 运行确认通过**

```bash
npx vitest run src/test/services/commissionService.test.ts
```
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/services/commissionService.ts src/test/services/commissionService.test.ts
git commit -m "feat: add commissionService with CRUD and application logic"
```

---

## Task 5: AuthContext

**Files:**
- Create: `src/contexts/AuthContext.tsx`

- [ ] **Step 1: 实现 AuthContext**

```tsx
// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types/user';
import { getCurrentUser, logout as serviceLogout } from '@/services/authService';

interface AuthContextValue {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setUser(getCurrentUser());
    setIsLoading(false);
  }, []);

  function logout() {
    serviceLogout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, setUser, logout, isLoading }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/contexts/AuthContext.tsx
git commit -m "feat: add AuthContext and AuthProvider"
```

---

## Task 6: 更新 App.tsx — 路由 + AuthProvider

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: 更新 App.tsx**

```tsx
// src/App.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Commissions from "./pages/Commissions";
import CommissionDetail from "./pages/CommissionDetail";
import CommissionNew from "./pages/CommissionNew";
import Gallery from "./pages/Gallery";
import Showcase from "./pages/Showcase";
import Events from "./pages/Events";
import AppPage from "./pages/AppPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import OnboardingAigcer from "./pages/OnboardingAigcer";
import OnboardingClient from "./pages/OnboardingClient";
import DashboardClient from "./pages/DashboardClient";
import DashboardAigcer from "./pages/DashboardAigcer";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/onboarding/aigcer" element={<OnboardingAigcer />} />
            <Route path="/onboarding/client" element={<OnboardingClient />} />
            <Route path="/dashboard/client" element={<DashboardClient />} />
            <Route path="/dashboard/aigcer" element={<DashboardAigcer />} />
            <Route path="/commissions" element={<Commissions />} />
            <Route path="/commissions/new" element={<CommissionNew />} />
            <Route path="/commissions/:id" element={<CommissionDetail />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/showcase" element={<Showcase />} />
            <Route path="/events" element={<Events />} />
            <Route path="/app" element={<AppPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
```

注意：新增的页面文件（Login、Register 等）此时还不存在，TypeScript 会报错。先创建空的占位文件：

```bash
# 为每个新页面创建最小占位，避免编译报错
for page in Login Register OnboardingAigcer OnboardingClient DashboardClient DashboardAigcer CommissionNew; do
  echo "const ${page} = () => <div>${page}</div>; export default ${page};" > "src/pages/${page}.tsx"
done
```

- [ ] **Step 2: 确认编译通过**

```bash
npx tsc --noEmit
```
Expected: 无报错

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx src/pages/Login.tsx src/pages/Register.tsx src/pages/OnboardingAigcer.tsx src/pages/OnboardingClient.tsx src/pages/DashboardClient.tsx src/pages/DashboardAigcer.tsx src/pages/CommissionNew.tsx
git commit -m "feat: add new routes and wrap app with AuthProvider"
```

---

## Task 7: 更新 Navbar

**Files:**
- Modify: `src/components/Navbar.tsx`

- [ ] **Step 1: 更新 Navbar 支持登录态**

```tsx
// src/components/Navbar.tsx
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { label: "项目", path: "/commissions" },
  { label: "橱窗", path: "/showcase" },
  { label: "影片", path: "/gallery" },
  { label: "活动", path: "/events" },
  { label: "App", path: "/app" },
];

const verificationLabel: Record<string, string> = {
  none: "未认证",
  pending: "审核中",
  verified: "已认证",
};

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const dashboardPath = user?.role === 'client' ? '/dashboard/client' : '/dashboard/aigcer';

  return (
    <nav className="h-[var(--nav-height)] flex items-center px-6 bg-background border-b border-border sticky top-0 z-50">
      <Link to="/" className="flex items-center gap-2 mr-8">
        <span className="text-xl font-bold text-primary">🎬 AI影制</span>
        <span className="text-xs text-muted-foreground tracking-wider">VISIONAI.COM</span>
      </Link>

      <div className="flex items-center gap-6">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`text-sm font-medium transition-colors hover:text-primary ${
              location.pathname === item.path ? "text-primary" : "text-foreground"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-3">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                  {user.nickname.charAt(0)}
                </div>
                <span className="text-sm text-foreground hidden sm:inline">{user.nickname}</span>
                {user.verificationStatus === 'verified' && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-tag-enterprise text-primary-foreground">
                    {user.clientVerificationType === 'enterprise' ? '企业认证' :
                     user.role === 'client' ? '实名认证' : '已认证'}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(dashboardPath)}>
                我的工作台
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => { logout(); navigate('/'); }}
                className="text-destructive"
              >
                退出登录
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <>
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>登录</Button>
            <Button size="sm" onClick={() => navigate('/register')}>注册</Button>
          </>
        )}
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: 确认编译通过**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Navbar.tsx
git commit -m "feat: make Navbar auth-aware with user menu"
```

---

## Task 8: Login 页面

**Files:**
- Modify: `src/pages/Login.tsx`

- [ ] **Step 1: 实现 Login 页面**

```tsx
// src/pages/Login.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { login } from "@/services/authService";

const schema = z.object({
  account: z.string().min(1, "请输入手机号或邮箱"),
  password: z.string().min(1, "请输入密码"),
});
type FormValues = z.infer<typeof schema>;

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [error, setError] = useState("");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormValues) {
    setError("");
    try {
      const user = await login({ account: data.account, password: data.password });
      setUser(user);
      navigate(user.role === 'client' ? '/dashboard/client' : '/dashboard/aigcer');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "登录失败");
    }
  }

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-xl p-8 shadow-sm">
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold text-primary">🎬 AI影制</Link>
          <p className="text-muted-foreground text-sm mt-2">登录你的账号</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="account">手机号 / 邮箱</Label>
            <Input id="account" placeholder="请输入手机号或邮箱" className="mt-1" {...register("account")} />
            {errors.account && <p className="text-destructive text-xs mt-1">{errors.account.message}</p>}
          </div>

          <div>
            <Label htmlFor="password">密码</Label>
            <Input id="password" type="password" placeholder="请输入密码" className="mt-1" {...register("password")} />
            {errors.password && <p className="text-destructive text-xs mt-1">{errors.password.message}</p>}
          </div>

          {error && <p className="text-destructive text-sm text-center">{error}</p>}

          <Button type="submit" className="w-full rounded-full" disabled={isSubmitting}>
            {isSubmitting ? "登录中..." : "登录"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          还没有账号？{" "}
          <Link to="/register" className="text-primary hover:underline">立即注册</Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Login.tsx
git commit -m "feat: add Login page"
```

---

## Task 9: Register 页面

**Files:**
- Modify: `src/pages/Register.tsx`

- [ ] **Step 1: 实现 Register 页面**

```tsx
// src/pages/Register.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { register as registerUser } from "@/services/authService";
import { UserRole } from "@/types/user";

const schema = z.object({
  phone: z.string().min(11, "请输入有效手机号").max(11),
  nickname: z.string().min(2, "昵称至少2个字"),
  password: z.string().min(6, "密码至少6位"),
});
type FormValues = z.infer<typeof schema>;

export default function Register() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [role, setRole] = useState<UserRole>('aigcer');
  const [error, setError] = useState("");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormValues) {
    setError("");
    try {
      const user = await registerUser({
        phone: data.phone, email: "",
        password: data.password, nickname: data.nickname, role,
      });
      setUser(user);
      navigate(role === 'client' ? '/onboarding/client' : '/onboarding/aigcer');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "注册失败");
    }
  }

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-xl p-8 shadow-sm">
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold text-primary">🎬 AI影制</Link>
          <p className="text-muted-foreground text-sm mt-2">创建新账号</p>
        </div>

        {/* 角色选择 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {([['aigcer', '🎬', '我是AIGCer', '接项目·展示作品'], ['client', '📋', '我是需求方', '发项目·找承制']] as const).map(
            ([r, emoji, title, sub]) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  role === r
                    ? 'border-primary bg-accent'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                <div className="text-2xl mb-1">{emoji}</div>
                <div className="text-sm font-semibold text-foreground">{title}</div>
                <div className="text-xs text-muted-foreground">{sub}</div>
              </button>
            )
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="phone">手机号</Label>
            <Input id="phone" placeholder="请输入手机号" className="mt-1" {...register("phone")} />
            {errors.phone && <p className="text-destructive text-xs mt-1">{errors.phone.message}</p>}
          </div>
          <div>
            <Label htmlFor="nickname">昵称</Label>
            <Input id="nickname" placeholder="你的展示名称" className="mt-1" {...register("nickname")} />
            {errors.nickname && <p className="text-destructive text-xs mt-1">{errors.nickname.message}</p>}
          </div>
          <div>
            <Label htmlFor="password">密码</Label>
            <Input id="password" type="password" placeholder="至少6位" className="mt-1" {...register("password")} />
            {errors.password && <p className="text-destructive text-xs mt-1">{errors.password.message}</p>}
          </div>

          {error && <p className="text-destructive text-sm text-center">{error}</p>}

          <Button type="submit" className="w-full rounded-full" disabled={isSubmitting}>
            {isSubmitting ? "注册中..." : "注册并继续"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          已有账号？{" "}
          <Link to="/login" className="text-primary hover:underline">立即登录</Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Register.tsx
git commit -m "feat: add Register page with role selection"
```

---

## Task 10: OnboardingAigcer

**Files:**
- Modify: `src/pages/OnboardingAigcer.tsx`

- [ ] **Step 1: 实现 OnboardingAigcer**

```tsx
// src/pages/OnboardingAigcer.tsx
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { updateVerificationStatus, saveAigcerProfile } from "@/services/userService";
import { AigcerProfile, PortfolioItem } from "@/types/user";

const STYLE_OPTIONS = ["二次元", "国风古典", "欧美写实", "科幻未来", "写实渲染", "赛博朋克", "奇幻史诗"];
const TOOL_OPTIONS = ["Midjourney", "Runway", "Kling", "Sora", "ComfyUI", "Stable Diffusion", "Pika"];

export default function OnboardingAigcer() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [step, setStep] = useState(1);
  const [bio, setBio] = useState("");
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function toggleTag(list: string[], setList: (v: string[]) => void, tag: string) {
    setList(list.includes(tag) ? list.filter(t => t !== tag) : [...list, tag]);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      setPortfolio(prev => [...prev, {
        id: crypto.randomUUID(),
        title: file.name.replace(/\.[^.]+$/, ''),
        description: "",
        imageBase64: base64,
      }]);
    }
  }

  function updatePortfolioItem(id: string, field: 'title' | 'description', value: string) {
    setPortfolio(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  }

  function removePortfolioItem(id: string) {
    setPortfolio(prev => prev.filter(p => p.id !== id));
  }

  async function handleSubmit() {
    if (!user) return;
    setSubmitting(true);
    const profile: AigcerProfile = { bio, styles: selectedStyles, tools: selectedTools, portfolio };
    const updatedUser = await saveAigcerProfile(user.id, profile);
    const pendingUser = await updateVerificationStatus(user.id, 'pending');
    setUser(pendingUser);
    // Mock 3秒后自动通过
    setTimeout(async () => {
      const verifiedUser = await updateVerificationStatus(user.id, 'verified');
      setUser(verifiedUser);
      navigate('/dashboard/aigcer');
    }, 3000);
  }

  if (!user) { navigate('/login'); return null; }

  return (
    <div className="min-h-screen bg-muted">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🎬</div>
          <h1 className="text-2xl font-bold text-foreground">AIGCer 资质认证</h1>
          <p className="text-muted-foreground text-sm mt-2">完成认证后即可应征项目</p>
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {[1, 2].map(s => (
              <div key={s} className={`flex items-center gap-2`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/20 text-muted-foreground'
                }`}>{s}</div>
                {s < 2 && <div className={`w-12 h-0.5 ${step > s ? 'bg-primary' : 'bg-border'}`} />}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Step 1 — 个人资质</h2>

              <div>
                <Label>个人简介</Label>
                <Textarea
                  className="mt-1" rows={3} maxLength={100}
                  placeholder="介绍一下你的创作风格和经验..."
                  value={bio} onChange={e => setBio(e.target.value)}
                />
                <p className="text-xs text-muted-foreground text-right mt-1">{bio.length}/100</p>
              </div>

              <div>
                <Label>擅长风格（多选）</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {STYLE_OPTIONS.map(tag => (
                    <button key={tag} type="button" onClick={() => toggleTag(selectedStyles, setSelectedStyles, tag)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        selectedStyles.includes(tag) ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary'
                      }`}>{tag}</button>
                  ))}
                </div>
              </div>

              <div>
                <Label>常用工具（多选）</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {TOOL_OPTIONS.map(tag => (
                    <button key={tag} type="button" onClick={() => toggleTag(selectedTools, setSelectedTools, tag)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        selectedTools.includes(tag) ? 'bg-secondary text-secondary-foreground border-secondary' : 'border-border hover:border-secondary'
                      }`}>{tag}</button>
                  ))}
                </div>
              </div>

              <Button className="w-full rounded-full" onClick={() => setStep(2)}
                disabled={bio.length < 10 || selectedStyles.length === 0}>
                下一步
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Step 2 — 上传作品集</h2>
              <p className="text-sm text-muted-foreground">至少上传 3 件作品用于资质审核</p>

              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                <div className="text-3xl mb-2">📁</div>
                <p className="text-sm text-muted-foreground">点击上传图片（支持批量选择）</p>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />

              {portfolio.map(item => (
                <div key={item.id} className="flex gap-3 p-3 bg-muted rounded-lg">
                  <img src={item.imageBase64} alt={item.title} className="w-16 h-16 object-cover rounded" />
                  <div className="flex-1 space-y-1">
                    <Input placeholder="作品标题" value={item.title}
                      onChange={e => updatePortfolioItem(item.id, 'title', e.target.value)} className="h-8 text-sm" />
                    <Input placeholder="简短说明" value={item.description}
                      onChange={e => updatePortfolioItem(item.id, 'description', e.target.value)} className="h-8 text-sm" />
                  </div>
                  <button onClick={() => removePortfolioItem(item.id)} className="text-muted-foreground hover:text-destructive">✕</button>
                </div>
              ))}

              {submitting && (
                <div className="text-center py-4">
                  <div className="text-primary text-2xl mb-2">⏳</div>
                  <p className="text-sm font-medium text-primary">审核中，预计 3 秒后通过...</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 rounded-full" onClick={() => setStep(1)}>上一步</Button>
                <Button className="flex-1 rounded-full" onClick={handleSubmit}
                  disabled={portfolio.length < 3 || submitting}>
                  提交审核
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/OnboardingAigcer.tsx
git commit -m "feat: add AIGCer onboarding with portfolio upload"
```

---

## Task 11: OnboardingClient

**Files:**
- Modify: `src/pages/OnboardingClient.tsx`

- [ ] **Step 1: 实现 OnboardingClient**

```tsx
// src/pages/OnboardingClient.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { updateVerificationStatus } from "@/services/userService";
import { ClientVerificationType } from "@/types/user";

export default function OnboardingClient() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [verType, setVerType] = useState<ClientVerificationType>('realname');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const realnameForm = useForm<{ realname: string; idCard: string; code: string }>();
  const enterpriseForm = useForm<{ companyName: string; creditCode: string; contact: string; phone: string }>();

  if (!user) { navigate('/login'); return null; }

  async function handleRealname(data: { realname: string; idCard: string; code: string }) {
    if (!/^\d{6}$/.test(data.code)) { setError("请输入6位验证码"); return; }
    setSubmitting(true);
    const updated = await updateVerificationStatus(user!.id, 'verified', 'realname');
    setUser(updated);
    navigate('/dashboard/client');
  }

  async function handleEnterprise(data: { companyName: string; creditCode: string; contact: string; phone: string }) {
    if (!/^[0-9A-Z]{18}$/.test(data.creditCode)) { setError("请输入有效的18位统一社会信用代码"); return; }
    setSubmitting(true);
    const updated = await updateVerificationStatus(user!.id, 'verified', 'enterprise');
    setUser(updated);
    navigate('/dashboard/client');
  }

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-card border border-border rounded-xl p-8 shadow-sm">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">📋</div>
          <h1 className="text-2xl font-bold">需求方资质认证</h1>
          <p className="text-muted-foreground text-sm mt-2">完成认证后即可发布项目</p>
        </div>

        {/* 认证类型选择 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {([['realname', '👤', '个人实名认证', '实名认证标签'], ['enterprise', '🏢', '企业认证', '企业认证标签']] as const).map(
            ([t, emoji, title, sub]) => (
              <button key={t} type="button" onClick={() => { setVerType(t); setError(""); }}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  verType === t ? 'border-primary bg-accent' : 'border-border hover:border-primary/40'
                }`}>
                <div className="text-2xl mb-1">{emoji}</div>
                <div className="text-sm font-semibold">{title}</div>
                <div className="text-xs text-muted-foreground">{sub}</div>
              </button>
            )
          )}
        </div>

        {verType === 'realname' && (
          <form onSubmit={realnameForm.handleSubmit(handleRealname)} className="space-y-4">
            <div>
              <Label>真实姓名</Label>
              <Input className="mt-1" placeholder="请输入真实姓名" {...realnameForm.register("realname", { required: true })} />
            </div>
            <div>
              <Label>身份证号</Label>
              <Input className="mt-1" placeholder="18位身份证号码" {...realnameForm.register("idCard", { required: true, minLength: 18, maxLength: 18 })} />
            </div>
            <div>
              <Label>手机验证码 <span className="text-xs text-muted-foreground">（mock：任意6位数字）</span></Label>
              <Input className="mt-1" placeholder="请输入6位验证码" maxLength={6} {...realnameForm.register("code", { required: true })} />
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button type="submit" className="w-full rounded-full" disabled={submitting}>
              {submitting ? "认证中..." : "提交认证"}
            </Button>
          </form>
        )}

        {verType === 'enterprise' && (
          <form onSubmit={enterpriseForm.handleSubmit(handleEnterprise)} className="space-y-4">
            <div>
              <Label>公司名称</Label>
              <Input className="mt-1" placeholder="请输入公司全称" {...enterpriseForm.register("companyName", { required: true })} />
            </div>
            <div>
              <Label>统一社会信用代码</Label>
              <Input className="mt-1" placeholder="18位信用代码" maxLength={18} {...enterpriseForm.register("creditCode", { required: true })} />
            </div>
            <div>
              <Label>联系人姓名</Label>
              <Input className="mt-1" placeholder="法定代表人或联系人" {...enterpriseForm.register("contact", { required: true })} />
            </div>
            <div>
              <Label>联系手机</Label>
              <Input className="mt-1" placeholder="请输入手机号" {...enterpriseForm.register("phone", { required: true })} />
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button type="submit" className="w-full rounded-full" disabled={submitting}>
              {submitting ? "认证中..." : "提交认证"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/OnboardingClient.tsx
git commit -m "feat: add Client onboarding with realname/enterprise verification"
```

---

## Task 12: DashboardClient

**Files:**
- Modify: `src/pages/DashboardClient.tsx`

- [ ] **Step 1: 实现 DashboardClient**

```tsx
// src/pages/DashboardClient.tsx
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { getCommissionsByAuthor } from "@/services/commissionService";
import { Commission } from "@/types/commission";

function statusLabel(c: Commission) {
  const now = new Date();
  const deadline = new Date(c.deadline);
  if (deadline < now) return { label: "已结束", class: "bg-muted text-muted-foreground" };
  if (c.applicants === 0) return { label: "招募中", class: "bg-blue-100 text-blue-700" };
  return { label: "进行中", class: "bg-yellow-100 text-yellow-700" };
}

export default function DashboardClient() {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) { navigate('/login'); return null; }
  if (user.role !== 'client') { navigate('/dashboard/aigcer'); return null; }

  const { data: commissions = [], isLoading } = useQuery({
    queryKey: ['commissions', 'author', user.id],
    queryFn: () => getCommissionsByAuthor(user.id),
  });

  const stats = {
    total: commissions.length,
    recruiting: commissions.filter(c => new Date(c.deadline) >= new Date() && c.applicants === 0).length,
    ongoing: commissions.filter(c => new Date(c.deadline) >= new Date() && c.applicants > 0).length,
    pending: 0,
  };

  const tagLabel = user.clientVerificationType === 'enterprise' ? '企业认证' :
    user.verificationStatus === 'verified' ? '实名认证' : '未认证';

  return (
    <div className="min-h-screen bg-muted">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 顶部 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">我的工作台</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-muted-foreground text-sm">{user.nickname}</span>
              <Badge className="text-xs">{tagLabel}</Badge>
            </div>
          </div>
          {user.verificationStatus === 'verified' ? (
            <Button className="rounded-full" onClick={() => navigate('/commissions/new')}>+ 发布新项目</Button>
          ) : (
            <Button variant="outline" className="rounded-full" onClick={() => navigate('/onboarding/client')}>
              完成认证以发布项目
            </Button>
          )}
        </div>

        {/* 统计 */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { num: stats.total, label: "已发布" },
            { num: stats.recruiting, label: "招募中" },
            { num: stats.ongoing, label: "进行中" },
            { num: stats.pending, label: "待验收" },
          ].map(({ num, label }) => (
            <div key={label} className="bg-card border border-border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-primary">{num}</div>
              <div className="text-xs text-muted-foreground mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* 项目列表 */}
        <div className="bg-card border border-border rounded-xl p-6">
          <Tabs defaultValue="all">
            <TabsList className="bg-transparent gap-4 p-0 mb-4">
              {["all", "recruiting", "ongoing", "done"].map((v, i) => (
                <TabsTrigger key={v} value={v}
                  className="text-sm data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent px-0 pb-2">
                  {["全部项目", "招募中", "进行中", "已完成"][i]}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all">
              {isLoading ? (
                <p className="text-center text-muted-foreground py-8">加载中...</p>
              ) : commissions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">还没有发布过项目</p>
                  {user.verificationStatus === 'verified' && (
                    <Button className="rounded-full" onClick={() => navigate('/commissions/new')}>立即发布第一个项目</Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {commissions.map(c => {
                    const s = statusLabel(c);
                    return (
                      <div key={c.id} onClick={() => navigate(`/commissions/${c.id}`)}
                        className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted cursor-pointer transition-colors">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{c.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{c.priceRange} · 截止 {c.deadline} · 应征 {c.applicants} 人</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.class}`}>{s.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
            <TabsContent value="recruiting">
              <p className="text-center text-muted-foreground py-8 text-sm">招募中项目将在此显示</p>
            </TabsContent>
            <TabsContent value="ongoing">
              <p className="text-center text-muted-foreground py-8 text-sm">进行中项目将在此显示</p>
            </TabsContent>
            <TabsContent value="done">
              <p className="text-center text-muted-foreground py-8 text-sm">已完成项目将在此显示</p>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/DashboardClient.tsx
git commit -m "feat: add client dashboard with project list and stats"
```

---

## Task 13: DashboardAigcer

**Files:**
- Modify: `src/pages/DashboardAigcer.tsx`

- [ ] **Step 1: 实现 DashboardAigcer**

```tsx
// src/pages/DashboardAigcer.tsx
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { getApplicationsByAigcer, getCommissionById } from "@/services/commissionService";
import { Application } from "@/types/commission";
import { useEffect, useState } from "react";
import { Commission } from "@/types/commission";

interface AppWithCommission { app: Application; commission: Commission | null; }

export default function DashboardAigcer() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [appDetails, setAppDetails] = useState<AppWithCommission[]>([]);

  if (!user) { navigate('/login'); return null; }
  if (user.role !== 'aigcer') { navigate('/dashboard/client'); return null; }

  const { data: applications = [] } = useQuery({
    queryKey: ['applications', 'aigcer', user.id],
    queryFn: () => getApplicationsByAigcer(user.id),
  });

  useEffect(() => {
    async function load() {
      const details = await Promise.all(
        applications.map(async app => ({ app, commission: await getCommissionById(app.commissionId) }))
      );
      setAppDetails(details);
    }
    load();
  }, [applications]);

  const stats = {
    applying: applications.filter(a => a.status === 'pending').length,
    ongoing: applications.filter(a => a.status === 'accepted').length,
    done: applications.filter(a => a.status === 'rejected').length, // placeholder
    income: 0,
  };

  const milestones = ["开始合作", "概念稿", "分镜", "粗剪", "确认交付"];

  return (
    <div className="min-h-screen bg-muted">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">我的工作台</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-muted-foreground text-sm">{user.nickname}</span>
              {user.verificationStatus === 'verified' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-tag-verified text-primary-foreground">✓ 已认证</span>
              )}
            </div>
          </div>
          <Button variant="outline" className="rounded-full" onClick={() => navigate('/commissions')}>
            去找项目 →
          </Button>
        </div>

        {/* 统计 */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { num: stats.applying, label: "应征中" },
            { num: stats.ongoing, label: "进行中" },
            { num: stats.done, label: "已完成" },
            { num: `¥${stats.income}`, label: "累计收入" },
          ].map(({ num, label }) => (
            <div key={label} className="bg-card border border-border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-primary">{num}</div>
              <div className="text-xs text-muted-foreground mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-card border border-border rounded-xl p-6">
          <Tabs defaultValue="projects">
            <TabsList className="bg-transparent gap-4 p-0 mb-4">
              {[["projects", "我的项目"], ["portfolio", "作品集"]].map(([v, l]) => (
                <TabsTrigger key={v} value={v}
                  className="text-sm data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent px-0 pb-2">
                  {l}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="projects">
              {appDetails.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">还没有应征过项目</p>
                  <Button className="rounded-full" onClick={() => navigate('/commissions')}>去找项目</Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {appDetails.map(({ app, commission }) => (
                    <div key={app.id} className="bg-muted rounded-lg p-4 cursor-pointer hover:bg-muted/80"
                      onClick={() => commission && navigate(`/commissions/${commission.id}`)}>
                      <p className="font-medium text-foreground text-sm mb-1">
                        {commission?.title ?? '未知项目'}
                      </p>
                      <p className="text-xs text-muted-foreground mb-3">
                        {commission?.priceRange} · 截止 {commission?.deadline}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        app.status === 'accepted' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {app.status === 'accepted' ? '进行中' : '已应征'}
                      </span>
                      {app.status === 'accepted' && (
                        <div className="mt-3">
                          <Progress value={20} className="h-1.5" />
                          <p className="text-xs text-muted-foreground mt-1">{milestones[1]} 阶段</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="portfolio">
              {user.aigcerProfile?.portfolio?.length ? (
                <div className="grid grid-cols-3 gap-3">
                  {user.aigcerProfile.portfolio.map(item => (
                    <div key={item.id} className="aspect-square rounded-lg overflow-hidden bg-accent">
                      <img src={item.imageBase64} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  {user.verificationStatus === 'none' ? (
                    <Button className="rounded-full" onClick={() => navigate('/onboarding/aigcer')}>完成认证上传作品集</Button>
                  ) : '暂无作品'}
                </p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/DashboardAigcer.tsx
git commit -m "feat: add AIGCer dashboard with applications and portfolio"
```

---

## Task 14: CommissionNew — 发布新项目

**Files:**
- Modify: `src/pages/CommissionNew.tsx`

- [ ] **Step 1: 实现 CommissionNew**

```tsx
// src/pages/CommissionNew.tsx
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { createCommission } from "@/services/commissionService";

const schema = z.object({
  title: z.string().min(5, "标题至少5个字"),
  description: z.string().min(20, "描述至少20个字"),
  category: z.string().min(1, "请选择类别"),
  priceMin: z.string().min(1, "请填写最低报酬"),
  priceMax: z.string().min(1, "请填写最高报酬"),
  deadline: z.string().min(1, "请选择截止日期"),
  purpose: z.enum(["商业用途", "个人用途"]),
  format: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const CATEGORIES = ["商业宣传片", "创意短片", "概念影像", "短视频", "动态海报", "AI动画"];

export default function CommissionNew() {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) { navigate('/login'); return null; }
  if (user.role !== 'client' || user.verificationStatus !== 'verified') {
    navigate('/dashboard/client'); return null;
  }

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { purpose: "商业用途" },
  });

  async function onSubmit(data: FormValues) {
    const tag = user!.clientVerificationType === 'enterprise' ? '企业认证' as const : '实名认证' as const;
    const authorVerification = user!.clientVerificationType === 'enterprise' ? 'enterprise' as const : 'realname' as const;

    await createCommission({
      title: data.title,
      description: data.description,
      category: data.category,
      priceRange: `¥${data.priceMin} - ${data.priceMax}`,
      deadline: data.deadline,
      purpose: data.purpose,
      format: data.format,
      tag,
      reputation: '信誉优良',
      authorId: user!.id,
      authorNickname: user!.nickname,
      authorVerification,
    });
    navigate('/dashboard/client');
  }

  return (
    <div className="min-h-screen bg-muted">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground text-sm">← 返回</button>
          <h1 className="text-xl font-bold">发布新项目</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-card border border-border rounded-xl p-6 space-y-5">
            <div>
              <Label>项目标题</Label>
              <Input className="mt-1" placeholder="简明描述你的需求，如「企业品牌AI宣传片制作」" {...register("title")} />
              {errors.title && <p className="text-destructive text-xs mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <Label>需求描述</Label>
              <Textarea className="mt-1" rows={4} placeholder="详细描述影片风格、时长、用途、参考案例等..." {...register("description")} />
              {errors.description && <p className="text-destructive text-xs mt-1">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>影片类别</Label>
                <Select onValueChange={v => setValue("category", v)}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="请选择" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-destructive text-xs mt-1">{errors.category.message}</p>}
              </div>

              <div>
                <Label>用途</Label>
                <Select defaultValue="商业用途" onValueChange={v => setValue("purpose", v as "商业用途" | "个人用途")}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="商业用途">商业用途</SelectItem>
                    <SelectItem value="个人用途">个人用途</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>报酬区间（最低）</Label>
                <Input className="mt-1" placeholder="如：3000" {...register("priceMin")} />
                {errors.priceMin && <p className="text-destructive text-xs mt-1">{errors.priceMin.message}</p>}
              </div>
              <div>
                <Label>报酬区间（最高）</Label>
                <Input className="mt-1" placeholder="如：8000" {...register("priceMax")} />
                {errors.priceMax && <p className="text-destructive text-xs mt-1">{errors.priceMax.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>截止日期</Label>
                <Input type="date" className="mt-1" {...register("deadline")} />
                {errors.deadline && <p className="text-destructive text-xs mt-1">{errors.deadline.message}</p>}
              </div>
              <div>
                <Label>影片格式（选填）</Label>
                <Input className="mt-1" placeholder="如：MP4、MOV" {...register("format")} />
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button type="button" variant="outline" className="flex-1 rounded-full" onClick={() => navigate(-1)}>取消</Button>
            <Button type="submit" className="flex-1 rounded-full" disabled={isSubmitting}>
              {isSubmitting ? "发布中..." : "发布项目"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/CommissionNew.tsx
git commit -m "feat: add CommissionNew page for clients to post projects"
```

---

## Task 15: 更新 CommissionDetail — 应征按钮逻辑

**Files:**
- Modify: `src/pages/CommissionDetail.tsx`

- [ ] **Step 1: 在 CommissionDetail 顶部添加导入**

在文件顶部现有 imports 之后添加：

```typescript
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { applyToCommission } from "@/services/commissionService";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
```

- [ ] **Step 2: 在 CommissionDetail 组件内添加 hook 和应征逻辑**

在 `const CommissionDetail = () => {` 内的 `const { id } = useParams();` 之后添加：

```typescript
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyMessage, setApplyMessage] = useState("");
  const [expectedPrice, setExpectedPrice] = useState("");
  const [applying, setApplying] = useState(false);

  async function handleApply() {
    if (!user) return;
    setApplying(true);
    try {
      await applyToCommission(
        commission.id, user.id, user.nickname, applyMessage, expectedPrice
      );
      toast({ title: "应征成功！", description: "需求方将会查看你的应征信息。" });
      setApplyOpen(false);
    } catch (e: unknown) {
      toast({ title: "应征失败", description: e instanceof Error ? e.message : "请稍后重试", variant: "destructive" });
    } finally {
      setApplying(false);
    }
  }

  function getApplyButton() {
    if (!user) return (
      <Button className="w-full rounded-full text-base" size="lg" onClick={() => navigate('/login')}>
        🎬 登录后应征
      </Button>
    );
    if (user.role === 'client') return (
      <Button className="w-full rounded-full text-base" size="lg" disabled>
        甲方账号无法应征
      </Button>
    );
    if (user.verificationStatus !== 'verified') return (
      <Button className="w-full rounded-full text-base" size="lg" onClick={() => navigate('/onboarding/aigcer')}>
        完成认证后应征
      </Button>
    );
    return (
      <Button className="w-full rounded-full text-base" size="lg" onClick={() => setApplyOpen(true)}>
        🎬 应征项目
      </Button>
    );
  }
```

- [ ] **Step 3: 替换现有的"应征项目"按钮**

找到现有的按钮：
```tsx
              <Button className="w-full rounded-full text-base" size="lg">
                🎬 应征项目
              </Button>
```
替换为：
```tsx
              {getApplyButton()}
```

- [ ] **Step 4: 在 return 的最外层 div 末尾（`</div>` 前）添加应征弹窗**

```tsx
        <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>应征项目</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label>应征留言</Label>
                <Textarea
                  className="mt-1" rows={3}
                  placeholder="介绍你的优势、创作思路..."
                  value={applyMessage} onChange={e => setApplyMessage(e.target.value)}
                />
              </div>
              <div>
                <Label>期望报酬</Label>
                <Input className="mt-1" placeholder="如：¥5000" value={expectedPrice} onChange={e => setExpectedPrice(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setApplyOpen(false)}>取消</Button>
              <Button onClick={handleApply} disabled={!applyMessage || !expectedPrice || applying}>
                {applying ? "提交中..." : "确认应征"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
```

- [ ] **Step 5: 确认编译通过**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add src/pages/CommissionDetail.tsx
git commit -m "feat: add auth-aware apply button to CommissionDetail"
```

---

## Task 16: 更新 Commissions 列表页

**Files:**
- Modify: `src/pages/Commissions.tsx`

- [ ] **Step 1: 使 Commissions 页面使用 commissionService 并添加甲方发布入口**

将整个文件替换为：

```tsx
// src/pages/Commissions.tsx
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import CommissionCard from "@/components/CommissionCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { getCommissions } from "@/services/commissionService";

export default function Commissions() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: commissions = [], isLoading } = useQuery({
    queryKey: ['commissions'],
    queryFn: getCommissions,
  });

  const canPost = user?.role === 'client' && user.verificationStatus === 'verified';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <Tabs defaultValue="commercial">
            <TabsList className="bg-transparent gap-4 p-0">
              <TabsTrigger value="commercial" className="text-base data-[state=active]:text-secondary data-[state=active]:border-b-2 data-[state=active]:border-secondary rounded-none bg-transparent px-0 pb-2">商业</TabsTrigger>
              <TabsTrigger value="personal" className="text-base data-[state=active]:text-secondary data-[state=active]:border-b-2 data-[state=active]:border-secondary rounded-none bg-transparent px-0 pb-2">个人</TabsTrigger>
            </TabsList>
          </Tabs>
          {canPost && (
            <Button className="rounded-full" size="sm" onClick={() => navigate('/commissions/new')}>+ 发布项目</Button>
          )}
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <Select><SelectTrigger className="w-32"><SelectValue placeholder="最新发布" /></SelectTrigger><SelectContent><SelectItem value="newest">最新发布</SelectItem><SelectItem value="ending">即将截止</SelectItem></SelectContent></Select>
          <Select><SelectTrigger className="w-36"><SelectValue placeholder="类型与风格" /></SelectTrigger><SelectContent><SelectItem value="all">全部</SelectItem><SelectItem value="commercial">商业宣传片</SelectItem><SelectItem value="short">创意短片</SelectItem><SelectItem value="concept">概念影像</SelectItem><SelectItem value="video">短视频</SelectItem></SelectContent></Select>
          <Select><SelectTrigger className="w-36"><SelectValue placeholder="报酬区间不限" /></SelectTrigger><SelectContent><SelectItem value="all">不限</SelectItem><SelectItem value="low">1k以下</SelectItem><SelectItem value="mid">1k-5k</SelectItem><SelectItem value="high">5k以上</SelectItem></SelectContent></Select>
          <Select><SelectTrigger className="w-40"><SelectValue placeholder="交付日期不限" /></SelectTrigger><SelectContent><SelectItem value="all">不限</SelectItem><SelectItem value="week">一周内</SelectItem><SelectItem value="month">一月内</SelectItem></SelectContent></Select>
        </div>

        {isLoading ? (
          <p className="text-center text-muted-foreground py-16">加载中...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {commissions.map((c) => (
              <CommissionCard key={c.id} {...c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 确认编译通过**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: 运行所有测试**

```bash
npx vitest run
```
Expected: 全部 PASS

- [ ] **Step 4: Commit**

```bash
git add src/pages/Commissions.tsx
git commit -m "feat: migrate Commissions page to use commissionService, add client post entry"
```

---

## 自检：Spec 覆盖确认

| Spec 要求 | 覆盖任务 |
|-----------|----------|
| 用户注册（手机号+角色） | Task 9 |
| 用户登录 | Task 8 |
| AIGCer 资质表单 + 作品集上传 | Task 10 |
| AIGCer mock 3秒自动审核通过 | Task 10 |
| 甲方实名/企业认证 | Task 11 |
| AuthContext + localStorage 持久化 | Task 5 |
| Mock Service 层 | Tasks 2-4 |
| 甲方工作台 /dashboard/client | Task 12 |
| AIGCer 工作台 /dashboard/aigcer | Task 13 |
| 发布新项目 /commissions/new | Task 14 |
| 应征按钮权限控制 | Task 15 |
| Navbar 登录态感知 | Task 7 |
| Commissions 页发布入口 | Task 16 |
| 新路由注册 | Task 6 |
