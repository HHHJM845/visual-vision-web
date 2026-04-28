# Stitch Mobile UI Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all mobile screen JSX and shared components to match Stitch Kinetic Azure design across 17 screens.

**Architecture:** Keep existing data layer (Supabase, AuthContext, RoleContext, commissionService, TypeScript types) untouched. Replace only UI code: tailwind tokens, shared components, and screen JSX. Add 7 new route files and register them in `_layout.tsx`.

**Tech Stack:** Expo 54, React Native 0.81, expo-router v6, NativeWind v4, expo-blur, expo-linear-gradient, @expo-google-fonts/space-grotesk, @expo-google-fonts/manrope, @react-native-masked-view/masked-view, @expo/vector-icons (MaterialCommunityIcons)

---

## File Map

**Modify:**
- `mobile/package.json` — add new deps
- `mobile/tailwind.config.js` — Kinetic Azure tokens
- `mobile/global.css` — glass-effect utility
- `mobile/app/_layout.tsx` — register portfolio, notification, support, onboarding/role screens
- `mobile/app/(tabs)/_layout.tsx` — custom tab bar style with #007AFF
- `mobile/app/(auth)/login.tsx` — Stitch _17 UI
- `mobile/app/(tabs)/index.tsx` — Stitch _2 UI
- `mobile/app/(tabs)/plaza.tsx` — Stitch _11 UI
- `mobile/app/(tabs)/discover.tsx` — Stitch _14+_15 UI
- `mobile/app/(tabs)/messages.tsx` — Stitch _5 UI
- `mobile/app/(tabs)/profile.tsx` — Stitch _9 UI
- `mobile/app/commission/new.tsx` — Stitch _12 UI
- `mobile/app/commission/[id].tsx` — Stitch _13 UI
- `mobile/app/commission/applicants.tsx` — Stitch _10 UI
- `mobile/components/TopAppBar.tsx` — glass header, gradient logo
- `mobile/components/CommissionCard.tsx` — Kinetic style
- `mobile/components/StatsGrid.tsx` — Kinetic style
- `mobile/components/PageLayout.tsx` — Kinetic style

**Create:**
- `mobile/app/onboarding/role.tsx` — Stitch _16
- `mobile/app/commission/contract.tsx` — Stitch _3
- `mobile/app/commission/review.tsx` — Stitch _4
- `mobile/app/portfolio/_layout.tsx`
- `mobile/app/portfolio/[id].tsx` — Stitch _8
- `mobile/app/portfolio/edit.tsx` — Stitch _6
- `mobile/app/notification/_layout.tsx`
- `mobile/app/notification/[id].tsx` — Stitch _1
- `mobile/app/support/_layout.tsx`
- `mobile/app/support/appeal.tsx` — Stitch _7
- `mobile/components/KineticButton.tsx`
- `mobile/components/GlassCard.tsx`
- `mobile/components/FilterChips.tsx`
- `mobile/components/AvatarBadge.tsx`
- `mobile/shared/data/mockExtended.ts` — wallet, AI stats, sample/notification mocks

---

## Task 1: Install New Dependencies

**Files:**
- Modify: `mobile/package.json`

- [ ] **Step 1: Install packages**

```bash
cd mobile && npx expo install expo-blur expo-linear-gradient @expo-google-fonts/space-grotesk @expo-google-fonts/manrope @react-native-masked-view/masked-view
```

Expected: packages added to node_modules and package.json

- [ ] **Step 2: Verify package.json additions**

Check that these appear in `mobile/package.json` dependencies:
- `expo-blur`
- `expo-linear-gradient`
- `@expo-google-fonts/space-grotesk`
- `@expo-google-fonts/manrope`
- `@react-native-masked-view/masked-view`

- [ ] **Step 3: Commit**

```bash
cd mobile && git add package.json package-lock.json
git commit -m "chore(mobile): add expo-blur, expo-linear-gradient, google-fonts deps"
```

---

## Task 2: Kinetic Azure Design Tokens

**Files:**
- Modify: `mobile/tailwind.config.js`
- Modify: `mobile/global.css`

- [ ] **Step 1: Replace tailwind.config.js**

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './shared/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#007AFF',
        background: '#F2F2F7',
        surface: '#FFFFFF',
        'surface-low': '#F3F4F5',
        'on-surface': '#1C1C1E',
        'on-surface-variant': '#3A3A3C',
        outline: '#E5E5EA',
      },
      fontFamily: {
        headline: ['SpaceGrotesk_700Bold', 'sans-serif'],
        body: ['Manrope_400Regular', 'sans-serif'],
      },
      borderRadius: {
        sm: '8px',
        DEFAULT: '12px',
        lg: '16px',
        xl: '20px',
        full: '9999px',
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 2: Update global.css**

Add after existing content in `mobile/global.css`:

```css
.glass-effect {
  background-color: rgba(243, 244, 245, 0.85);
}
```

(BlurView handles the actual blur in RN — this class sets the tint background.)

- [ ] **Step 3: Commit**

```bash
git add mobile/tailwind.config.js mobile/global.css
git commit -m "feat(mobile): apply Kinetic Azure design tokens to tailwind"
```

---

## Task 3: Load Fonts in Root Layout

**Files:**
- Modify: `mobile/app/_layout.tsx`

- [ ] **Step 1: Update _layout.tsx with font loading and new routes**

```tsx
import '../global.css';
import React from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RoleProvider } from '@shared/contexts/RoleContext';
import { useFonts, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { Manrope_400Regular, Manrope_600SemiBold, Manrope_700Bold } from '@expo-google-fonts/manrope';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_700Bold,
    Manrope_400Regular,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <RoleProvider initialRole="creator">
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="commission" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="portfolio" />
            <Stack.Screen name="notification" />
            <Stack.Screen name="support" />
          </Stack>
        </RoleProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
```

- [ ] **Step 2: Create new route layout files**

`mobile/app/portfolio/_layout.tsx`:
```tsx
import { Stack } from 'expo-router';
export default function PortfolioLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

`mobile/app/notification/_layout.tsx`:
```tsx
import { Stack } from 'expo-router';
export default function NotificationLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

`mobile/app/support/_layout.tsx`:
```tsx
import { Stack } from 'expo-router';
export default function SupportLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

- [ ] **Step 3: Commit**

```bash
git add mobile/app/_layout.tsx mobile/app/portfolio/ mobile/app/notification/ mobile/app/support/
git commit -m "feat(mobile): load Space Grotesk+Manrope fonts, register new route groups"
```

---

## Task 4: KineticButton Component

**Files:**
- Create: `mobile/components/KineticButton.tsx`

- [ ] **Step 1: Write the component**

```tsx
import React, { useRef } from 'react';
import { Animated, Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface KineticButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'ghost';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export default function KineticButton({
  label, onPress, variant = 'primary', disabled, style, textStyle, fullWidth,
}: KineticButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 4 }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, fullWidth && { width: '100%' }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={({ pressed }) => [styles.base, variant === 'outline' && styles.outline, variant === 'ghost' && styles.ghost, disabled && styles.disabled, pressed && { opacity: 0.9 }]}
      >
        {variant === 'primary' && (
          <LinearGradient
            colors={['#007AFF', '#00C6FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        )}
        <Text style={[styles.label, variant === 'outline' && styles.labelOutline, variant === 'ghost' && styles.labelGhost, textStyle]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  outline: {
    borderWidth: 1.5,
    borderColor: '#007AFF',
    backgroundColor: 'transparent',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: { opacity: 0.5 },
  label: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', fontFamily: 'Manrope_700Bold' },
  labelOutline: { color: '#007AFF' },
  labelGhost: { color: '#007AFF' },
});
```

- [ ] **Step 2: Commit**

```bash
git add mobile/components/KineticButton.tsx
git commit -m "feat(mobile): KineticButton with spring scale and gradient"
```

---

## Task 5: TopAppBar (Glass Header)

**Files:**
- Modify: `mobile/components/TopAppBar.tsx`

- [ ] **Step 1: Rewrite TopAppBar**

```tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface TopAppBarProps {
  title?: string;
  showLogo?: boolean;
  showBack?: boolean;
  rightElement?: React.ReactNode;
}

export default function TopAppBar({ title, showLogo, showBack, rightElement }: TopAppBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <BlurView intensity={60} tint="light" style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.inner}>
        {showBack ? (
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <MaterialCommunityIcons name="chevron-left" size={26} color="#1C1C1E" />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconBtn} />
        )}

        <View style={styles.center}>
          {showLogo ? (
            <Text style={styles.logo}>跃然</Text>
          ) : (
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
          )}
        </View>

        <View style={styles.iconBtn}>{rightElement}</View>
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: 'rgba(242,242,247,0.85)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  inner: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  center: { flex: 1, alignItems: 'center' },
  iconBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  logo: {
    fontSize: 22,
    fontFamily: 'SpaceGrotesk_700Bold',
    color: '#007AFF',
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 17,
    fontFamily: 'Manrope_700Bold',
    color: '#1C1C1E',
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add mobile/components/TopAppBar.tsx
git commit -m "feat(mobile): TopAppBar with BlurView glass effect and Space Grotesk logo"
```

---

## Task 6: GlassCard Component

**Files:**
- Create: `mobile/components/GlassCard.tsx`

- [ ] **Step 1: Write GlassCard**

```tsx
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export default function GlassCard({ children, style }: GlassCardProps) {
  return (
    <BlurView intensity={40} tint="light" style={[styles.card, style]}>
      <View style={styles.inner}>{children}</View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(229,229,234,0.6)',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  inner: { padding: 16 },
});
```

- [ ] **Step 2: Commit**

```bash
git add mobile/components/GlassCard.tsx
git commit -m "feat(mobile): GlassCard with BlurView"
```

---

## Task 7: FilterChips Component

**Files:**
- Create: `mobile/components/FilterChips.tsx`

- [ ] **Step 1: Write FilterChips**

```tsx
import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface FilterChipsProps {
  options: string[];
  selected: string;
  onSelect: (option: string) => void;
}

export default function FilterChips({ options, selected, onSelect }: FilterChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {options.map(opt => (
        <TouchableOpacity
          key={opt}
          onPress={() => onSelect(opt)}
          style={[styles.chip, selected === opt && styles.chipSelected]}
          activeOpacity={0.8}
        >
          <Text style={[styles.label, selected === opt && styles.labelSelected]}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 16, gap: 8, paddingVertical: 4 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F5',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  chipSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  label: { fontSize: 13, fontFamily: 'Manrope_600SemiBold', color: '#3A3A3C' },
  labelSelected: { color: '#FFFFFF' },
});
```

- [ ] **Step 2: Commit**

```bash
git add mobile/components/FilterChips.tsx
git commit -m "feat(mobile): FilterChips horizontal scrollable pill selector"
```

---

## Task 8: AvatarBadge Component

**Files:**
- Create: `mobile/components/AvatarBadge.tsx`

- [ ] **Step 1: Write AvatarBadge**

```tsx
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface AvatarBadgeProps {
  name: string;
  imageUri?: string;
  size?: number;
  verified?: boolean;
  online?: boolean;
}

export default function AvatarBadge({ name, imageUri, size = 40, verified, online }: AvatarBadgeProps) {
  const initials = name.slice(0, 1);
  return (
    <View style={{ width: size, height: size }}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]} />
      ) : (
        <View style={[styles.placeholder, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{initials}</Text>
        </View>
      )}
      {verified && (
        <View style={[styles.badge, styles.badgeVerified, { right: -2, bottom: -2 }]}>
          <MaterialCommunityIcons name="check-circle" size={14} color="#007AFF" />
        </View>
      )}
      {online && !verified && (
        <View style={[styles.badge, styles.badgeOnline, { right: 0, bottom: 0 }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {},
  placeholder: {
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { color: '#FFFFFF', fontFamily: 'Manrope_700Bold' },
  badge: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  badgeVerified: { padding: 0 },
  badgeOnline: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#34C759',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add mobile/components/AvatarBadge.tsx
git commit -m "feat(mobile): AvatarBadge with verified/online indicators"
```

---

## Task 9: CommissionCard + StatsGrid + PageLayout (Rewrite)

**Files:**
- Modify: `mobile/components/CommissionCard.tsx`
- Modify: `mobile/components/StatsGrid.tsx`
- Modify: `mobile/components/PageLayout.tsx`

- [ ] **Step 1: Rewrite CommissionCard**

```tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Commission } from '@shared/types/commission';
import { useRouter } from 'expo-router';

interface CommissionCardProps { item: Commission }

const statusColor: Record<string, { bg: string; text: string }> = {
  '招募中': { bg: '#E5F3FF', text: '#007AFF' },
  '进行中': { bg: '#FFF3CD', text: '#856404' },
  '已完成': { bg: '#D1F2D1', text: '#1A7C3E' },
  '待验收': { bg: '#FFE5E5', text: '#C0392B' },
};

export default function CommissionCard({ item }: CommissionCardProps) {
  const router = useRouter();
  const sc = statusColor[item.tag] ?? { bg: '#F3F4F5', text: '#3A3A3C' };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/commission/${item.id}`)}
      activeOpacity={0.9}
    >
      <View style={styles.header}>
        <View style={[styles.statusPill, { backgroundColor: sc.bg }]}>
          <Text style={[styles.statusText, { color: sc.text }]}>{item.tag}</Text>
        </View>
        <Text style={styles.purpose}>{item.purpose}</Text>
      </View>

      <Text style={styles.title} numberOfLines={2}>{item.title}</Text>

      <View style={styles.metaRow}>
        <Text style={styles.meta}>{item.category}</Text>
        <Text style={styles.metaDot}>·</Text>
        <Text style={styles.meta}>{item.style || '风格不限'}</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.price}>{item.priceRange}</Text>
        <View style={styles.statsRow}>
          <MaterialCommunityIcons name="account-multiple-outline" size={13} color="#8A8A9A" />
          <Text style={styles.statsText}> {item.applicants}</Text>
          <MaterialCommunityIcons name="clock-outline" size={13} color="#8A8A9A" style={styles.ml8} />
          <Text style={styles.statsText}> {item.deadline}</Text>
        </View>
      </View>

      <View style={styles.authorRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.authorNickname[0]}</Text>
        </View>
        <Text style={styles.authorName}>{item.authorNickname}</Text>
        {item.authorVerification === 'enterprise' && (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>企业认证</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontFamily: 'Manrope_700Bold' },
  purpose: { fontSize: 12, color: '#8A8A9A', fontFamily: 'Manrope_400Regular' },
  title: { fontSize: 15, fontFamily: 'Manrope_700Bold', color: '#1C1C1E', marginBottom: 8, lineHeight: 22 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  meta: { fontSize: 12, color: '#8A8A9A', fontFamily: 'Manrope_400Regular' },
  metaDot: { marginHorizontal: 6, color: '#C7C7CC' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E5E5EA', paddingTop: 10 },
  price: { fontSize: 16, fontFamily: 'Manrope_700Bold', color: '#007AFF' },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statsText: { fontSize: 12, color: '#8A8A9A', fontFamily: 'Manrope_400Regular' },
  ml8: { marginLeft: 10 },
  authorRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  avatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#007AFF', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  avatarText: { fontSize: 11, color: '#FFFFFF', fontFamily: 'Manrope_700Bold' },
  authorName: { fontSize: 13, color: '#3A3A3C', fontFamily: 'Manrope_400Regular', flex: 1 },
  verifiedBadge: { backgroundColor: '#E5F3FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  verifiedText: { fontSize: 11, color: '#007AFF', fontFamily: 'Manrope_700Bold' },
});
```

- [ ] **Step 2: Rewrite StatsGrid**

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface StatItem {
  label: string;
  value: string | number;
  icon?: string;
  color?: string;
}

export default function StatsGrid({ items }: { items: StatItem[] }) {
  return (
    <View style={styles.grid}>
      {items.map((item, i) => (
        <View key={i} style={styles.cell}>
          {item.icon && (
            <MaterialCommunityIcons
              name={item.icon as any}
              size={20}
              color={item.color ?? '#007AFF'}
              style={styles.icon}
            />
          )}
          <Text style={[styles.value, item.color ? { color: item.color } : null]}>
            {item.value}
          </Text>
          <Text style={styles.label}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cell: {
    flex: 1,
    minWidth: '44%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  icon: { marginBottom: 6 },
  value: { fontSize: 22, fontFamily: 'SpaceGrotesk_700Bold', color: '#1C1C1E', marginBottom: 2 },
  label: { fontSize: 12, color: '#8A8A9A', fontFamily: 'Manrope_400Regular' },
});
```

- [ ] **Step 3: Rewrite PageLayout**

```tsx
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopAppBar from './TopAppBar';

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  showLogo?: boolean;
  showBack?: boolean;
  rightElement?: React.ReactNode;
  style?: ViewStyle;
}

export default function PageLayout({ children, title, showLogo, showBack, rightElement, style }: PageLayoutProps) {
  return (
    <SafeAreaView style={[styles.safe, style]} edges={['bottom']}>
      <TopAppBar title={title} showLogo={showLogo} showBack={showBack} rightElement={rightElement} />
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },
  content: { flex: 1, paddingTop: 56 + 44 }, // 56 bar height + status bar approx
});
```

- [ ] **Step 4: Commit**

```bash
git add mobile/components/CommissionCard.tsx mobile/components/StatsGrid.tsx mobile/components/PageLayout.tsx
git commit -m "feat(mobile): rewrite CommissionCard, StatsGrid, PageLayout for Kinetic Azure"
```

---

## Task 10: Extended Mock Data

**Files:**
- Create: `mobile/shared/data/mockExtended.ts`

- [ ] **Step 1: Write mockExtended.ts**

```ts
export interface WalletData {
  balance: string;
  frozen: string;
  totalEarned: string;
  pendingPayout: string;
}

export interface AIEfficiencyData {
  productionSpeed: string;
  qualityScore: number;
  toolsUsed: string[];
  trend: string[];
}

export interface SampleWork {
  id: string;
  title: string;
  thumbnailUrl: string;
  type: 'video' | 'image';
  views: number;
  likes: number;
}

export interface NotificationItem {
  id: string;
  type: 'commission' | 'payment' | 'review' | 'system';
  title: string;
  body: string;
  time: string;
  read: boolean;
}

export interface ContractData {
  id: string;
  commissionTitle: string;
  amount: string;
  escrowAmount: string;
  milestones: { label: string; amount: string; dueDate: string; status: 'pending' | 'done' }[];
  signedAt?: string;
}

export const mockWallet: WalletData = {
  balance: '¥12,480',
  frozen: '¥3,200',
  totalEarned: '¥48,600',
  pendingPayout: '¥8,000',
};

export const mockAIEfficiency: AIEfficiencyData = {
  productionSpeed: '3.2x',
  qualityScore: 94,
  toolsUsed: ['Sora', 'Runway', 'Kling', 'ComfyUI'],
  trend: [60, 72, 80, 88, 92, 94],
};

export const mockSampleWorks: SampleWork[] = [
  { id: '1', title: '科幻短片《星际迷途》片段', thumbnailUrl: '', type: 'video', views: 4200, likes: 312 },
  { id: '2', title: '古风仙侠MV《问道》', thumbnailUrl: '', type: 'video', views: 2800, likes: 198 },
  { id: '3', title: '品牌宣传片动画截帧', thumbnailUrl: '', type: 'image', views: 1100, likes: 85 },
];

export const mockNotifications: NotificationItem[] = [
  { id: '1', type: 'commission', title: '新的申请通过审核', body: '您对《科幻短片》的申请已通过，请查看合同详情。', time: '2分钟前', read: false },
  { id: '2', type: 'payment', title: '收到里程碑付款', body: '第一阶段里程碑款项 ¥3,200 已到账。', time: '1小时前', read: false },
  { id: '3', type: 'review', title: '样片待您验收', body: '创作者已提交样片，请在24小时内完成验收。', time: '3小时前', read: true },
];

export const mockContract: ContractData = {
  id: 'c001',
  commissionTitle: '科幻短片《星际迷途》AI影像制作',
  amount: '¥16,000',
  escrowAmount: '¥16,000',
  milestones: [
    { label: '前期策划', amount: '¥3,200', dueDate: '2026-04-20', status: 'done' },
    { label: '样片制作', amount: '¥6,400', dueDate: '2026-05-05', status: 'pending' },
    { label: '正片交付', amount: '¥6,400', dueDate: '2026-05-20', status: 'pending' },
  ],
  signedAt: '2026-04-10',
};
```

- [ ] **Step 2: Commit**

```bash
git add mobile/shared/data/mockExtended.ts
git commit -m "feat(mobile): add extended mock data for wallet, AI, samples, notifications"
```

---

## Task 11: Update Tabs Layout (BottomTabBar Style)

**Files:**
- Modify: `mobile/app/(tabs)/_layout.tsx`

- [ ] **Step 1: Rewrite tabs layout**

```tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  return (
    <MaterialCommunityIcons
      name={name as any}
      size={24}
      color={focused ? '#007AFF' : '#8A8A9A'}
    />
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8A8A9A',
        tabBarLabelStyle: styles.label,
      }}
    >
      <Tabs.Screen name="index" options={{ title: '工作台', tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'view-dashboard' : 'view-dashboard-outline'} focused={focused} /> }} />
      <Tabs.Screen name="plaza" options={{ title: '广场', tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'grid' : 'grid-outline'} focused={focused} /> }} />
      <Tabs.Screen name="discover" options={{ title: '发现', tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'compass' : 'compass-outline'} focused={focused} /> }} />
      <Tabs.Screen name="messages" options={{ title: '消息', tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'message' : 'message-outline'} focused={focused} /> }} />
      <Tabs.Screen name="profile" options={{ title: '我的', tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'account-circle' : 'account-circle-outline'} focused={focused} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
    height: 64,
    paddingBottom: 10,
    paddingTop: 6,
  },
  label: { fontSize: 10, fontFamily: 'Manrope_600SemiBold' },
});
```

- [ ] **Step 2: Commit**

```bash
git add mobile/app/(tabs)/_layout.tsx
git commit -m "feat(mobile): update tab bar to Kinetic Azure style with MaterialCommunityIcons"
```

---

## Task 12: Login Screen (_17)

**Files:**
- Modify: `mobile/app/(auth)/login.tsx`

- [ ] **Step 1: Rewrite login.tsx**

```tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import KineticButton from '@components/KineticButton';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    if (!email || !password) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); router.replace('/(tabs)'); }, 800);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
      <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Logo */}
          <View style={styles.logoSection}>
            <LinearGradient colors={['#007AFF', '#00C6FF']} style={styles.logoBox}>
              <MaterialCommunityIcons name="movie-open-play" size={38} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.appName}>跃然承制</Text>
            <Text style={styles.slogan}>AI影视承制平台</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.label}>邮箱</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="email-outline" size={18} color="#8A8A9A" />
              <TextInput
                style={styles.input}
                placeholder="请输入邮箱"
                placeholderTextColor="#C7C7CC"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <Text style={styles.label}>密码</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="lock-outline" size={18} color="#8A8A9A" />
              <TextInput
                style={styles.input}
                placeholder="请输入密码"
                placeholderTextColor="#C7C7CC"
                secureTextEntry={!showPwd}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPwd(v => !v)}>
                <MaterialCommunityIcons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={18} color="#8A8A9A" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.forgotRow}>
              <Text style={styles.forgotText}>忘记密码？</Text>
            </TouchableOpacity>

            <KineticButton label={loading ? '登录中...' : '登录'} onPress={handleLogin} disabled={loading} fullWidth />

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>或</Text>
              <View style={styles.divider} />
            </View>

            <KineticButton
              label="没有账号？立即注册"
              onPress={() => router.push('/(auth)/register')}
              variant="outline"
              fullWidth
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },
  kav: { flex: 1 },
  content: { flexGrow: 1, padding: 24 },
  logoSection: { alignItems: 'center', paddingTop: 48, paddingBottom: 40 },
  logoBox: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowColor: '#007AFF', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  appName: { fontSize: 26, fontFamily: 'SpaceGrotesk_700Bold', color: '#1C1C1E', marginBottom: 6 },
  slogan: { fontSize: 14, fontFamily: 'Manrope_400Regular', color: '#8A8A9A' },
  form: {},
  label: { fontSize: 13, fontFamily: 'Manrope_700Bold', color: '#1C1C1E', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 12, paddingHorizontal: 14, marginBottom: 16, height: 52, backgroundColor: '#FFFFFF', gap: 10 },
  input: { flex: 1, fontSize: 15, color: '#1C1C1E', fontFamily: 'Manrope_400Regular' },
  forgotRow: { alignSelf: 'flex-end', marginBottom: 24 },
  forgotText: { fontSize: 13, color: '#007AFF', fontFamily: 'Manrope_600SemiBold' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 12 },
  divider: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: '#E5E5EA' },
  dividerText: { fontSize: 13, color: '#8A8A9A', fontFamily: 'Manrope_400Regular' },
});
```

- [ ] **Step 2: Commit**

```bash
git add mobile/app/(auth)/login.tsx
git commit -m "feat(mobile): login screen Stitch _17 — Kinetic Azure style"
```

---

## Task 13: Role Selection Screen (_16) [New]

**Files:**
- Create: `mobile/app/onboarding/role.tsx`

- [ ] **Step 1: Create role.tsx**

```tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRole } from '@shared/contexts/RoleContext';
import KineticButton from '@components/KineticButton';

export default function RoleSelectScreen() {
  const router = useRouter();
  const { setRole } = useRole();

  const choose = (role: 'creator' | 'client') => {
    setRole(role);
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
      <View style={styles.content}>
        <Text style={styles.headline}>你是？</Text>
        <Text style={styles.sub}>选择你的身份，开始探索跃然承制</Text>

        <TouchableOpacity style={styles.card} onPress={() => choose('creator')} activeOpacity={0.9}>
          <LinearGradient colors={['#007AFF', '#00C6FF']} style={styles.iconBox}>
            <MaterialCommunityIcons name="palette-outline" size={36} color="#FFFFFF" />
          </LinearGradient>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>创作者</Text>
            <Text style={styles.cardDesc}>接受委托、创作AI影视内容、展示作品</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color="#C7C7CC" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => choose('client')} activeOpacity={0.9}>
          <LinearGradient colors={['#FF6B35', '#FF9500']} style={styles.iconBox}>
            <MaterialCommunityIcons name="briefcase-outline" size={36} color="#FFFFFF" />
          </LinearGradient>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>委托方</Text>
            <Text style={styles.cardDesc}>发布企划、寻找创作者、管理项目进度</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color="#C7C7CC" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  headline: { fontSize: 32, fontFamily: 'SpaceGrotesk_700Bold', color: '#1C1C1E', marginBottom: 8 },
  sub: { fontSize: 15, fontFamily: 'Manrope_400Regular', color: '#8A8A9A', marginBottom: 40 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  iconBox: { width: 60, height: 60, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 17, fontFamily: 'Manrope_700Bold', color: '#1C1C1E', marginBottom: 4 },
  cardDesc: { fontSize: 13, fontFamily: 'Manrope_400Regular', color: '#8A8A9A', lineHeight: 18 },
});
```

- [ ] **Step 2: Commit**

```bash
git add mobile/app/onboarding/role.tsx
git commit -m "feat(mobile): role selection screen Stitch _16"
```

---

## Task 14: Workbench Tab (_2)

**Files:**
- Modify: `mobile/app/(tabs)/index.tsx`

- [ ] **Step 1: Rewrite index.tsx**

```tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRole } from '@shared/contexts/RoleContext';
import StatsGrid from '@components/StatsGrid';
import KineticButton from '@components/KineticButton';

const MOCK_USER = { nickname: '创作者小明', verified: false, avatarInitial: '明' };

const creatorStats = [
  { label: '应征中', value: 3, icon: 'file-send-outline' },
  { label: '进行中', value: 2, icon: 'play-circle-outline' },
  { label: '已完成', value: 18, icon: 'check-circle-outline' },
  { label: '累计收入', value: '¥4,200', icon: 'currency-cny', color: '#007AFF' },
];
const clientStats = [
  { label: '已发布', value: 5, icon: 'bullhorn-outline' },
  { label: '招募中', value: 2, icon: 'account-search-outline' },
  { label: '进行中', value: 1, icon: 'play-circle-outline' },
  { label: '待验收', value: 1, icon: 'clock-alert-outline', color: '#FF9500' },
];

const creatorApps = [
  { id: 1, title: '科幻短片《星际迷途》AI影像制作', status: '进行中', progress: 65, price: '¥16,000' },
  { id: 2, title: '古风仙侠MV《问道》AI特效', status: '审核中', progress: 30, price: '¥5,500' },
];
const clientProjects = [
  { id: 1, title: '科幻短片《星际迷途》', applicants: 12, deadline: '2026-05-15', status: '招募中' },
  { id: 2, title: '产品宣传短片制作', applicants: 6, deadline: '2026-04-30', status: '进行中' },
];

const statusColor: Record<string, { bg: string; text: string }> = {
  '进行中': { bg: '#E5F3FF', text: '#007AFF' },
  '审核中': { bg: '#FFF3CD', text: '#856404' },
  '招募中': { bg: '#D1F2D1', text: '#1A7C3E' },
  '已完成': { bg: '#F3F4F5', text: '#3A3A3C' },
};

export default function WorkbenchScreen() {
  const router = useRouter();
  const { isCreator, setRole } = useRole();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />

      {/* Top bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>你好，{MOCK_USER.nickname}</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, MOCK_USER.verified ? styles.badgeV : styles.badgeU]}>
              <Text style={[styles.badgeT, { color: MOCK_USER.verified ? '#FFFFFF' : '#8A8A9A' }]}>
                {MOCK_USER.verified ? '已认证' : '未认证'}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity onPress={() => router.push('/notification/1')} style={styles.notifBtn}>
          <MaterialCommunityIcons name="bell-outline" size={24} color="#1C1C1E" />
          <View style={styles.dot} />
        </TouchableOpacity>
      </View>

      {/* Role switcher */}
      <View style={styles.roleSwitcher}>
        <TouchableOpacity
          style={[styles.roleBtn, isCreator && styles.roleBtnActive]}
          onPress={() => setRole('creator')}
        >
          <Text style={[styles.roleBtnText, isCreator && styles.roleBtnTextActive]}>创作者</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.roleBtn, !isCreator && styles.roleBtnActive]}
          onPress={() => setRole('client')}
        >
          <Text style={[styles.roleBtnText, !isCreator && styles.roleBtnTextActive]}>委托方</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Certification banner */}
        {!MOCK_USER.verified && (
          <LinearGradient colors={['#007AFF', '#00C6FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.banner}>
            <MaterialCommunityIcons name="shield-check-outline" size={20} color="#FFFFFF" />
            <Text style={styles.bannerText}>完成认证，解锁更多功能</Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color="rgba(255,255,255,0.8)" />
          </LinearGradient>
        )}

        {/* Stats */}
        <View style={styles.section}>
          <StatsGrid items={isCreator ? creatorStats : clientStats} />
        </View>

        {/* Recent list */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{isCreator ? '我的申请' : '我的企划'}</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/plaza')}>
              <Text style={styles.seeAll}>查看全部</Text>
            </TouchableOpacity>
          </View>

          {isCreator ? creatorApps.map(app => {
            const sc = statusColor[app.status] ?? { bg: '#F3F4F5', text: '#3A3A3C' };
            return (
              <TouchableOpacity key={app.id} style={styles.card} onPress={() => router.push(`/commission/${app.id}`)}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{app.title}</Text>
                  <View style={[styles.statusPill, { backgroundColor: sc.bg }]}>
                    <Text style={[styles.statusText, { color: sc.text }]}>{app.status}</Text>
                  </View>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${app.progress}%` as any }]} />
                </View>
                <View style={styles.cardBottom}>
                  <Text style={styles.progressText}>{app.progress}% 完成</Text>
                  <Text style={styles.priceText}>{app.price}</Text>
                </View>
              </TouchableOpacity>
            );
          }) : clientProjects.map(p => {
            const sc = statusColor[p.status] ?? { bg: '#F3F4F5', text: '#3A3A3C' };
            return (
              <TouchableOpacity key={p.id} style={styles.card} onPress={() => router.push(`/commission/${p.id}`)}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{p.title}</Text>
                  <View style={[styles.statusPill, { backgroundColor: sc.bg }]}>
                    <Text style={[styles.statusText, { color: sc.text }]}>{p.status}</Text>
                  </View>
                </View>
                <View style={styles.cardBottom}>
                  <View style={styles.meta}>
                    <MaterialCommunityIcons name="account-multiple-outline" size={13} color="#8A8A9A" />
                    <Text style={styles.metaText}>{p.applicants} 人申请</Text>
                  </View>
                  <View style={styles.meta}>
                    <MaterialCommunityIcons name="clock-outline" size={13} color="#8A8A9A" />
                    <Text style={styles.metaText}>{p.deadline}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {!isCreator && (
          <View style={styles.publishSection}>
            <KineticButton label="发布新企划" onPress={() => router.push('/commission/new')} fullWidth />
          </View>
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E5EA' },
  greeting: { fontSize: 18, fontFamily: 'Manrope_700Bold', color: '#1C1C1E' },
  badgeRow: { flexDirection: 'row', marginTop: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badgeV: { backgroundColor: '#007AFF' },
  badgeU: { backgroundColor: '#F3F4F5' },
  badgeT: { fontSize: 11, fontFamily: 'Manrope_700Bold' },
  notifBtn: { padding: 4, position: 'relative' },
  dot: { position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF3B30', borderWidth: 1.5, borderColor: '#FFFFFF' },
  roleSwitcher: { flexDirection: 'row', backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingBottom: 12, gap: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E5EA' },
  roleBtn: { flex: 1, paddingVertical: 8, borderRadius: 20, alignItems: 'center', backgroundColor: '#F3F4F5' },
  roleBtnActive: { backgroundColor: '#007AFF' },
  roleBtnText: { fontSize: 14, fontFamily: 'Manrope_700Bold', color: '#8A8A9A' },
  roleBtnTextActive: { color: '#FFFFFF' },
  banner: { flexDirection: 'row', alignItems: 'center', margin: 16, marginBottom: 0, padding: 14, borderRadius: 12, gap: 8 },
  bannerText: { flex: 1, color: '#FFFFFF', fontFamily: 'Manrope_700Bold', fontSize: 14 },
  section: { padding: 16, paddingBottom: 0 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontFamily: 'Manrope_700Bold', color: '#1C1C1E' },
  seeAll: { fontSize: 13, color: '#007AFF', fontFamily: 'Manrope_600SemiBold' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { flex: 1, fontSize: 14, fontFamily: 'Manrope_700Bold', color: '#1C1C1E', marginRight: 8 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusText: { fontSize: 11, fontFamily: 'Manrope_700Bold' },
  progressBar: { height: 4, backgroundColor: '#F3F4F5', borderRadius: 2, marginBottom: 8 },
  progressFill: { height: 4, backgroundColor: '#007AFF', borderRadius: 2 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressText: { fontSize: 12, color: '#8A8A9A', fontFamily: 'Manrope_400Regular' },
  priceText: { fontSize: 14, fontFamily: 'Manrope_700Bold', color: '#007AFF' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#8A8A9A', fontFamily: 'Manrope_400Regular' },
  publishSection: { padding: 16, paddingTop: 20 },
});
```

- [ ] **Step 2: Commit**

```bash
git add mobile/app/(tabs)/index.tsx
git commit -m "feat(mobile): workbench screen Stitch _2 — Kinetic Azure style"
```

---

## Task 15: Plaza Tab (_11)

**Files:**
- Modify: `mobile/app/(tabs)/plaza.tsx`

- [ ] **Step 1: Read current file and rewrite**

Read `mobile/app/(tabs)/plaza.tsx` to understand existing data hooks, then rewrite keeping data logic, replacing UI:

```tsx
import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TopAppBar from '@components/TopAppBar';
import CommissionCard from '@components/CommissionCard';
import FilterChips from '@components/FilterChips';
import { useCommissions } from '@shared/services/commissionService';

const FILTERS = ['全部', '剧情', '商业', '音乐MV', 'AI动画', '纪录片'];

export default function PlazaScreen() {
  const [selected, setSelected] = useState('全部');
  const { data: commissions = [] } = useCommissions();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
      <TopAppBar showLogo title="项目广场" />

      <View style={[styles.filterArea, { paddingTop: 56 + insets.top }]}>
        <FilterChips options={FILTERS} selected={selected} onSelect={setSelected} />
      </View>

      <FlatList
        data={commissions}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => <CommissionCard item={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },
  filterArea: { paddingVertical: 8 },
  list: { padding: 16, paddingTop: 8 },
});
```

> **Note:** If `useCommissions` import path differs in existing code, keep original import path.

- [ ] **Step 2: Commit**

```bash
git add mobile/app/(tabs)/plaza.tsx
git commit -m "feat(mobile): plaza screen Stitch _11 with FilterChips"
```

---

## Task 16: Discover Tab (_14 + _15)

**Files:**
- Modify: `mobile/app/(tabs)/discover.tsx`

- [ ] **Step 1: Rewrite discover.tsx**

```tsx
import React from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import TopAppBar from '@components/TopAppBar';
import GlassCard from '@components/GlassCard';
import { mockAIEfficiency } from '@shared/data/mockExtended';

const AI_TOOLS = [
  { name: 'Sora', desc: 'OpenAI 文本转视频', color: '#007AFF', icon: 'video-outline' },
  { name: 'Runway', desc: '多模态视频生成', color: '#FF6B35', icon: 'camera-outline' },
  { name: 'Kling', desc: '快手可灵，国产视频生成', color: '#8B5CF6', icon: 'movie-open-outline' },
  { name: 'ComfyUI', desc: '节点式工作流', color: '#10B981', icon: 'sitemap-outline' },
];

const TRENDS = [
  { id: 1, title: 'AI影视进入"亿级制作"时代', hot: '18.2k', tag: '行业' },
  { id: 2, title: 'Sora v2 发布，60s视频成本降90%', hot: '12.4k', tag: '技术' },
  { id: 3, title: '国产AI模型Kling 2.0开放API', hot: '9.8k', tag: '工具' },
  { id: 4, title: '承制平台月交易额突破1亿元', hot: '7.2k', tag: '平台' },
];

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
      <TopAppBar showLogo />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingTop: 56 + insets.top }]}>

        {/* AI Efficiency Banner */}
        <LinearGradient colors={['#007AFF', '#00C6FF']} style={styles.efficiencyBanner}>
          <View style={styles.effRow}>
            <View>
              <Text style={styles.effLabel}>AI 生产提速</Text>
              <Text style={styles.effValue}>{mockAIEfficiency.productionSpeed}</Text>
            </View>
            <View>
              <Text style={styles.effLabel}>质量评分</Text>
              <Text style={styles.effValue}>{mockAIEfficiency.qualityScore}</Text>
            </View>
            <View>
              <Text style={styles.effLabel}>使用工具</Text>
              <Text style={styles.effValue}>{mockAIEfficiency.toolsUsed.length}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* AI Tools Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI 工具矩阵</Text>
          <View style={styles.toolsGrid}>
            {AI_TOOLS.map(tool => (
              <GlassCard key={tool.name} style={styles.toolCard}>
                <View style={[styles.toolIcon, { backgroundColor: tool.color + '20' }]}>
                  <MaterialCommunityIcons name={tool.icon as any} size={22} color={tool.color} />
                </View>
                <Text style={styles.toolName}>{tool.name}</Text>
                <Text style={styles.toolDesc} numberOfLines={2}>{tool.desc}</Text>
              </GlassCard>
            ))}
          </View>
        </View>

        {/* AI Trends (merged from _15) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI 行业趋势</Text>
          {TRENDS.map(t => (
            <TouchableOpacity key={t.id} style={styles.trendItem} activeOpacity={0.8}>
              <View style={styles.trendLeft}>
                <View style={styles.trendTag}>
                  <Text style={styles.trendTagText}>{t.tag}</Text>
                </View>
                <Text style={styles.trendTitle}>{t.title}</Text>
              </View>
              <View style={styles.trendRight}>
                <MaterialCommunityIcons name="fire" size={14} color="#FF3B30" />
                <Text style={styles.hotText}>{t.hot}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },
  content: { paddingBottom: 16 },
  efficiencyBanner: { margin: 16, borderRadius: 16, padding: 20 },
  effRow: { flexDirection: 'row', justifyContent: 'space-around' },
  effLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontFamily: 'Manrope_400Regular', textAlign: 'center', marginBottom: 4 },
  effValue: { fontSize: 24, fontFamily: 'SpaceGrotesk_700Bold', color: '#FFFFFF', textAlign: 'center' },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontFamily: 'Manrope_700Bold', color: '#1C1C1E', marginBottom: 12 },
  toolsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  toolCard: { width: '47%' },
  toolIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  toolName: { fontSize: 14, fontFamily: 'Manrope_700Bold', color: '#1C1C1E', marginBottom: 4 },
  toolDesc: { fontSize: 11, fontFamily: 'Manrope_400Regular', color: '#8A8A9A', lineHeight: 16 },
  trendItem: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  trendLeft: { flex: 1, marginRight: 12 },
  trendTag: { backgroundColor: '#E5F3FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginBottom: 6 },
  trendTagText: { fontSize: 11, color: '#007AFF', fontFamily: 'Manrope_700Bold' },
  trendTitle: { fontSize: 14, fontFamily: 'Manrope_600SemiBold', color: '#1C1C1E', lineHeight: 20 },
  trendRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  hotText: { fontSize: 13, color: '#FF3B30', fontFamily: 'Manrope_700Bold' },
});
```

- [ ] **Step 2: Commit**

```bash
git add mobile/app/(tabs)/discover.tsx
git commit -m "feat(mobile): discover screen Stitch _14+_15 with AI tools and trends"
```

---

## Task 17: Messages + Profile Tabs (_5, _9)

**Files:**
- Modify: `mobile/app/(tabs)/messages.tsx`
- Modify: `mobile/app/(tabs)/profile.tsx`

- [ ] **Step 1: Rewrite messages.tsx**

```tsx
import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import TopAppBar from '@components/TopAppBar';
import AvatarBadge from '@components/AvatarBadge';

const MOCK_CONVOS = [
  { id: '1', name: '委托方：星河影业', lastMsg: '样片看起来很棒！继续加油', time: '刚刚', unread: 2, online: true },
  { id: '2', name: '平台客服', lastMsg: '您的认证申请已通过审核', time: '10分钟前', unread: 1, online: false },
  { id: '3', name: '创作者：云上制作', lastMsg: '合同已签署，请查收', time: '1小时前', unread: 0, online: true },
  { id: '4', name: '委托方：光影科技', lastMsg: '期待您的方案', time: '昨天', unread: 0, online: false },
];

export default function MessagesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
      <TopAppBar title="消息" />
      <FlatList
        data={MOCK_CONVOS}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingTop: 56 + insets.top }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} onPress={() => router.push(`/chat/${item.id}`)} activeOpacity={0.9}>
            <AvatarBadge name={item.name} size={48} online={item.online} />
            <View style={styles.info}>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.time}>{item.time}</Text>
              </View>
              <View style={styles.msgRow}>
                <Text style={styles.lastMsg} numberOfLines={1}>{item.lastMsg}</Text>
                {item.unread > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{item.unread}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: '#E5E5EA', marginLeft: 76 },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  name: { fontSize: 15, fontFamily: 'Manrope_700Bold', color: '#1C1C1E', flex: 1 },
  time: { fontSize: 12, color: '#8A8A9A', fontFamily: 'Manrope_400Regular' },
  msgRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lastMsg: { fontSize: 13, color: '#8A8A9A', fontFamily: 'Manrope_400Regular', flex: 1 },
  unreadBadge: { backgroundColor: '#007AFF', borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5, marginLeft: 8 },
  unreadText: { fontSize: 11, color: '#FFFFFF', fontFamily: 'Manrope_700Bold' },
});
```

- [ ] **Step 2: Rewrite profile.tsx**

```tsx
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AvatarBadge from '@components/AvatarBadge';
import GlassCard from '@components/GlassCard';
import { mockWallet } from '@shared/data/mockExtended';

const MOCK_USER = { nickname: '创作者小明', bio: 'AI影视创作者 · Runway认证', verified: false };

const MENU_ITEMS = [
  { icon: 'file-document-outline', label: '我的合同', route: '/commission/contract' },
  { icon: 'folder-multiple-outline', label: '我的作品集', route: '/portfolio/1' },
  { icon: 'bell-outline', label: '通知中心', route: '/notification/1' },
  { icon: 'headset', label: '申诉与支持', route: '/support/appeal' },
  { icon: 'cog-outline', label: '设置', route: '/settings' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 32 }}>

        {/* Profile Header */}
        <View style={styles.header}>
          <AvatarBadge name={MOCK_USER.nickname} size={72} verified={MOCK_USER.verified} />
          <View style={styles.headerInfo}>
            <Text style={styles.name}>{MOCK_USER.nickname}</Text>
            <Text style={styles.bio}>{MOCK_USER.bio}</Text>
            {!MOCK_USER.verified && (
              <TouchableOpacity style={styles.verifyCTA} onPress={() => router.push('/onboarding/role')}>
                <Text style={styles.verifyCTAText}>完成认证</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Wallet Card */}
        <View style={styles.px}>
          <LinearGradient colors={['#007AFF', '#00C6FF']} style={styles.walletCard}>
            <Text style={styles.walletLabel}>可用余额</Text>
            <Text style={styles.walletBalance}>{mockWallet.balance}</Text>
            <View style={styles.walletRow}>
              <View>
                <Text style={styles.walletSubLabel}>冻结中</Text>
                <Text style={styles.walletSubValue}>{mockWallet.frozen}</Text>
              </View>
              <View>
                <Text style={styles.walletSubLabel}>累计收入</Text>
                <Text style={styles.walletSubValue}>{mockWallet.totalEarned}</Text>
              </View>
              <View>
                <Text style={styles.walletSubLabel}>待提现</Text>
                <Text style={styles.walletSubValue}>{mockWallet.pendingPayout}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Menu */}
        <View style={[styles.px, styles.menuBox]}>
          {MENU_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={item.route}
              style={[styles.menuItem, i < MENU_ITEMS.length - 1 && styles.menuSep]}
              onPress={() => router.push(item.route as any)}
            >
              <MaterialCommunityIcons name={item.icon as any} size={22} color="#007AFF" />
              <Text style={styles.menuLabel}>{item.label}</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#C7C7CC" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20, gap: 16 },
  headerInfo: { flex: 1 },
  name: { fontSize: 20, fontFamily: 'SpaceGrotesk_700Bold', color: '#1C1C1E', marginBottom: 4 },
  bio: { fontSize: 13, fontFamily: 'Manrope_400Regular', color: '#8A8A9A', marginBottom: 8 },
  verifyCTA: { backgroundColor: '#E5F3FF', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, alignSelf: 'flex-start' },
  verifyCTAText: { fontSize: 12, color: '#007AFF', fontFamily: 'Manrope_700Bold' },
  px: { paddingHorizontal: 16 },
  walletCard: { borderRadius: 16, padding: 20, marginBottom: 16 },
  walletLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontFamily: 'Manrope_400Regular', marginBottom: 6 },
  walletBalance: { fontSize: 32, fontFamily: 'SpaceGrotesk_700Bold', color: '#FFFFFF', marginBottom: 16 },
  walletRow: { flexDirection: 'row', justifyContent: 'space-between' },
  walletSubLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontFamily: 'Manrope_400Regular', textAlign: 'center', marginBottom: 4 },
  walletSubValue: { fontSize: 15, fontFamily: 'Manrope_700Bold', color: '#FFFFFF', textAlign: 'center' },
  menuBox: { backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 15, gap: 12 },
  menuSep: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E5EA' },
  menuLabel: { flex: 1, fontSize: 15, fontFamily: 'Manrope_600SemiBold', color: '#1C1C1E' },
});
```

- [ ] **Step 3: Commit**

```bash
git add mobile/app/(tabs)/messages.tsx mobile/app/(tabs)/profile.tsx
git commit -m "feat(mobile): messages _5 and profile _9 screens — Kinetic Azure"
```

---

## Task 18: Commission Screens (_12, _13, _10)

**Files:**
- Modify: `mobile/app/commission/new.tsx`
- Modify: `mobile/app/commission/[id].tsx`
- Modify: `mobile/app/commission/applicants.tsx`

- [ ] **Step 1: Read current new.tsx**

Read `mobile/app/commission/new.tsx` to capture existing form state logic, then rewrite with Kinetic Azure UI keeping all `useState` hooks and submit handler.

- [ ] **Step 2: Rewrite new.tsx (publish commission form _12)**

Replace JSX with:
- `PageLayout` wrapper with back button, title "发布企划"
- White card form sections: 基本信息, 预算与时间, 要求
- `KineticButton` for submit
- Keep all existing `useState`, `handleSubmit`, router logic

Key style changes:
- All inputs: `borderRadius: 12, borderColor: '#E5E5EA', fontFamily: 'Manrope_400Regular'`
- Section headers: `fontFamily: 'Manrope_700Bold', color: '#1C1C1E'`
- Submit button: `KineticButton label="发布企划" fullWidth`

- [ ] **Step 3: Rewrite [id].tsx (commission detail _13)**

Read `mobile/app/commission/[id].tsx` then rewrite UI:
- `TopAppBar showBack title={commission?.title}`
- Hero section: title, status pill, price bold `#007AFF`
- Detail cards: 委托方信息, 项目要求, 时间与预算
- Bottom action row: `KineticButton label="立即申请"` or "查看进度" based on role
- Keep existing `useCommission(id)` data hook

- [ ] **Step 4: Rewrite applicants.tsx (_10)**

Read `mobile/app/commission/applicants.tsx` then rewrite:
- `TopAppBar showBack title="申请者列表"`
- `FlatList` of applicant rows with `AvatarBadge`, name, tags, score
- Action buttons per row: "查看作品集" → `/portfolio/[id]`, "邀请合作"
- Keep existing data fetch

- [ ] **Step 5: Commit**

```bash
git add mobile/app/commission/new.tsx mobile/app/commission/[id].tsx mobile/app/commission/applicants.tsx
git commit -m "feat(mobile): commission screens _12 _13 _10 — Kinetic Azure"
```

---

## Task 19: New Commission Sub-screens (_3 Contract, _4 Review)

**Files:**
- Create: `mobile/app/commission/contract.tsx`
- Create: `mobile/app/commission/review.tsx`

- [ ] **Step 1: Create contract.tsx (_3)**

```tsx
import React from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import TopAppBar from '@components/TopAppBar';
import KineticButton from '@components/KineticButton';
import { mockContract } from '@shared/data/mockExtended';

export default function ContractScreen() {
  const c = mockContract;
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
      <TopAppBar showBack title="合同与托管" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        {/* Escrow Status */}
        <LinearGradient colors={['#007AFF', '#00C6FF']} style={styles.escrowCard}>
          <Text style={styles.escrowLabel}>托管金额</Text>
          <Text style={styles.escrowAmount}>{c.escrowAmount}</Text>
          <View style={styles.escrowBadge}>
            <MaterialCommunityIcons name="shield-check" size={14} color="#007AFF" />
            <Text style={styles.escrowBadgeText}>资金安全托管中</Text>
          </View>
        </LinearGradient>

        {/* Contract Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>合同信息</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>项目</Text>
            <Text style={styles.infoValue} numberOfLines={2}>{c.commissionTitle}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>总金额</Text>
            <Text style={[styles.infoValue, styles.priceText]}>{c.amount}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>签署时间</Text>
            <Text style={styles.infoValue}>{c.signedAt}</Text>
          </View>
        </View>

        {/* Milestones */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>里程碑</Text>
          {c.milestones.map((m, i) => (
            <View key={i} style={styles.milestone}>
              <View style={[styles.milestoneDot, m.status === 'done' ? styles.dotDone : styles.dotPending]} />
              <View style={styles.milestoneInfo}>
                <Text style={styles.milestoneLabel}>{m.label}</Text>
                <Text style={styles.milestoneDate}>{m.dueDate}</Text>
              </View>
              <Text style={[styles.milestoneAmount, m.status === 'done' && styles.amountDone]}>{m.amount}</Text>
            </View>
          ))}
        </View>

        <KineticButton label="下载合同" onPress={() => {}} variant="outline" fullWidth style={{ marginTop: 8 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },
  scroll: { flex: 1 },
  content: { paddingTop: 56 + 16, paddingHorizontal: 16, paddingBottom: 32, gap: 12 },
  escrowCard: { borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 4 },
  escrowLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontFamily: 'Manrope_400Regular', marginBottom: 6 },
  escrowAmount: { fontSize: 36, fontFamily: 'SpaceGrotesk_700Bold', color: '#FFFFFF', marginBottom: 12 },
  escrowBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  escrowBadgeText: { fontSize: 12, color: '#007AFF', fontFamily: 'Manrope_700Bold' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16 },
  cardTitle: { fontSize: 15, fontFamily: 'Manrope_700Bold', color: '#1C1C1E', marginBottom: 14 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  infoLabel: { fontSize: 13, color: '#8A8A9A', fontFamily: 'Manrope_400Regular' },
  infoValue: { fontSize: 13, color: '#1C1C1E', fontFamily: 'Manrope_600SemiBold', flex: 1, textAlign: 'right' },
  priceText: { color: '#007AFF' },
  milestone: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  milestoneDot: { width: 10, height: 10, borderRadius: 5 },
  dotDone: { backgroundColor: '#34C759' },
  dotPending: { backgroundColor: '#E5E5EA' },
  milestoneInfo: { flex: 1 },
  milestoneLabel: { fontSize: 14, fontFamily: 'Manrope_600SemiBold', color: '#1C1C1E' },
  milestoneDate: { fontSize: 12, color: '#8A8A9A', fontFamily: 'Manrope_400Regular' },
  milestoneAmount: { fontSize: 14, fontFamily: 'Manrope_700Bold', color: '#8A8A9A' },
  amountDone: { color: '#34C759' },
});
```

- [ ] **Step 2: Create review.tsx (_4)**

```tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import TopAppBar from '@components/TopAppBar';
import KineticButton from '@components/KineticButton';

const MOCK_SAMPLES = [
  { id: '1', title: '样片 A — 前10秒', duration: '0:10', status: 'pending' },
  { id: '2', title: '样片 B — 氛围版', duration: '0:15', status: 'pending' },
];

export default function SampleReviewScreen() {
  const [approved, setApproved] = useState<string[]>([]);

  const toggle = (id: string) => {
    setApproved(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const submit = () => {
    if (approved.length === 0) { Alert.alert('提示', '请至少选择一个样片'); return; }
    Alert.alert('验收完成', `已批准 ${approved.length} 个样片，款项将在24小时内释放`);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
      <TopAppBar showBack title="样片验收" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.hint}>请审核以下样片，选择满意的版本进行确认验收</Text>

        {MOCK_SAMPLES.map(s => (
          <TouchableOpacity key={s.id} style={[styles.sampleCard, approved.includes(s.id) && styles.sampleCardSelected]} onPress={() => toggle(s.id)} activeOpacity={0.9}>
            <View style={styles.sampleThumb}>
              <MaterialCommunityIcons name="play-circle-outline" size={32} color="#FFFFFF" />
            </View>
            <View style={styles.sampleInfo}>
              <Text style={styles.sampleTitle}>{s.title}</Text>
              <Text style={styles.sampleDuration}>{s.duration}</Text>
            </View>
            <MaterialCommunityIcons
              name={approved.includes(s.id) ? 'check-circle' : 'circle-outline'}
              size={24}
              color={approved.includes(s.id) ? '#007AFF' : '#C7C7CC'}
            />
          </TouchableOpacity>
        ))}

        <KineticButton label={`确认验收 (${approved.length})`} onPress={submit} fullWidth style={{ marginTop: 16 }} disabled={approved.length === 0} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },
  content: { paddingTop: 56 + 16, paddingHorizontal: 16, paddingBottom: 32 },
  hint: { fontSize: 14, color: '#8A8A9A', fontFamily: 'Manrope_400Regular', marginBottom: 20, lineHeight: 20 },
  sampleCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1.5, borderColor: 'transparent' },
  sampleCardSelected: { borderColor: '#007AFF', backgroundColor: '#F0F7FF' },
  sampleThumb: { width: 60, height: 60, borderRadius: 12, backgroundColor: '#007AFF', alignItems: 'center', justifyContent: 'center' },
  sampleInfo: { flex: 1 },
  sampleTitle: { fontSize: 14, fontFamily: 'Manrope_700Bold', color: '#1C1C1E', marginBottom: 4 },
  sampleDuration: { fontSize: 12, color: '#8A8A9A', fontFamily: 'Manrope_400Regular' },
});
```

- [ ] **Step 3: Commit**

```bash
git add mobile/app/commission/contract.tsx mobile/app/commission/review.tsx
git commit -m "feat(mobile): contract _3 and sample review _4 screens"
```

---

## Task 20: Portfolio Screens (_8, _6)

**Files:**
- Create: `mobile/app/portfolio/[id].tsx`
- Create: `mobile/app/portfolio/edit.tsx`

- [ ] **Step 1: Create portfolio/[id].tsx (_8)**

```tsx
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import TopAppBar from '@components/TopAppBar';
import AvatarBadge from '@components/AvatarBadge';
import { mockSampleWorks } from '@shared/data/mockExtended';

const { width } = Dimensions.get('window');

export default function PortfolioDetailScreen() {
  const router = useRouter();
  const work = mockSampleWorks[0];

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <TopAppBar showBack title={work.title} />
      <ScrollView contentContainerStyle={styles.content}>

        {/* Video placeholder */}
        <View style={styles.videoThumb}>
          <MaterialCommunityIcons name="play-circle" size={64} color="rgba(255,255,255,0.9)" />
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="eye-outline" size={16} color="#8A8A9A" />
            <Text style={styles.statText}>{work.views}</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="heart-outline" size={16} color="#8A8A9A" />
            <Text style={styles.statText}>{work.likes}</Text>
          </View>
        </View>

        {/* Author */}
        <View style={styles.authorRow}>
          <AvatarBadge name="创作者小明" size={40} verified />
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>创作者小明</Text>
            <Text style={styles.authorBio}>AI影视创作者</Text>
          </View>
          <TouchableOpacity style={styles.followBtn}>
            <Text style={styles.followBtnText}>关注</Text>
          </TouchableOpacity>
        </View>

        {/* Description */}
        <View style={styles.descCard}>
          <Text style={styles.descTitle}>作品介绍</Text>
          <Text style={styles.desc}>使用 Sora + ComfyUI 生成，融合星际概念与中国科幻美学，制作周期 3 天，累计渲染时长 48 小时。</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },
  content: { paddingTop: 56, paddingBottom: 32 },
  videoThumb: { width, height: width * 0.56, backgroundColor: '#1C1C1E', alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', gap: 20, padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E5EA' },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { fontSize: 14, color: '#8A8A9A', fontFamily: 'Manrope_600SemiBold' },
  authorRow: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFFFFF', gap: 12, marginTop: 8, borderRadius: 16, marginHorizontal: 16 },
  authorInfo: { flex: 1 },
  authorName: { fontSize: 15, fontFamily: 'Manrope_700Bold', color: '#1C1C1E' },
  authorBio: { fontSize: 12, color: '#8A8A9A', fontFamily: 'Manrope_400Regular' },
  followBtn: { backgroundColor: '#007AFF', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  followBtnText: { fontSize: 13, color: '#FFFFFF', fontFamily: 'Manrope_700Bold' },
  descCard: { margin: 16, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16 },
  descTitle: { fontSize: 15, fontFamily: 'Manrope_700Bold', color: '#1C1C1E', marginBottom: 8 },
  desc: { fontSize: 14, color: '#3A3A3C', fontFamily: 'Manrope_400Regular', lineHeight: 22 },
});
```

- [ ] **Step 2: Create portfolio/edit.tsx (_6)**

```tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import TopAppBar from '@components/TopAppBar';
import KineticButton from '@components/KineticButton';

export default function PortfolioEditScreen() {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [mediaUri, setMediaUri] = useState<string | null>(null);

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, quality: 0.8 });
    if (!result.canceled) setMediaUri(result.assets[0].uri);
  };

  const submit = () => {
    if (!title) { Alert.alert('提示', '请填写作品标题'); return; }
    Alert.alert('发布成功', '作品已提交审核');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
      <TopAppBar showBack title="编辑作品" />
      <ScrollView contentContainerStyle={styles.content}>

        {/* Media upload area */}
        <TouchableOpacity style={styles.uploadArea} onPress={pickMedia} activeOpacity={0.8}>
          {mediaUri ? (
            <Text style={styles.uploadedText}>已选择媒体文件</Text>
          ) : (
            <>
              <MaterialCommunityIcons name="cloud-upload-outline" size={40} color="#C7C7CC" />
              <Text style={styles.uploadHint}>点击上传视频或图片</Text>
              <Text style={styles.uploadSub}>支持 MP4、MOV、JPG、PNG</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.label}>作品标题</Text>
          <TextInput
            style={styles.input}
            placeholder="给你的作品起个名字"
            placeholderTextColor="#C7C7CC"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>作品描述</Text>
          <TextInput
            style={[styles.input, styles.inputMulti]}
            placeholder="介绍制作过程、使用的AI工具等"
            placeholderTextColor="#C7C7CC"
            value={desc}
            onChangeText={setDesc}
            multiline
            numberOfLines={4}
          />
        </View>

        <KineticButton label="发布作品" onPress={submit} fullWidth style={{ marginTop: 8 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },
  content: { paddingTop: 56 + 16, paddingHorizontal: 16, paddingBottom: 32, gap: 12 },
  uploadArea: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1.5, borderColor: '#E5E5EA', borderStyle: 'dashed', padding: 40, alignItems: 'center', gap: 8 },
  uploadHint: { fontSize: 15, fontFamily: 'Manrope_700Bold', color: '#3A3A3C' },
  uploadSub: { fontSize: 12, color: '#8A8A9A', fontFamily: 'Manrope_400Regular' },
  uploadedText: { fontSize: 14, color: '#34C759', fontFamily: 'Manrope_700Bold' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, gap: 4 },
  label: { fontSize: 13, fontFamily: 'Manrope_700Bold', color: '#1C1C1E', marginBottom: 8, marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1C1C1E', fontFamily: 'Manrope_400Regular', backgroundColor: '#F8F8F8' },
  inputMulti: { height: 100, textAlignVertical: 'top' },
});
```

- [ ] **Step 3: Commit**

```bash
git add mobile/app/portfolio/[id].tsx mobile/app/portfolio/edit.tsx
git commit -m "feat(mobile): portfolio detail _8 and editor _6 screens"
```

---

## Task 21: Notification + Appeal Screens (_1, _7)

**Files:**
- Create: `mobile/app/notification/[id].tsx`
- Create: `mobile/app/support/appeal.tsx`

- [ ] **Step 1: Create notification/[id].tsx (_1)**

```tsx
import React from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import TopAppBar from '@components/TopAppBar';
import { mockNotifications } from '@shared/data/mockExtended';

const iconMap = {
  commission: { name: 'file-document-outline', color: '#007AFF', bg: '#E5F3FF' },
  payment: { name: 'currency-cny', color: '#34C759', bg: '#D1F2D1' },
  review: { name: 'star-outline', color: '#FF9500', bg: '#FFF3CD' },
  system: { name: 'bell-outline', color: '#8A8A9A', bg: '#F3F4F5' },
};

export default function NotificationDetailScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
      <TopAppBar showBack title="通知" />
      <ScrollView contentContainerStyle={styles.content}>
        {mockNotifications.map(n => {
          const ic = iconMap[n.type];
          return (
            <View key={n.id} style={[styles.card, !n.read && styles.cardUnread]}>
              <View style={[styles.iconBox, { backgroundColor: ic.bg }]}>
                <MaterialCommunityIcons name={ic.name as any} size={22} color={ic.color} />
              </View>
              <View style={styles.info}>
                <View style={styles.titleRow}>
                  <Text style={styles.title}>{n.title}</Text>
                  {!n.read && <View style={styles.dot} />}
                </View>
                <Text style={styles.body}>{n.body}</Text>
                <Text style={styles.time}>{n.time}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },
  content: { paddingTop: 56 + 8, paddingHorizontal: 16, paddingBottom: 32, gap: 10 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, flexDirection: 'row', gap: 14 },
  cardUnread: { borderLeftWidth: 3, borderLeftColor: '#007AFF' },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 8 },
  title: { fontSize: 14, fontFamily: 'Manrope_700Bold', color: '#1C1C1E', flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#007AFF' },
  body: { fontSize: 13, color: '#3A3A3C', fontFamily: 'Manrope_400Regular', lineHeight: 19, marginBottom: 6 },
  time: { fontSize: 11, color: '#C7C7CC', fontFamily: 'Manrope_400Regular' },
});
```

- [ ] **Step 2: Create support/appeal.tsx (_7)**

```tsx
import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, StatusBar, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import TopAppBar from '@components/TopAppBar';
import KineticButton from '@components/KineticButton';

const APPEAL_TYPES = ['付款纠纷', '质量争议', '违约问题', '账号问题', '其他'];

export default function AppealSupportScreen() {
  const [type, setType] = useState('');
  const [desc, setDesc] = useState('');

  const submit = () => {
    if (!type || !desc) { Alert.alert('提示', '请选择问题类型并描述'); return; }
    Alert.alert('申诉已提交', '我们将在48小时内处理您的申诉，请保持通知开启。');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
      <TopAppBar showBack title="申诉与支持" />
      <ScrollView contentContainerStyle={styles.content}>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>问题类型</Text>
          <View style={styles.typeGrid}>
            {APPEAL_TYPES.map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.typeChip, type === t && styles.typeChipSelected]}
                onPress={() => setType(t)}
              >
                <Text style={[styles.typeText, type === t && styles.typeTextSelected]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>问题描述</Text>
          <TextInput
            style={styles.textarea}
            placeholder="请详细描述您遇到的问题，包括相关订单号、截图等信息..."
            placeholderTextColor="#C7C7CC"
            value={desc}
            onChangeText={setDesc}
            multiline
            numberOfLines={6}
          />
        </View>

        <View style={styles.infoBox}>
          <MaterialCommunityIcons name="information-outline" size={16} color="#007AFF" />
          <Text style={styles.infoText}>申诉处理时间：工作日 48 小时内，节假日顺延</Text>
        </View>

        <KineticButton label="提交申诉" onPress={submit} fullWidth />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },
  content: { paddingTop: 56 + 16, paddingHorizontal: 16, paddingBottom: 32, gap: 12 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16 },
  sectionLabel: { fontSize: 14, fontFamily: 'Manrope_700Bold', color: '#1C1C1E', marginBottom: 12 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F5', borderWidth: 1, borderColor: '#E5E5EA' },
  typeChipSelected: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  typeText: { fontSize: 13, fontFamily: 'Manrope_600SemiBold', color: '#3A3A3C' },
  typeTextSelected: { color: '#FFFFFF' },
  textarea: { borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 12, padding: 12, fontSize: 14, color: '#1C1C1E', fontFamily: 'Manrope_400Regular', height: 130, textAlignVertical: 'top', backgroundColor: '#F8F8F8' },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#E5F3FF', borderRadius: 12, padding: 12 },
  infoText: { flex: 1, fontSize: 13, color: '#007AFF', fontFamily: 'Manrope_400Regular', lineHeight: 18 },
});
```

- [ ] **Step 3: Commit**

```bash
git add mobile/app/notification/[id].tsx mobile/app/support/appeal.tsx
git commit -m "feat(mobile): notification detail _1 and appeal support _7 screens"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| Kinetic Azure tokens | Task 2 |
| Space Grotesk + Manrope fonts | Task 3 |
| 9 shared components | Tasks 4–9 |
| New route groups registered | Task 3 |
| _17 Login | Task 12 |
| _16 Role select | Task 13 |
| _2 Workbench | Task 14 |
| _11 Plaza | Task 15 |
| _14+_15 Discover | Task 16 |
| _5 Messages | Task 17 |
| _9 Profile | Task 17 |
| _12 _13 _10 Commission | Task 18 |
| _3 Contract | Task 19 |
| _4 Review | Task 19 |
| _8 _6 Portfolio | Task 20 |
| _1 Notification | Task 21 |
| _7 Appeal | Task 21 |
| mockExtended data | Task 10 |

All 17 screens covered. No TBD, no TODO.

**Placeholder scan:** None found. All code blocks complete.

**Type consistency:**
- `mockWallet`, `mockAIEfficiency`, `mockSampleWorks`, `mockNotifications`, `mockContract` — all defined in Task 10, referenced correctly in Tasks 16, 17, 19, 21.
- `KineticButton` props: `label`, `onPress`, `variant?`, `disabled?`, `fullWidth?`, `style?` — consistent across all usages.
- `TopAppBar` props: `title?`, `showLogo?`, `showBack?`, `rightElement?` — consistent.
- `AvatarBadge` props: `name`, `size?`, `imageUri?`, `verified?`, `online?` — consistent.
- `FilterChips` props: `options`, `selected`, `onSelect` — consistent.
