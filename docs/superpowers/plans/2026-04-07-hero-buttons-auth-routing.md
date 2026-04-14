# Hero Buttons Auth-Aware Routing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the two hero section buttons ("我是需求方" / "我是创作者") route to registration, the correct dashboard/action page, or show a toast based on auth state and user role.

**Architecture:** Add click handlers to `HeroSection` using `useAuth` (existing context) and `useNavigate` (react-router-dom). Update `Register` to read a `?role=` query param to pre-select the role. No new files needed.

**Tech Stack:** React, react-router-dom v6, sonner (toast), existing `AuthContext`

---

## File Map

| File | Change |
|------|--------|
| `src/components/HeroSection.tsx` | Add `useAuth`, `useNavigate`, `toast` imports; add two click handlers; wire to buttons |
| `src/pages/Register.tsx` | Add `useSearchParams`; initialise `role` state from `?role=` query param |

---

### Task 1: Add auth-aware click handlers to HeroSection

**Files:**
- Modify: `src/components/HeroSection.tsx`

- [ ] **Step 1: Replace the file content**

Open `src/components/HeroSection.tsx` and replace with:

```tsx
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const videos = ["/hero-bg.mp4", "/hero-bg2.mp4"];

const HeroSection = () => {
  const [current, setCurrent] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  function handleEnded() {
    setCurrent((prev) => (prev + 1) % videos.length);
  }

  function goTo(index: number) {
    setCurrent(index);
  }

  function handleClient() {
    if (!user) {
      navigate("/register?role=client");
    } else if (user.role === "client") {
      navigate("/commissions/new");
    } else {
      toast.error("您已是创作者账号，无法切换角色");
    }
  }

  function handleAigcer() {
    if (!user) {
      navigate("/register?role=aigcer");
    } else if (user.role === "aigcer") {
      navigate("/commissions");
    } else {
      toast.error("您已是需求方账号，无法切换角色");
    }
  }

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{
        height: "92vh",
        borderRadius: "0 0 50% 50% / 0 0 80px 80px",
      }}
    >
      <video
        ref={videoRef}
        key={current}
        autoPlay
        muted
        playsInline
        onEnded={handleEnded}
        className="absolute inset-0 w-full h-full object-cover object-center"
      >
        <source src={videos[current]} type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

      {/* 内容垂直居中，整体偏下 */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-white"
        style={{ paddingTop: "20vh" }}
      >
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-5 drop-shadow-lg text-center leading-tight">
          找好承制方，完成需求，就这么简单！
        </h1>
        <p className="text-base md:text-lg opacity-90 mb-2 drop-shadow text-center">
          仅需3分钟发布需求，即可收到数十位AIGCer应征。
        </p>
        <p className="text-base md:text-lg opacity-90 mb-10 drop-shadow text-center">
          70000余位精选AIGCer在此等待，只为制作属于您的精彩AI影片。
        </p>
        <div className="flex gap-8">
          <Button
            size="lg"
            onClick={handleClient}
            className="px-14 py-4 h-auto rounded-full text-lg font-semibold bg-primary hover:bg-primary/90 shadow-xl"
          >
            我是需求方
          </Button>
          <Button
            size="lg"
            onClick={handleAigcer}
            className="px-14 py-4 h-auto rounded-full text-lg font-semibold bg-primary hover:bg-primary/90 shadow-xl"
          >
            我是创作者
          </Button>
        </div>
      </div>

      {/* 轮播指示点 */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        {videos.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              i === current ? "bg-white w-6" : "bg-white/50"
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSection;
```

- [ ] **Step 2: Commit**

```bash
git add src/components/HeroSection.tsx
git commit -m "feat: add auth-aware routing to hero section buttons"
```

---

### Task 2: Pre-select role in Register page from query param

**Files:**
- Modify: `src/pages/Register.tsx`

- [ ] **Step 1: Add `useSearchParams` and initialise role from query param**

In `src/pages/Register.tsx`, make these two targeted changes:

**Change 1** — add `useSearchParams` to the react-router-dom import:
```tsx
// Before:
import { Link, useNavigate } from "react-router-dom";

// After:
import { Link, useNavigate, useSearchParams } from "react-router-dom";
```

**Change 2** — replace the `role` state initialisation inside the `Register` component:
```tsx
// Before:
const [role, setRole] = useState<UserRole>('aigcer');

// After:
const [searchParams] = useSearchParams();
const initialRole = searchParams.get('role') === 'client' ? 'client' : 'aigcer';
const [role, setRole] = useState<UserRole>(initialRole);
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Register.tsx
git commit -m "feat: pre-select role in register page from query param"
```

---

### Task 3: Build and deploy

- [ ] **Step 1: Build**

```bash
npm run build
```

Expected: `✓ built in X.XXs` with no errors.

- [ ] **Step 2: Deploy to server**

```bash
npm install ssh2 --no-save
node deploy.mjs
```

Expected: `✓ Deployment complete! Site: http://47.86.30.22`

- [ ] **Step 3: Verify in browser**

Open `http://47.86.30.22`:
- Click "我是需求方" while logged out → lands on `/register` with "我是需求方（需求方）" pre-selected
- Click "我是创作者" while logged out → lands on `/register` with "我是AIGCer（创作者）" pre-selected
- Log in as a `client`, click "我是创作者" → toast "您已是需求方账号，无法切换角色"
- Log in as an `aigcer`, click "我是需求方" → toast "您已是创作者账号，无法切换角色"
