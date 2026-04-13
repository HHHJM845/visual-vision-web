# Mobile App (Expo) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a cross-platform React Native app (iOS + Android + Web) for the AI 影视承制平台, sharing the existing Supabase service layer, runnable via `npx expo run:ios` in Xcode on macOS.

**Architecture:** New `mobile/` directory alongside the existing web project. Expo Managed Workflow with expo-router v3 for file-based tab navigation, NativeWind v4 for Tailwind-style CSS, shared service layer copied from `../src/` with path aliases replaced by relative imports and env vars adapted.

**Tech Stack:** Expo SDK 51, expo-router v3, NativeWind v4, @supabase/supabase-js, @react-native-async-storage/async-storage, @tanstack/react-query v5, TypeScript

> ⚠️ **macOS requirement:** `npx expo run:ios` and Xcode only work on macOS. During Windows development, use `npx expo start --web` or `npx expo start` with Expo Go app on a phone.

---

## File Map

**Created in `mobile/`:**

```
mobile/
  app.json                         Expo config (name, bundleId, icons)
  package.json                     Dependencies
  tsconfig.json                    TS config with path aliases
  babel.config.js                  NativeWind babel transform
  tailwind.config.js               NativeWind colors + content paths
  metro.config.js                  Metro bundler config for NativeWind
  global.css                       Tailwind directives entry
  .env                             EXPO_PUBLIC_SUPABASE_* vars

  shared/
    lib/supabase.ts                Supabase client (AsyncStorage, EXPO_PUBLIC_*)
    services/authService.ts        Auth (relative imports, no @/ aliases)
    services/commissionService.ts  Commission CRUD (relative imports)
    types/commission.ts            Copied as-is
    types/user.ts                  Copied as-is
    contexts/AuthContext.tsx       Copied as-is (no router deps)

  app/
    _layout.tsx                    Root layout: QueryClient + AuthProvider + auth guard
    (auth)/
      _layout.tsx                  Auth stack layout
      login.tsx                    Email + password login screen
      register.tsx                 Register screen (email, nickname, role)
    (tabs)/
      _layout.tsx                  Bottom tab bar (5 tabs)
      index.tsx                    Home: dual-role dashboard
      commissions.tsx              Browse commissions with filters
      gallery.tsx                  AI artwork gallery (2-col waterfall)
      messages.tsx                 Message categories + empty state
      profile.tsx                  User profile + stats + logout
    commissions/
      [id].tsx                     Commission detail + apply / manage applicants
      new.tsx                      Publish new commission (Client only)
    onboarding/
      aigcer.tsx                   Aigcer certification form
      client.tsx                   Client certification form

  components/
    CommissionCard.tsx             Commission card (RN pressable)
    EmptyState.tsx                 Mascot illustration + text + CTA button
    CertificationBanner.tsx        Top banner for uncertified users
    StatsGrid.tsx                  4-cell stats row
    FilterChips.tsx                Horizontal scrollable filter chips
```

---

## Task 1: Initialize Expo Project

**Files:**
- Create: `mobile/` (directory via `npx create-expo-app`)

- [ ] **Step 1: Run create-expo-app from the repo root**

```bash
cd /c/Users/oldch/Desktop/visual-vision-web-main
npx create-expo-app mobile --template blank-typescript
```

Expected: `mobile/` directory created with `app.json`, `package.json`, `App.tsx`, `tsconfig.json`.

- [ ] **Step 2: Delete the default App.tsx (expo-router replaces it)**

```bash
rm mobile/App.tsx
```

- [ ] **Step 3: Commit**

```bash
git add mobile/
git commit -m "feat(mobile): init Expo blank-typescript project"
```

---

## Task 2: Install Dependencies

**Files:**
- Modify: `mobile/package.json`

- [ ] **Step 1: Install all dependencies**

```bash
cd mobile
npx expo install expo-router expo-secure-store expo-font expo-splash-screen expo-status-bar react-native-safe-area-context react-native-screens @react-native-async-storage/async-storage
npm install @supabase/supabase-js @tanstack/react-query nativewind tailwindcss react-native-url-polyfill
npm install --save-dev @types/react
```

- [ ] **Step 2: Verify package.json has these entries**

Check `mobile/package.json` dependencies include:
- `expo-router`
- `nativewind`
- `tailwindcss`
- `@supabase/supabase-js`
- `@tanstack/react-query`
- `@react-native-async-storage/async-storage`

- [ ] **Step 3: Commit**

```bash
git add mobile/package.json mobile/package-lock.json
git commit -m "feat(mobile): install expo-router, nativewind, supabase, react-query"
```

---

## Task 3: Configure Expo, TypeScript, NativeWind, Metro

**Files:**
- Create/Modify: `mobile/app.json`
- Create: `mobile/babel.config.js`
- Create: `mobile/tailwind.config.js`
- Create: `mobile/metro.config.js`
- Create: `mobile/global.css`
- Modify: `mobile/tsconfig.json`

- [ ] **Step 1: Write `mobile/app.json`**

```json
{
  "expo": {
    "name": "AI影视承制",
    "slug": "visual-vision-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "scheme": "visualvision",
    "userInterfaceStyle": "light",
    "splash": {
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.visualvision.mobile"
    },
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#ffffff"
      },
      "package": "com.visualvision.mobile"
    },
    "web": {
      "bundler": "metro"
    },
    "plugins": [
      "expo-router",
      "expo-secure-store"
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

- [ ] **Step 2: Write `mobile/babel.config.js`**

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
```

- [ ] **Step 3: Write `mobile/tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#1DA1F2',
        'primary-dark': '#0d8bd9',
        surface: '#F5F7FA',
        card: '#FFFFFF',
        'text-main': '#1A1A2E',
        'text-sub': '#8A8A9A',
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 4: Write `mobile/metro.config.js`**

```js
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });
```

- [ ] **Step 5: Write `mobile/global.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 6: Write `mobile/tsconfig.json`**

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@shared/*": ["./shared/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.d.ts", "expo-env.d.ts"]
}
```

- [ ] **Step 7: Create `mobile/.env` (copy values from web project's .env)**

```
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

> Copy the values from `../visual-vision-web-main/.env` (`VITE_SUPABASE_URL` → `EXPO_PUBLIC_SUPABASE_URL`, same for key).

- [ ] **Step 8: Commit**

```bash
git add mobile/app.json mobile/babel.config.js mobile/tailwind.config.js mobile/metro.config.js mobile/global.css mobile/tsconfig.json
git commit -m "feat(mobile): configure expo-router, nativewind, metro, typescript"
```

---

## Task 4: Set Up Shared Directory Structure

**Files:**
- Create: `mobile/shared/lib/`, `mobile/shared/services/`, `mobile/shared/types/`, `mobile/shared/contexts/`

- [ ] **Step 1: Create directory tree**

```bash
mkdir -p mobile/shared/lib mobile/shared/services mobile/shared/types mobile/shared/contexts
```

- [ ] **Step 2: Copy type files verbatim**

```bash
cp src/types/commission.ts mobile/shared/types/commission.ts
cp src/types/user.ts mobile/shared/types/user.ts
```

- [ ] **Step 3: Commit**

```bash
git add mobile/shared/
git commit -m "feat(mobile): scaffold shared/ directory, copy type definitions"
```

---

## Task 5: Adapt supabase.ts for Expo

**Files:**
- Create: `mobile/shared/lib/supabase.ts`

- [ ] **Step 1: Write `mobile/shared/lib/supabase.ts`**

```ts
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase env vars. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to mobile/.env'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add mobile/shared/lib/supabase.ts
git commit -m "feat(mobile): adapt supabase client for React Native (AsyncStorage)"
```

---

## Task 6: Adapt authService and commissionService

**Files:**
- Create: `mobile/shared/services/authService.ts`
- Create: `mobile/shared/services/commissionService.ts`

The only changes from the web versions are replacing `@/` path aliases with relative imports.

- [ ] **Step 1: Write `mobile/shared/services/authService.ts`**

```ts
import { supabase } from '../lib/supabase';
import { User, UserRole, PortfolioItem } from '../types/user';

export function mapProfile(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    email: row.email as string,
    phone: (row.phone as string) || '',
    nickname: row.nickname as string,
    role: row.role as UserRole,
    verificationStatus: row.verification_status as User['verificationStatus'],
    clientVerificationType: row.client_verification_type as User['clientVerificationType'],
    avatar: row.avatar_url as string | undefined,
    createdAt: row.created_at as string,
    aigcerProfile: row.aigcer_bio
      ? {
          bio: row.aigcer_bio as string,
          styles: (row.aigcer_styles as string[]) || [],
          tools: (row.aigcer_tools as string[]) || [],
          portfolio: (row.aigcer_portfolio as PortfolioItem[]) || [],
        }
      : undefined,
  };
}

export interface RegisterParams {
  email: string;
  password: string;
  nickname: string;
  role: UserRole;
}

export interface LoginParams {
  account: string;
  password: string;
}

export async function register(params: RegisterParams): Promise<User> {
  const { data, error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: { data: { nickname: params.nickname, role: params.role } },
  });
  if (error) {
    throw new Error(error.message === 'User already registered' ? '该邮箱已注册' : error.message);
  }
  await new Promise((r) => setTimeout(r, 500));
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user!.id)
    .single();
  return mapProfile(profile);
}

export async function login(params: LoginParams): Promise<User> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: params.account,
    password: params.password,
  });
  if (error) throw new Error('账号或密码错误');
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();
  if (profileError) throw new Error(profileError.message);
  return mapProfile(profile);
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  if (!profile) return null;
  return mapProfile(profile);
}

export async function updateStoredUser(
  userId: string,
  updates: Record<string, unknown>,
): Promise<User> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapProfile(data);
}
```

- [ ] **Step 2: Write `mobile/shared/services/commissionService.ts`**

```ts
import { supabase } from '../lib/supabase';
import { Commission, Application } from '../types/commission';

function mapCommission(row: Record<string, unknown>): Commission {
  return {
    id: row.id as number,
    title: row.title as string,
    description: row.description as string,
    tag: row.tag as Commission['tag'],
    reputation: (row.reputation as string) || '信誉优良',
    deadline: row.deadline as string,
    category: row.category as string,
    applicants: (row.applicants as number) || 0,
    priceRange: row.price_range as string,
    authorId: (row.author_id as string) || 'mock',
    authorNickname: row.author_nickname as string,
    authorVerification: (row.author_verification as Commission['authorVerification']) || 'none',
    purpose: row.purpose as Commission['purpose'],
    rating: row.rating as number,
    reviews: row.reviews as number,
    completionRate: row.completion_rate as string,
    handlingFee: row.handling_fee as string,
  };
}

function mapApplication(row: Record<string, unknown>): Application {
  return {
    id: row.id as string,
    commissionId: row.commission_id as number,
    aigcerId: row.aigcer_id as string,
    aigcerNickname: row.aigcer_nickname as string,
    message: row.message as string,
    expectedPrice: row.expected_price as string,
    status: row.status as Application['status'],
    appliedAt: row.applied_at as string,
  };
}

export async function getCommissions(): Promise<Commission[]> {
  const { data, error } = await supabase
    .from('commissions')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(mapCommission);
}

export async function getCommissionById(id: number): Promise<Commission | null> {
  const { data, error } = await supabase
    .from('commissions')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return mapCommission(data);
}

export async function getCommissionsByAuthor(authorId: string): Promise<Commission[]> {
  const { data, error } = await supabase
    .from('commissions')
    .select('*')
    .eq('author_id', authorId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(mapCommission);
}

export async function getApplicationsByAigcer(aigcerId: string): Promise<Application[]> {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('aigcer_id', aigcerId)
    .order('applied_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(mapApplication);
}

export async function getApplicationsByCommission(commissionId: number): Promise<Application[]> {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('commission_id', commissionId)
    .order('applied_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(mapApplication);
}

export async function applyForCommission(
  commissionId: number,
  aigcerId: string,
  aigcerNickname: string,
  message: string,
  expectedPrice: string,
): Promise<Application> {
  const { data, error } = await supabase
    .from('applications')
    .insert({
      commission_id: commissionId,
      aigcer_id: aigcerId,
      aigcer_nickname: aigcerNickname,
      message,
      expected_price: expectedPrice,
      status: 'pending',
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapApplication(data);
}

export async function updateApplicationStatus(
  applicationId: string,
  status: Application['status'],
): Promise<void> {
  const { error } = await supabase
    .from('applications')
    .update({ status })
    .eq('id', applicationId);
  if (error) throw new Error(error.message);
}

export async function createCommission(
  params: Omit<Commission, 'id' | 'applicants' | 'rating' | 'reviews' | 'completionRate' | 'handlingFee'>,
): Promise<Commission> {
  const { data, error } = await supabase
    .from('commissions')
    .insert({
      title: params.title,
      description: params.description,
      category: params.category,
      price_range: params.priceRange,
      deadline: params.deadline,
      purpose: params.purpose,
      author_id: params.authorId,
      author_nickname: params.authorNickname,
      author_verification: params.authorVerification,
      tag: params.tag,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapCommission(data);
}
```

- [ ] **Step 3: Commit**

```bash
git add mobile/shared/services/
git commit -m "feat(mobile): adapt authService and commissionService (relative imports)"
```

---

## Task 7: AuthContext for Mobile

**Files:**
- Create: `mobile/shared/contexts/AuthContext.tsx`

The web AuthContext has no router dependencies — copy with only import path fixes.

- [ ] **Step 1: Write `mobile/shared/contexts/AuthContext.tsx`**

```tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/user';
import { getCurrentUser, logout as serviceLogout } from '../services/authService';
import { supabase } from '../lib/supabase';

interface AuthContextValue {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const u = await getCurrentUser();
        setUser(u);
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const u = await getCurrentUser();
          setUser(u);
        } else {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function logout() {
    await serviceLogout();
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
git add mobile/shared/contexts/AuthContext.tsx
git commit -m "feat(mobile): add AuthContext (no router deps, relative imports)"
```

---

## Task 8: Shared UI Components

**Files:**
- Create: `mobile/components/EmptyState.tsx`
- Create: `mobile/components/CertificationBanner.tsx`
- Create: `mobile/components/StatsGrid.tsx`
- Create: `mobile/components/FilterChips.tsx`
- Create: `mobile/components/CommissionCard.tsx`

- [ ] **Step 1: Write `mobile/components/EmptyState.tsx`**

```tsx
import { View, Text, TouchableOpacity } from 'react-native';

interface Props {
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export default function EmptyState({ title, subtitle, ctaLabel, onCta }: Props) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <View className="w-24 h-24 rounded-full bg-blue-100 items-center justify-center mb-4">
        <Text className="text-4xl">🎬</Text>
      </View>
      <Text className="text-lg font-semibold text-text-main text-center mb-2">{title}</Text>
      {subtitle && (
        <Text className="text-sm text-text-sub text-center mb-6">{subtitle}</Text>
      )}
      {ctaLabel && onCta && (
        <TouchableOpacity
          onPress={onCta}
          className="bg-primary px-8 py-3 rounded-full"
        >
          <Text className="text-white font-semibold">{ctaLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
```

- [ ] **Step 2: Write `mobile/components/CertificationBanner.tsx`**

```tsx
import { View, Text, TouchableOpacity } from 'react-native';

interface Props {
  role: 'aigcer' | 'client';
  onPress: () => void;
}

export default function CertificationBanner({ role, onPress }: Props) {
  const label = role === 'aigcer' ? '完成AI制作者认证，接受委托' : '完成认证，发布承制项目';
  return (
    <TouchableOpacity
      onPress={onPress}
      className="mx-4 mb-4 bg-primary rounded-xl p-4 flex-row items-center justify-between"
    >
      <View className="flex-1">
        <Text className="text-white font-bold text-sm">认证指南</Text>
        <Text className="text-blue-100 text-xs mt-0.5">{label}</Text>
      </View>
      <Text className="text-white text-lg">→</Text>
    </TouchableOpacity>
  );
}
```

- [ ] **Step 3: Write `mobile/components/StatsGrid.tsx`**

```tsx
import { View, Text } from 'react-native';

interface Stat {
  value: string | number;
  label: string;
}

export default function StatsGrid({ stats }: { stats: Stat[] }) {
  return (
    <View className="flex-row mx-4 mb-4 gap-2">
      {stats.map((s) => (
        <View key={s.label} className="flex-1 bg-card rounded-xl p-3 items-center shadow-sm">
          <Text className="text-xl font-bold text-primary">{s.value}</Text>
          <Text className="text-xs text-text-sub mt-0.5">{s.label}</Text>
        </View>
      ))}
    </View>
  );
}
```

- [ ] **Step 4: Write `mobile/components/FilterChips.tsx`**

```tsx
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
}

export default function FilterChips({ options, selected, onSelect }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 mb-3">
      <View className="flex-row gap-2">
        {options.map((opt) => (
          <TouchableOpacity
            key={opt}
            onPress={() => onSelect(opt)}
            className={`px-3 py-1.5 rounded-full border ${
              selected === opt
                ? 'bg-primary border-primary'
                : 'bg-card border-gray-200'
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                selected === opt ? 'text-white' : 'text-text-main'
              }`}
            >
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
```

- [ ] **Step 5: Write `mobile/components/CommissionCard.tsx`**

```tsx
import { View, Text, TouchableOpacity } from 'react-native';
import { Commission } from '@shared/types/commission';

interface Props {
  commission: Commission;
  onPress: () => void;
}

const TAG_COLORS: Record<string, string> = {
  '企业认证': 'bg-yellow-100 text-yellow-700',
  '实名认证': 'bg-blue-100 text-blue-700',
  '未认证': 'bg-gray-100 text-gray-500',
};

export default function CommissionCard({ commission, onPress }: Props) {
  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(commission.deadline).getTime() - Date.now()) / 86400000),
  );

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-card rounded-xl p-4 mb-3 mx-4 shadow-sm border border-gray-100"
    >
      <View className="flex-row items-start justify-between mb-2">
        <Text className="text-base font-semibold text-text-main flex-1 mr-2" numberOfLines={1}>
          {commission.title}
        </Text>
        <View className={`px-2 py-0.5 rounded-full ${TAG_COLORS[commission.tag] ?? 'bg-gray-100 text-gray-500'}`}>
          <Text className="text-xs">{commission.tag}</Text>
        </View>
      </View>
      <Text className="text-sm text-text-sub mb-3" numberOfLines={2}>
        {commission.description}
      </Text>
      <View className="flex-row justify-between">
        <Text className="text-sm font-medium text-primary">{commission.priceRange}</Text>
        <Text className="text-xs text-text-sub">{daysLeft > 0 ? `剩余 ${daysLeft} 天` : '已截止'}</Text>
      </View>
      <View className="flex-row mt-2 items-center">
        <Text className="text-xs text-text-sub mr-3">{commission.category}</Text>
        <Text className="text-xs text-text-sub">{commission.applicants} 人已申请</Text>
      </View>
    </TouchableOpacity>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add mobile/components/
git commit -m "feat(mobile): add shared UI components (EmptyState, Banner, StatsGrid, FilterChips, CommissionCard)"
```

---

## Task 9: Root Layout with Auth Guard

**Files:**
- Create: `mobile/app/_layout.tsx`

- [ ] **Step 1: Write `mobile/app/_layout.tsx`**

```tsx
import '../global.css';
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@shared/contexts/AuthContext';

const queryClient = new QueryClient();

function AuthGuard() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const inAuth = segments[0] === '(auth)';
    if (!user && !inAuth) {
      router.replace('/(auth)/login');
    } else if (user && inAuth) {
      router.replace('/(tabs)/');
    }
  }, [user, isLoading, segments]);

  return null;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <AuthProvider>
          <AuthGuard />
          <Stack screenOptions={{ headerShown: false }} />
        </AuthProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add mobile/app/_layout.tsx
git commit -m "feat(mobile): root layout with auth guard, QueryClient, SafeAreaProvider"
```

---

## Task 10: Login and Register Screens

**Files:**
- Create: `mobile/app/(auth)/_layout.tsx`
- Create: `mobile/app/(auth)/login.tsx`
- Create: `mobile/app/(auth)/register.tsx`

- [ ] **Step 1: Write `mobile/app/(auth)/_layout.tsx`**

```tsx
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

- [ ] **Step 2: Write `mobile/app/(auth)/login.tsx`**

```tsx
import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { login } from '@shared/services/authService';
import { useAuth } from '@shared/contexts/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('提示', '请填写邮箱和密码');
      return;
    }
    setLoading(true);
    try {
      const user = await login({ account: email, password });
      setUser(user);
      router.replace('/(tabs)/');
    } catch (e: unknown) {
      Alert.alert('登录失败', e instanceof Error ? e.message : '未知错误');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-surface"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 justify-center px-6 py-12">
          <Text className="text-3xl font-bold text-text-main mb-2">欢迎回来</Text>
          <Text className="text-text-sub mb-8">AI 影视承制平台</Text>

          <Text className="text-sm font-medium text-text-main mb-1">邮箱</Text>
          <TextInput
            className="bg-card border border-gray-200 rounded-xl px-4 py-3 mb-4 text-text-main"
            placeholder="输入邮箱地址"
            placeholderTextColor="#8A8A9A"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text className="text-sm font-medium text-text-main mb-1">密码</Text>
          <TextInput
            className="bg-card border border-gray-200 rounded-xl px-4 py-3 mb-6 text-text-main"
            placeholder="输入密码"
            placeholderTextColor="#8A8A9A"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            className={`rounded-full py-3.5 items-center mb-4 ${loading ? 'bg-blue-300' : 'bg-primary'}`}
          >
            <Text className="text-white font-semibold text-base">
              {loading ? '登录中...' : '登录'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(auth)/register')} className="items-center">
            <Text className="text-text-sub">
              还没有账号？<Text className="text-primary font-medium">立即注册</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
```

- [ ] **Step 3: Write `mobile/app/(auth)/register.tsx`**

```tsx
import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { register } from '@shared/services/authService';
import { useAuth } from '@shared/contexts/AuthContext';
import { UserRole } from '@shared/types/user';

export default function RegisterScreen() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [role, setRole] = useState<UserRole>('client');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!email || !password || !nickname) {
      Alert.alert('提示', '请填写所有字段');
      return;
    }
    setLoading(true);
    try {
      const user = await register({ email, password, nickname, role });
      setUser(user);
      router.replace(role === 'aigcer' ? '/onboarding/aigcer' : '/onboarding/client');
    } catch (e: unknown) {
      Alert.alert('注册失败', e instanceof Error ? e.message : '未知错误');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-surface"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 justify-center px-6 py-12">
          <Text className="text-3xl font-bold text-text-main mb-2">创建账号</Text>
          <Text className="text-text-sub mb-8">加入 AI 影视承制平台</Text>

          <Text className="text-sm font-medium text-text-main mb-1">昵称</Text>
          <TextInput
            className="bg-card border border-gray-200 rounded-xl px-4 py-3 mb-4 text-text-main"
            placeholder="你的昵称"
            placeholderTextColor="#8A8A9A"
            value={nickname}
            onChangeText={setNickname}
          />

          <Text className="text-sm font-medium text-text-main mb-1">邮箱</Text>
          <TextInput
            className="bg-card border border-gray-200 rounded-xl px-4 py-3 mb-4 text-text-main"
            placeholder="邮箱地址"
            placeholderTextColor="#8A8A9A"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text className="text-sm font-medium text-text-main mb-1">密码</Text>
          <TextInput
            className="bg-card border border-gray-200 rounded-xl px-4 py-3 mb-4 text-text-main"
            placeholder="至少 6 位"
            placeholderTextColor="#8A8A9A"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Text className="text-sm font-medium text-text-main mb-2">我的角色</Text>
          <View className="flex-row gap-3 mb-6">
            {(['client', 'aigcer'] as UserRole[]).map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => setRole(r)}
                className={`flex-1 border rounded-xl py-3 items-center ${
                  role === r ? 'bg-primary border-primary' : 'bg-card border-gray-200'
                }`}
              >
                <Text className={`font-medium ${role === r ? 'text-white' : 'text-text-main'}`}>
                  {r === 'client' ? '🎬 委托方' : '🎨 AI制作者'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={handleRegister}
            disabled={loading}
            className={`rounded-full py-3.5 items-center mb-4 ${loading ? 'bg-blue-300' : 'bg-primary'}`}
          >
            <Text className="text-white font-semibold text-base">
              {loading ? '注册中...' : '注册'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} className="items-center">
            <Text className="text-text-sub">
              已有账号？<Text className="text-primary font-medium">返回登录</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add mobile/app/(auth)/
git commit -m "feat(mobile): login and register screens"
```

---

## Task 11: Bottom Tab Navigator

**Files:**
- Create: `mobile/app/(tabs)/_layout.tsx`

- [ ] **Step 1: Write `mobile/app/(tabs)/_layout.tsx`**

```tsx
import { Tabs } from 'expo-router';
import { Text } from 'react-native';

function Icon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#F0F0F0',
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#1DA1F2',
        tabBarInactiveTintColor: '#8A8A9A',
        tabBarLabelStyle: { fontSize: 10, marginTop: -2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '首页',
          tabBarIcon: ({ focused }) => <Icon emoji="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="commissions"
        options={{
          title: '项目',
          tabBarIcon: ({ focused }) => <Icon emoji="🎬" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="gallery"
        options={{
          title: '作品',
          tabBarIcon: ({ focused }) => <Icon emoji="🖼️" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: '消息',
          tabBarIcon: ({ focused }) => <Icon emoji="💬" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '我的',
          tabBarIcon: ({ focused }) => <Icon emoji="👤" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add mobile/app/(tabs)/_layout.tsx
git commit -m "feat(mobile): bottom tab navigator (5 tabs)"
```

---

## Task 12: Home Screen (Dual-Role Dashboard)

**Files:**
- Create: `mobile/app/(tabs)/index.tsx`

- [ ] **Step 1: Write `mobile/app/(tabs)/index.tsx`**

```tsx
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@shared/contexts/AuthContext';
import { getApplicationsByAigcer, getCommissionsByAuthor } from '@shared/services/commissionService';
import StatsGrid from '../../components/StatsGrid';
import CertificationBanner from '../../components/CertificationBanner';
import EmptyState from '../../components/EmptyState';

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const { data: applications = [] } = useQuery({
    queryKey: ['applications', 'aigcer', user?.id],
    queryFn: () => getApplicationsByAigcer(user!.id),
    enabled: user?.role === 'aigcer',
  });

  const { data: commissions = [] } = useQuery({
    queryKey: ['commissions', 'author', user?.id],
    queryFn: () => getCommissionsByAuthor(user!.id),
    enabled: user?.role === 'client',
  });

  if (!user) return null;
  const isAigcer = user.role === 'aigcer';
  const needsCert = user.verificationStatus !== 'verified';

  const aigcerStats = [
    { value: applications.filter((a) => a.status === 'pending').length, label: '应征中' },
    { value: applications.filter((a) => a.status === 'accepted').length, label: '进行中' },
    { value: applications.filter((a) => a.status === 'rejected').length, label: '已完成' },
    { value: '¥0', label: '累计收入' },
  ];

  const clientStats = [
    { value: commissions.length, label: '已发布' },
    { value: commissions.filter((c) => new Date(c.deadline) >= new Date() && c.applicants === 0).length, label: '招募中' },
    { value: commissions.filter((c) => new Date(c.deadline) >= new Date() && c.applicants > 0).length, label: '进行中' },
    { value: 0, label: '待验收' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <ScrollView>
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-4">
          <View>
            <Text className="text-xl font-bold text-text-main">我的工作台</Text>
            <Text className="text-sm text-text-sub">{user.nickname}</Text>
          </View>
          {!isAigcer && user.verificationStatus === 'verified' && (
            <TouchableOpacity
              onPress={() => router.push('/commissions/new')}
              className="bg-primary rounded-full px-4 py-2"
            >
              <Text className="text-white text-sm font-medium">+ 发布项目</Text>
            </TouchableOpacity>
          )}
          {isAigcer && (
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/commissions')}
              className="border border-primary rounded-full px-4 py-2"
            >
              <Text className="text-primary text-sm font-medium">找项目</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Certification banner */}
        {needsCert && (
          <CertificationBanner
            role={user.role}
            onPress={() =>
              router.push(isAigcer ? '/onboarding/aigcer' : '/onboarding/client')
            }
          />
        )}

        {/* Stats */}
        <StatsGrid stats={isAigcer ? aigcerStats : clientStats} />

        {/* List */}
        <View className="px-4 mb-2">
          <Text className="text-base font-semibold text-text-main mb-3">
            {isAigcer ? '我的申请' : '我的项目'}
          </Text>
        </View>

        {isAigcer && applications.length === 0 && (
          <EmptyState
            title="还没有申请记录"
            subtitle="去项目广场找找合适的委托吧"
            ctaLabel="浏览项目"
            onCta={() => router.push('/(tabs)/commissions')}
          />
        )}
        {!isAigcer && commissions.length === 0 && (
          <EmptyState
            title="还没有发布项目"
            subtitle={needsCert ? '完成认证后即可发布' : '发布你的第一个承制项目'}
            ctaLabel={needsCert ? '去认证' : '+ 发布项目'}
            onCta={() =>
              needsCert
                ? router.push('/onboarding/client')
                : router.push('/commissions/new')
            }
          />
        )}

        {isAigcer &&
          applications.map((app) => (
            <TouchableOpacity
              key={app.id}
              onPress={() => router.push(`/commissions/${app.commissionId}`)}
              className="mx-4 mb-3 bg-card rounded-xl p-4 shadow-sm border border-gray-100"
            >
              <View className="flex-row justify-between mb-1">
                <Text className="font-medium text-text-main flex-1 mr-2" numberOfLines={1}>
                  项目 #{app.commissionId}
                </Text>
                <Text className={`text-xs px-2 py-0.5 rounded-full ${
                  app.status === 'accepted'
                    ? 'bg-green-100 text-green-700'
                    : app.status === 'rejected'
                    ? 'bg-red-100 text-red-600'
                    : 'bg-blue-100 text-blue-600'
                }`}>
                  {app.status === 'accepted' ? '已接受' : app.status === 'rejected' ? '未通过' : '审核中'}
                </Text>
              </View>
              <Text className="text-sm text-text-sub" numberOfLines={2}>{app.message}</Text>
              <Text className="text-sm font-medium text-primary mt-1">{app.expectedPrice}</Text>
            </TouchableOpacity>
          ))}

        {!isAigcer &&
          commissions.map((c) => (
            <TouchableOpacity
              key={c.id}
              onPress={() => router.push(`/commissions/${c.id}`)}
              className="mx-4 mb-3 bg-card rounded-xl p-4 shadow-sm border border-gray-100"
            >
              <Text className="font-medium text-text-main mb-1" numberOfLines={1}>{c.title}</Text>
              <View className="flex-row justify-between">
                <Text className="text-sm text-primary">{c.priceRange}</Text>
                <Text className="text-xs text-text-sub">{c.applicants} 人申请</Text>
              </View>
            </TouchableOpacity>
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add mobile/app/(tabs)/index.tsx
git commit -m "feat(mobile): home screen dual-role dashboard"
```

---

## Task 13: Commissions List Screen

**Files:**
- Create: `mobile/app/(tabs)/commissions.tsx`

- [ ] **Step 1: Write `mobile/app/(tabs)/commissions.tsx`**

```tsx
import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@shared/contexts/AuthContext';
import { getCommissions } from '@shared/services/commissionService';
import CommissionCard from '../../components/CommissionCard';
import FilterChips from '../../components/FilterChips';
import EmptyState from '../../components/EmptyState';

const PURPOSES = ['全部', '商业', '个人'];
const CATEGORIES = ['全部', '商业宣传片', '创意短片', '概念影像', '短视频'];

export default function CommissionsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [purpose, setPurpose] = useState('全部');
  const [category, setCategory] = useState('全部');
  const [search, setSearch] = useState('');

  const { data: all = [], isLoading, refetch } = useQuery({
    queryKey: ['commissions'],
    queryFn: getCommissions,
  });

  const filtered = all.filter((c) => {
    if (purpose !== '全部' && !c.purpose.includes(purpose)) return false;
    if (category !== '全部' && c.category !== category) return false;
    if (search && !c.title.includes(search) && !c.description.includes(search)) return false;
    return true;
  });

  const canPost = user?.role === 'client' && user.verificationStatus === 'verified';

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 pt-2 pb-3">
        <Text className="text-xl font-bold text-text-main flex-1">项目广场</Text>
        {canPost && (
          <TouchableOpacity
            onPress={() => router.push('/commissions/new')}
            className="bg-primary rounded-full px-4 py-1.5"
          >
            <Text className="text-white text-sm font-medium">+ 发布</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search */}
      <View className="mx-4 mb-3 bg-card rounded-xl flex-row items-center px-3 border border-gray-100">
        <Text className="text-text-sub mr-2">🔍</Text>
        <TextInput
          className="flex-1 py-2.5 text-text-main text-sm"
          placeholder="搜索项目..."
          placeholderTextColor="#8A8A9A"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Purpose filter */}
      <FilterChips options={PURPOSES} selected={purpose} onSelect={setPurpose} />

      {/* Category filter */}
      <FilterChips options={CATEGORIES} selected={category} onSelect={setCategory} />

      {/* List */}
      {isLoading ? (
        <EmptyState title="加载中..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="暂无匹配项目"
          subtitle="换个筛选条件试试"
          ctaLabel="清除筛选"
          onCta={() => { setPurpose('全部'); setCategory('全部'); setSearch(''); }}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <CommissionCard
              commission={item}
              onPress={() => router.push(`/commissions/${item.id}`)}
            />
          )}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add mobile/app/(tabs)/commissions.tsx
git commit -m "feat(mobile): commissions list with search and filter"
```

---

## Task 14: Gallery Screen

**Files:**
- Create: `mobile/app/(tabs)/gallery.tsx`

- [ ] **Step 1: Write `mobile/app/(tabs)/gallery.tsx`**

```tsx
import { useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FilterChips from '../../components/FilterChips';

const { width } = Dimensions.get('window');
const COL_WIDTH = (width - 12 * 3) / 2;

const CATEGORIES = ['全部', '商业宣传片', '创意短片', '概念影像', '短视频'];
const STYLES = ['全部', '二次元风', '国风古典', '欧美写实'];

const MOCK_ARTWORKS = [
  { id: '1', imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&h=600&fit=crop', likes: 557, title: '星际漫游' },
  { id: '2', imageUrl: 'https://images.unsplash.com/photo-1611457194403-d3571b6a2924?w=400&h=500&fit=crop', likes: 118, title: '国风水墨' },
  { id: '3', imageUrl: 'https://images.unsplash.com/photo-1613376023733-0a73315d9b06?w=400&h=450&fit=crop', likes: 282, title: '赛博夜城' },
  { id: '4', imageUrl: 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=400&h=400&fit=crop', likes: 266, title: '未来都市' },
  { id: '5', imageUrl: 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=400&h=550&fit=crop', likes: 13, title: '概念影像' },
  { id: '6', imageUrl: 'https://images.unsplash.com/photo-1580477667995-2b94f01c9516?w=400&h=500&fit=crop', likes: 7, title: '魔法少女' },
  { id: '7', imageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&h=480&fit=crop', likes: 209, title: '科幻宣传片' },
  { id: '8', imageUrl: 'https://images.unsplash.com/photo-1578632292335-df3abbb0d586?w=400&h=520&fit=crop', likes: 55, title: '武侠世界' },
];

export default function GalleryScreen() {
  const [tab, setTab] = useState<'newest' | 'hot'>('newest');
  const [category, setCategory] = useState('全部');
  const [style, setStyle] = useState('全部');

  const sorted = tab === 'hot'
    ? [...MOCK_ARTWORKS].sort((a, b) => b.likes - a.likes)
    : MOCK_ARTWORKS;

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      {/* Header tabs */}
      <View className="flex-row px-4 pt-2 pb-3 gap-6">
        {(['newest', 'hot'] as const).map((t) => (
          <TouchableOpacity key={t} onPress={() => setTab(t)}>
            <Text className={`text-base font-semibold pb-1 ${
              tab === t
                ? 'text-primary border-b-2 border-primary'
                : 'text-text-sub'
            }`}>
              {t === 'newest' ? '最新推荐' : '七日热门'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FilterChips options={CATEGORIES} selected={category} onSelect={setCategory} />
      <FilterChips options={STYLES} selected={style} onSelect={setStyle} />

      {/* Waterfall 2-col */}
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ paddingHorizontal: 12, gap: 8 }}
        contentContainerStyle={{ paddingBottom: 20, gap: 8, paddingTop: 4 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{ width: COL_WIDTH }}
            className="bg-card rounded-xl overflow-hidden shadow-sm"
          >
            <Image
              source={{ uri: item.imageUrl }}
              style={{ width: COL_WIDTH, height: COL_WIDTH * 1.25 }}
              resizeMode="cover"
            />
            <View className="p-2 flex-row justify-between items-center">
              <Text className="text-xs text-text-main font-medium flex-1" numberOfLines={1}>
                {item.title}
              </Text>
              <Text className="text-xs text-text-sub">❤️ {item.likes}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add mobile/app/(tabs)/gallery.tsx
git commit -m "feat(mobile): gallery screen with 2-col waterfall"
```

---

## Task 15: Messages Screen

**Files:**
- Create: `mobile/app/(tabs)/messages.tsx`

- [ ] **Step 1: Write `mobile/app/(tabs)/messages.tsx`**

```tsx
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import EmptyState from '../../components/EmptyState';

const MESSAGE_CATEGORIES = [
  { key: 'system', emoji: '🔔', label: '系统通知', color: 'bg-blue-100' },
  { key: 'subscription', emoji: '📦', label: '订阅上新', color: 'bg-green-100' },
  { key: 'official', emoji: '📋', label: '官方推送', color: 'bg-purple-100', badge: 30 },
  { key: 'interaction', emoji: '💬', label: '互动消息', color: 'bg-pink-100' },
];

export default function MessagesScreen() {
  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <View className="px-4 pt-2 pb-3">
        <Text className="text-xl font-bold text-text-main">消息</Text>
      </View>

      {/* Category grid */}
      <View className="flex-row flex-wrap px-4 gap-3 mb-4">
        {MESSAGE_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            className="items-center"
            style={{ width: '22%' }}
          >
            <View className={`w-14 h-14 rounded-full ${cat.color} items-center justify-center mb-1 relative`}>
              <Text className="text-2xl">{cat.emoji}</Text>
              {cat.badge && (
                <View className="absolute top-0 right-0 bg-red-500 rounded-full w-5 h-5 items-center justify-center">
                  <Text className="text-white text-xs font-bold">{cat.badge}</Text>
                </View>
              )}
            </View>
            <Text className="text-xs text-text-main text-center">{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Conversations */}
      <ScrollView>
        <EmptyState
          title="没有正在进行的会话"
          subtitle="消息会在这里显示"
        />
      </ScrollView>
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add mobile/app/(tabs)/messages.tsx
git commit -m "feat(mobile): messages screen with category grid"
```

---

## Task 16: Profile Screen

**Files:**
- Create: `mobile/app/(tabs)/profile.tsx`

- [ ] **Step 1: Write `mobile/app/(tabs)/profile.tsx`**

```tsx
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@shared/contexts/AuthContext';

const CERT_LABEL: Record<string, string> = {
  verified: '✓ 已认证',
  pending: '⏳ 认证中',
  none: '未认证',
};
const CERT_CLASS: Record<string, string> = {
  verified: 'bg-blue-100 text-blue-700',
  pending: 'bg-yellow-100 text-yellow-700',
  none: 'bg-gray-100 text-gray-500',
};

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  if (!user) return null;

  const needsCert = user.verificationStatus !== 'verified';

  function handleLogout() {
    Alert.alert('退出登录', '确认退出吗？', [
      { text: '取消', style: 'cancel' },
      { text: '退出', style: 'destructive', onPress: logout },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      <ScrollView>
        {/* User info */}
        <View className="bg-card mx-4 mt-4 rounded-2xl p-5 shadow-sm">
          <View className="flex-row items-center mb-4">
            <View className="w-16 h-16 rounded-full bg-primary items-center justify-center mr-4">
              <Text className="text-2xl text-white font-bold">
                {user.nickname.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-text-main">{user.nickname}</Text>
              <View className="flex-row items-center gap-2 mt-1">
                <View className={`px-2 py-0.5 rounded-full ${CERT_CLASS[user.verificationStatus]}`}>
                  <Text className="text-xs">{CERT_LABEL[user.verificationStatus]}</Text>
                </View>
                <View className="px-2 py-0.5 rounded-full bg-gray-100">
                  <Text className="text-xs text-gray-600">
                    {user.role === 'aigcer' ? 'AI制作者' : '委托方'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Quick stats */}
          <View className="flex-row justify-around pt-4 border-t border-gray-100">
            {[
              { value: '0', label: '资金' },
              { value: '0', label: '赞过' },
              { value: '0', label: '徽章' },
              { value: '0', label: '足迹' },
            ].map((s) => (
              <View key={s.label} className="items-center">
                <Text className="text-base font-bold text-text-main">{s.value}</Text>
                <Text className="text-xs text-text-sub">{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Certification prompt */}
        {needsCert && (
          <TouchableOpacity
            onPress={() =>
              router.push(user.role === 'aigcer' ? '/onboarding/aigcer' : '/onboarding/client')
            }
            className="mx-4 mt-4 bg-card rounded-2xl p-4 shadow-sm border border-primary border-opacity-30"
          >
            <Text className="font-semibold text-text-main mb-1">尚未完成认证</Text>
            <Text className="text-sm text-text-sub mb-3">完成认证后可使用平台全部功能</Text>
            <View className="bg-primary rounded-full py-2.5 items-center">
              <Text className="text-white font-semibold">进行认证</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Menu items */}
        <View className="bg-card mx-4 mt-4 rounded-2xl shadow-sm overflow-hidden">
          {[
            { label: '💰 资金管理', onPress: () => {} },
            { label: '📋 我的项目', onPress: () => router.push('/(tabs)/commissions') },
            { label: '🖼️ 我的作品', onPress: () => router.push('/(tabs)/gallery') },
          ].map((item, i) => (
            <TouchableOpacity
              key={item.label}
              onPress={item.onPress}
              className={`px-5 py-4 flex-row justify-between items-center ${i > 0 ? 'border-t border-gray-100' : ''}`}
            >
              <Text className="text-text-main">{item.label}</Text>
              <Text className="text-text-sub">›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogout}
          className="mx-4 mt-4 mb-8 bg-card rounded-2xl py-4 items-center shadow-sm border border-red-100"
        >
          <Text className="text-red-500 font-medium">退出登录</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add mobile/app/(tabs)/profile.tsx
git commit -m "feat(mobile): profile screen with user stats, cert prompt, logout"
```

---

## Task 17: Commission Detail Screen

**Files:**
- Create: `mobile/app/commissions/[id].tsx`
- Create: `mobile/app/commissions/_layout.tsx`

- [ ] **Step 1: Write `mobile/app/commissions/_layout.tsx`**

```tsx
import { Stack } from 'expo-router';

export default function CommissionsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTintColor: '#1DA1F2',
        headerTitleStyle: { color: '#1A1A2E', fontWeight: '600' },
      }}
    />
  );
}
```

- [ ] **Step 2: Write `mobile/app/commissions/[id].tsx`**

```tsx
import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, Alert, Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@shared/contexts/AuthContext';
import {
  getCommissionById,
  getApplicationsByCommission,
  applyForCommission,
  updateApplicationStatus,
} from '@shared/services/commissionService';

export default function CommissionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const commissionId = Number(id);

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [message, setMessage] = useState('');
  const [price, setPrice] = useState('');

  const { data: commission } = useQuery({
    queryKey: ['commission', commissionId],
    queryFn: () => getCommissionById(commissionId),
  });

  const { data: applications = [] } = useQuery({
    queryKey: ['applications', 'commission', commissionId],
    queryFn: () => getApplicationsByCommission(commissionId),
    enabled: user?.role === 'client' && commission?.authorId === user?.id,
  });

  const applyMutation = useMutation({
    mutationFn: () =>
      applyForCommission(commissionId, user!.id, user!.nickname, message, price),
    onSuccess: () => {
      setShowApplyModal(false);
      setMessage('');
      setPrice('');
      qc.invalidateQueries({ queryKey: ['applications', 'aigcer', user?.id] });
      Alert.alert('申请成功', '等待委托方审核');
    },
    onError: (e: Error) => Alert.alert('申请失败', e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ appId, status }: { appId: string; status: 'accepted' | 'rejected' }) =>
      updateApplicationStatus(appId, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications', 'commission', commissionId] }),
  });

  if (!commission) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center">
        <Text className="text-text-sub">加载中...</Text>
      </SafeAreaView>
    );
  }

  const isAuthor = user?.id === commission.authorId;
  const isAigcer = user?.role === 'aigcer';
  const canApply = isAigcer && user?.verificationStatus === 'verified';
  const daysLeft = Math.max(0, Math.ceil(
    (new Date(commission.deadline).getTime() - Date.now()) / 86400000,
  ));

  return (
    <>
      <Stack.Screen options={{ title: commission.title }} />
      <SafeAreaView className="flex-1 bg-surface" edges={['bottom']}>
        <ScrollView contentContainerStyle={{ paddingBottom: canApply ? 100 : 20 }}>
          {/* Header card */}
          <View className="bg-card mx-4 mt-4 rounded-2xl p-5 shadow-sm">
            <View className="flex-row items-start justify-between mb-3">
              <Text className="text-lg font-bold text-text-main flex-1 mr-2">{commission.title}</Text>
              <View className="bg-blue-100 px-2 py-0.5 rounded-full">
                <Text className="text-xs text-blue-700">{commission.category}</Text>
              </View>
            </View>
            <Text className="text-text-sub text-sm mb-4">{commission.description}</Text>
            <View className="flex-row flex-wrap gap-4">
              <View>
                <Text className="text-xs text-text-sub">报酬</Text>
                <Text className="text-base font-bold text-primary">{commission.priceRange}</Text>
              </View>
              <View>
                <Text className="text-xs text-text-sub">截止</Text>
                <Text className="text-sm font-medium text-text-main">
                  {daysLeft > 0 ? `剩余 ${daysLeft} 天` : '已截止'}
                </Text>
              </View>
              <View>
                <Text className="text-xs text-text-sub">申请人数</Text>
                <Text className="text-sm font-medium text-text-main">{commission.applicants} 人</Text>
              </View>
              <View>
                <Text className="text-xs text-text-sub">用途</Text>
                <Text className="text-sm font-medium text-text-main">{commission.purpose}</Text>
              </View>
            </View>
          </View>

          {/* Applicants list (client/author only) */}
          {isAuthor && applications.length > 0 && (
            <View className="mx-4 mt-4">
              <Text className="text-base font-semibold text-text-main mb-3">
                申请列表（{applications.length}）
              </Text>
              {applications.map((app) => (
                <View key={app.id} className="bg-card rounded-xl p-4 mb-3 shadow-sm">
                  <View className="flex-row justify-between mb-1">
                    <Text className="font-medium text-text-main">{app.aigcerNickname}</Text>
                    <Text className="text-primary font-semibold">{app.expectedPrice}</Text>
                  </View>
                  <Text className="text-sm text-text-sub mb-3">{app.message}</Text>
                  {app.status === 'pending' && (
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        onPress={() => updateMutation.mutate({ appId: app.id, status: 'accepted' })}
                        className="flex-1 bg-primary rounded-full py-2 items-center"
                      >
                        <Text className="text-white text-sm font-medium">接受</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => updateMutation.mutate({ appId: app.id, status: 'rejected' })}
                        className="flex-1 border border-gray-200 rounded-full py-2 items-center"
                      >
                        <Text className="text-text-sub text-sm">拒绝</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {app.status !== 'pending' && (
                    <Text className={`text-sm font-medium ${app.status === 'accepted' ? 'text-green-600' : 'text-red-500'}`}>
                      {app.status === 'accepted' ? '已接受' : '已拒绝'}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Apply button */}
        {canApply && !isAuthor && daysLeft > 0 && (
          <View className="absolute bottom-0 left-0 right-0 bg-card px-4 py-3 border-t border-gray-100">
            <TouchableOpacity
              onPress={() => setShowApplyModal(true)}
              className="bg-primary rounded-full py-3.5 items-center"
            >
              <Text className="text-white font-semibold">申请该项目</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Apply modal */}
        <Modal visible={showApplyModal} animationType="slide" presentationStyle="pageSheet">
          <SafeAreaView className="flex-1 bg-surface">
            <View className="flex-row items-center px-4 py-3 border-b border-gray-100 bg-card">
              <TouchableOpacity onPress={() => setShowApplyModal(false)}>
                <Text className="text-text-sub">取消</Text>
              </TouchableOpacity>
              <Text className="flex-1 text-center font-semibold text-text-main">申请项目</Text>
              <TouchableOpacity
                onPress={() => applyMutation.mutate()}
                disabled={applyMutation.isPending}
              >
                <Text className={`font-semibold ${applyMutation.isPending ? 'text-blue-300' : 'text-primary'}`}>
                  提交
                </Text>
              </TouchableOpacity>
            </View>
            <ScrollView className="p-4">
              <Text className="text-sm font-medium text-text-main mb-1">期望报酬</Text>
              <TextInput
                className="bg-card border border-gray-200 rounded-xl px-4 py-3 mb-4 text-text-main"
                placeholder="如：¥3000"
                placeholderTextColor="#8A8A9A"
                value={price}
                onChangeText={setPrice}
              />
              <Text className="text-sm font-medium text-text-main mb-1">申请留言</Text>
              <TextInput
                className="bg-card border border-gray-200 rounded-xl px-4 py-3 text-text-main"
                placeholder="介绍你的能力、过往作品经历..."
                placeholderTextColor="#8A8A9A"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                value={message}
                onChangeText={setMessage}
                style={{ minHeight: 120 }}
              />
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add mobile/app/commissions/
git commit -m "feat(mobile): commission detail with apply modal and applicant management"
```

---

## Task 18: New Commission Screen

**Files:**
- Create: `mobile/app/commissions/new.tsx`

- [ ] **Step 1: Write `mobile/app/commissions/new.tsx`**

```tsx
import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@shared/contexts/AuthContext';
import { createCommission } from '@shared/services/commissionService';

const CATEGORIES = ['商业宣传片', '创意短片', '概念影像', '短视频'];

export default function NewCommissionScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [priceRange, setPriceRange] = useState('');
  const [deadline, setDeadline] = useState('');
  const [purpose, setPurpose] = useState<'商业用途' | '个人用途'>('商业用途');

  const mutation = useMutation({
    mutationFn: () =>
      createCommission({
        title,
        description,
        category,
        priceRange,
        deadline,
        purpose,
        authorId: user!.id,
        authorNickname: user!.nickname,
        authorVerification:
          user!.clientVerificationType === 'enterprise' ? 'enterprise' : 'realname',
        tag: user!.clientVerificationType === 'enterprise' ? '企业认证' : '实名认证',
        reputation: '信誉优良',
        style: undefined,
        resolution: undefined,
        format: undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['commissions'] });
      qc.invalidateQueries({ queryKey: ['commissions', 'author', user?.id] });
      Alert.alert('发布成功', '项目已发布', [
        { text: '确定', onPress: () => router.back() },
      ]);
    },
    onError: (e: Error) => Alert.alert('发布失败', e.message),
  });

  function handleSubmit() {
    if (!title || !description || !priceRange || !deadline) {
      Alert.alert('提示', '请填写所有必填项');
      return;
    }
    mutation.mutate();
  }

  return (
    <>
      <Stack.Screen options={{ title: '发布新项目' }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <SafeAreaView className="flex-1 bg-surface" edges={['bottom']}>
          <ScrollView className="flex-1 p-4" keyboardShouldPersistTaps="handled">
            <Text className="text-sm font-medium text-text-main mb-1">项目标题 *</Text>
            <TextInput
              className="bg-card border border-gray-200 rounded-xl px-4 py-3 mb-4 text-text-main"
              placeholder="简洁描述你的需求"
              placeholderTextColor="#8A8A9A"
              value={title}
              onChangeText={setTitle}
            />

            <Text className="text-sm font-medium text-text-main mb-1">项目描述 *</Text>
            <TextInput
              className="bg-card border border-gray-200 rounded-xl px-4 py-3 mb-4 text-text-main"
              placeholder="详细描述项目内容、风格要求等"
              placeholderTextColor="#8A8A9A"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
              style={{ minHeight: 100 }}
            />

            <Text className="text-sm font-medium text-text-main mb-2">影片类别</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setCategory(c)}
                  className={`px-3 py-1.5 rounded-full border ${
                    category === c ? 'bg-primary border-primary' : 'bg-card border-gray-200'
                  }`}
                >
                  <Text className={`text-sm ${category === c ? 'text-white' : 'text-text-main'}`}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-sm font-medium text-text-main mb-2">用途</Text>
            <View className="flex-row gap-3 mb-4">
              {(['商业用途', '个人用途'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  onPress={() => setPurpose(p)}
                  className={`flex-1 border rounded-xl py-3 items-center ${
                    purpose === p ? 'bg-primary border-primary' : 'bg-card border-gray-200'
                  }`}
                >
                  <Text className={`font-medium text-sm ${purpose === p ? 'text-white' : 'text-text-main'}`}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-sm font-medium text-text-main mb-1">报酬区间 *</Text>
            <TextInput
              className="bg-card border border-gray-200 rounded-xl px-4 py-3 mb-4 text-text-main"
              placeholder="如：¥1000-3000"
              placeholderTextColor="#8A8A9A"
              value={priceRange}
              onChangeText={setPriceRange}
            />

            <Text className="text-sm font-medium text-text-main mb-1">截止日期 *</Text>
            <TextInput
              className="bg-card border border-gray-200 rounded-xl px-4 py-3 mb-6 text-text-main"
              placeholder="如：2026-06-30"
              placeholderTextColor="#8A8A9A"
              value={deadline}
              onChangeText={setDeadline}
            />

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={mutation.isPending}
              className={`rounded-full py-3.5 items-center mb-4 ${mutation.isPending ? 'bg-blue-300' : 'bg-primary'}`}
            >
              <Text className="text-white font-semibold text-base">
                {mutation.isPending ? '发布中...' : '发布项目'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add mobile/app/commissions/new.tsx
git commit -m "feat(mobile): new commission form for clients"
```

---

## Task 19: Onboarding Screens

**Files:**
- Create: `mobile/app/onboarding/_layout.tsx`
- Create: `mobile/app/onboarding/aigcer.tsx`
- Create: `mobile/app/onboarding/client.tsx`

- [ ] **Step 1: Write `mobile/app/onboarding/_layout.tsx`**

```tsx
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTintColor: '#1DA1F2',
        headerTitleStyle: { color: '#1A1A2E', fontWeight: '600' },
      }}
    />
  );
}
```

- [ ] **Step 2: Write `mobile/app/onboarding/aigcer.tsx`**

```tsx
import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@shared/contexts/AuthContext';
import { updateStoredUser } from '@shared/services/authService';

const STYLES = ['二次元风', '国风古典', '欧美写实', '概念科幻', '纪实风格'];
const TOOLS = ['Sora', 'Runway', 'Pika', 'Kling', 'ComfyUI', 'After Effects'];

export default function OnboardingAigcerScreen() {
  const { user, setUser } = useAuth();
  const router = useRouter();
  const [bio, setBio] = useState('');
  const [styles, setStyles] = useState<string[]>([]);
  const [tools, setTools] = useState<string[]>([]);

  function toggle(arr: string[], val: string, setter: (v: string[]) => void) {
    setter(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  }

  const mutation = useMutation({
    mutationFn: () =>
      updateStoredUser(user!.id, {
        verification_status: 'pending',
        aigcer_bio: bio,
        aigcer_styles: styles,
        aigcer_tools: tools,
      }),
    onSuccess: (updated) => {
      setUser(updated);
      Alert.alert('提交成功', '认证资料已提交，等待审核', [
        { text: '确定', onPress: () => router.replace('/(tabs)/') },
      ]);
    },
    onError: (e: Error) => Alert.alert('提交失败', e.message),
  });

  function handleSubmit() {
    if (!bio || styles.length === 0 || tools.length === 0) {
      Alert.alert('提示', '请填写简介并至少选择一个风格和工具');
      return;
    }
    mutation.mutate();
  }

  return (
    <>
      <Stack.Screen options={{ title: 'AI制作者认证' }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <SafeAreaView className="flex-1 bg-surface" edges={['bottom']}>
          <ScrollView className="flex-1 p-4" keyboardShouldPersistTaps="handled">
            <Text className="text-sm font-medium text-text-main mb-1">个人简介 *</Text>
            <TextInput
              className="bg-card border border-gray-200 rounded-xl px-4 py-3 mb-4 text-text-main"
              placeholder="介绍你的创作方向和经验..."
              placeholderTextColor="#8A8A9A"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={bio}
              onChangeText={setBio}
              style={{ minHeight: 100 }}
            />

            <Text className="text-sm font-medium text-text-main mb-2">擅长风格 *</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {STYLES.map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => toggle(styles, s, setStyles)}
                  className={`px-3 py-1.5 rounded-full border ${
                    styles.includes(s) ? 'bg-primary border-primary' : 'bg-card border-gray-200'
                  }`}
                >
                  <Text className={`text-sm ${styles.includes(s) ? 'text-white' : 'text-text-main'}`}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-sm font-medium text-text-main mb-2">常用工具 *</Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {TOOLS.map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => toggle(tools, t, setTools)}
                  className={`px-3 py-1.5 rounded-full border ${
                    tools.includes(t) ? 'bg-primary border-primary' : 'bg-card border-gray-200'
                  }`}
                >
                  <Text className={`text-sm ${tools.includes(t) ? 'text-white' : 'text-text-main'}`}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={mutation.isPending}
              className={`rounded-full py-3.5 items-center mb-4 ${mutation.isPending ? 'bg-blue-300' : 'bg-primary'}`}
            >
              <Text className="text-white font-semibold text-base">
                {mutation.isPending ? '提交中...' : '提交认证'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </>
  );
}
```

- [ ] **Step 3: Write `mobile/app/onboarding/client.tsx`**

```tsx
import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@shared/contexts/AuthContext';
import { updateStoredUser } from '@shared/services/authService';
import { ClientVerificationType } from '@shared/types/user';

export default function OnboardingClientScreen() {
  const { user, setUser } = useAuth();
  const router = useRouter();
  const [type, setType] = useState<ClientVerificationType>('realname');
  const [realName, setRealName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      updateStoredUser(user!.id, {
        verification_status: 'pending',
        client_verification_type: type,
      }),
    onSuccess: (updated) => {
      setUser(updated);
      Alert.alert('提交成功', '认证资料已提交，等待审核', [
        { text: '确定', onPress: () => router.replace('/(tabs)/') },
      ]);
    },
    onError: (e: Error) => Alert.alert('提交失败', e.message),
  });

  function handleSubmit() {
    if (type === 'realname' && (!realName || !idNumber)) {
      Alert.alert('提示', '请填写真实姓名和身份证号');
      return;
    }
    if (type === 'enterprise' && (!companyName || !licenseNumber)) {
      Alert.alert('提示', '请填写公司名称和营业执照号');
      return;
    }
    mutation.mutate();
  }

  return (
    <>
      <Stack.Screen options={{ title: '委托方认证' }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <SafeAreaView className="flex-1 bg-surface" edges={['bottom']}>
          <ScrollView className="flex-1 p-4" keyboardShouldPersistTaps="handled">
            <Text className="text-sm font-medium text-text-main mb-2">认证类型</Text>
            <View className="flex-row gap-3 mb-6">
              {([['realname', '个人实名'], ['enterprise', '企业认证']] as const).map(([val, label]) => (
                <TouchableOpacity
                  key={val}
                  onPress={() => setType(val)}
                  className={`flex-1 border rounded-xl py-3 items-center ${
                    type === val ? 'bg-primary border-primary' : 'bg-card border-gray-200'
                  }`}
                >
                  <Text className={`font-medium text-sm ${type === val ? 'text-white' : 'text-text-main'}`}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {type === 'realname' ? (
              <>
                <Text className="text-sm font-medium text-text-main mb-1">真实姓名 *</Text>
                <TextInput
                  className="bg-card border border-gray-200 rounded-xl px-4 py-3 mb-4 text-text-main"
                  placeholder="请输入真实姓名"
                  placeholderTextColor="#8A8A9A"
                  value={realName}
                  onChangeText={setRealName}
                />
                <Text className="text-sm font-medium text-text-main mb-1">身份证号 *</Text>
                <TextInput
                  className="bg-card border border-gray-200 rounded-xl px-4 py-3 mb-4 text-text-main"
                  placeholder="18位身份证号"
                  placeholderTextColor="#8A8A9A"
                  value={idNumber}
                  onChangeText={setIdNumber}
                />
              </>
            ) : (
              <>
                <Text className="text-sm font-medium text-text-main mb-1">公司名称 *</Text>
                <TextInput
                  className="bg-card border border-gray-200 rounded-xl px-4 py-3 mb-4 text-text-main"
                  placeholder="营业执照上的公司名称"
                  placeholderTextColor="#8A8A9A"
                  value={companyName}
                  onChangeText={setCompanyName}
                />
                <Text className="text-sm font-medium text-text-main mb-1">统一社会信用代码 *</Text>
                <TextInput
                  className="bg-card border border-gray-200 rounded-xl px-4 py-3 mb-4 text-text-main"
                  placeholder="18位统一社会信用代码"
                  placeholderTextColor="#8A8A9A"
                  value={licenseNumber}
                  onChangeText={setLicenseNumber}
                />
              </>
            )}

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={mutation.isPending}
              className={`rounded-full py-3.5 items-center mt-2 mb-4 ${mutation.isPending ? 'bg-blue-300' : 'bg-primary'}`}
            >
              <Text className="text-white font-semibold text-base">
                {mutation.isPending ? '提交中...' : '提交认证'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add mobile/app/onboarding/
git commit -m "feat(mobile): onboarding screens for aigcer and client certification"
```

---

## Task 20: Verify Build

**Files:** No new files

- [ ] **Step 1: Start the development server (Web)**

```bash
cd mobile
npx expo start --web
```

Expected: Browser opens at `http://localhost:8081`. Login screen visible. No console errors.

- [ ] **Step 2: Test on Android (optional, if Android Studio installed)**

```bash
npx expo start --android
```

Expected: Expo opens in Android emulator. Tab navigation works.

- [ ] **Step 3: Test on iOS / Xcode (macOS only)**

On a Mac machine, copy the `mobile/` directory or clone the repo, then:

```bash
cd mobile
npm install
npx expo run:ios
```

Expected: Xcode builds the app, iOS Simulator launches, login screen appears, full app navigation works.

- [ ] **Step 4: Verify .env is set**

Ensure `mobile/.env` has real Supabase values (copy from web project's `.env`):
```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "feat(mobile): complete Expo cross-platform app — iOS/Android/Web"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Covered in |
|---|---|
| Expo Managed Workflow | Task 1-3 |
| NativeWind styling | Task 3 |
| Shared service layer | Task 4-6 |
| AuthContext adapted | Task 7 |
| 5-tab navigation | Task 11 |
| Auth guard in root layout | Task 9 |
| Login / Register | Task 10 |
| Home dual-role dashboard | Task 12 |
| Commissions list + filters | Task 13 |
| Gallery waterfall | Task 14 |
| Messages + categories | Task 15 |
| Profile + logout | Task 16 |
| Commission detail + apply | Task 17 |
| New commission form | Task 18 |
| Onboarding Aigcer | Task 19 |
| Onboarding Client | Task 19 |
| `npx expo run:ios` Xcode build | Task 20 |

All spec requirements covered. No placeholders or TBDs.
