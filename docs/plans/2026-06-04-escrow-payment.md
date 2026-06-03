# Escrow Payment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a demonstrable escrow payment flow that lets project owners configure milestone payment ratios, simulate funding, and release funds automatically when delivery milestones are confirmed.

**Architecture:** Add a dedicated escrow domain with TypeScript types, an `escrowService` that mirrors the existing Supabase-first/localStorage-fallback pattern, and a CommissionDetail escrow panel wired into the existing delivery confirmation flow. Supabase schema changes define durable tables for plans, milestones, and release records, while localStorage keeps the feature runnable without a configured backend.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, TanStack Query, Supabase, Tailwind CSS, shadcn/ui.

---

### Task 1: Add Escrow Domain Types

**Files:**
- Create: `src/types/escrow.ts`
- Test: `src/test/services/escrowService.test.ts`

**Step 1: Write the failing test**

Create `src/test/services/escrowService.test.ts` with the first behavior:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: false,
  supabase: {},
}));

describe('escrowService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it('creates default milestones whose percentages add up to 100', async () => {
    const { createEscrowDraft } = await import('@/services/escrowService');

    const draft = await createEscrowDraft({
      commissionId: 1,
      totalAmount: 10000,
      createdById: 'client-1',
    });

    expect(draft.plan.status).toBe('draft');
    expect(draft.plan.totalAmount).toBe(10000);
    expect(draft.milestones.length).toBeGreaterThan(0);
    expect(draft.milestones.reduce((sum, item) => sum + item.percent, 0)).toBe(100);
    expect(draft.milestones.reduce((sum, item) => sum + item.amount, 0)).toBe(10000);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/test/services/escrowService.test.ts`

Expected: FAIL because `@/services/escrowService` does not exist.

**Step 3: Add types**

Create `src/types/escrow.ts`:

```ts
export type EscrowPlanStatus = 'draft' | 'funded' | 'completed';
export type EscrowMilestoneStatus = 'pending' | 'released';

export interface EscrowPlan {
  id: string;
  commissionId: number;
  totalAmount: number;
  currency: 'CNY';
  status: EscrowPlanStatus;
  releasedAmount: number;
  createdById: string;
  fundedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EscrowMilestone {
  id: string;
  planId: string;
  commissionId: number;
  stageId: string;
  stageLabel: string;
  percent: number;
  amount: number;
  status: EscrowMilestoneStatus;
  releasedAt?: string;
}

export interface EscrowRelease {
  id: string;
  planId: string;
  commissionId: number;
  milestoneId: string;
  stageId: string;
  stageLabel: string;
  amount: number;
  releasedById: string;
  releasedToId: string;
  createdAt: string;
}

export interface EscrowBundle {
  plan: EscrowPlan;
  milestones: EscrowMilestone[];
  releases: EscrowRelease[];
}
```

**Step 4: Run test**

Run: `npm test -- src/test/services/escrowService.test.ts`

Expected: still FAIL because `escrowService` has not been created.

---

### Task 2: Create Local Escrow Draft Service

**Files:**
- Create: `src/services/escrowService.ts`
- Modify: `src/test/services/escrowService.test.ts`

**Step 1: Write the failing test**

Extend the test file:

```ts
it('returns an existing draft instead of creating duplicate plans for the same commission', async () => {
  const { createEscrowDraft } = await import('@/services/escrowService');

  const first = await createEscrowDraft({ commissionId: 1, totalAmount: 10000, createdById: 'client-1' });
  const second = await createEscrowDraft({ commissionId: 1, totalAmount: 12000, createdById: 'client-1' });

  expect(second.plan.id).toBe(first.plan.id);
  expect(second.plan.totalAmount).toBe(10000);
  expect(second.milestones).toHaveLength(first.milestones.length);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/test/services/escrowService.test.ts`

Expected: FAIL because service functions do not exist.

**Step 3: Implement minimal service**

Create `src/services/escrowService.ts` with:

```ts
import { projectStages } from '@/services/commissionService';
import { EscrowBundle, EscrowMilestone, EscrowPlan, EscrowRelease } from '@/types/escrow';

const PLANS_KEY = 'visionai.escrowPlans';
const MILESTONES_KEY = 'visionai.escrowMilestones';
const RELEASES_KEY = 'visionai.escrowReleases';

export interface CreateEscrowDraftInput {
  commissionId: number;
  totalAmount: number;
  createdById: string;
}

function readStored<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStored<T>(key: string, value: T) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(key, JSON.stringify(value));
  }
}

function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function localPlans() {
  return readStored<EscrowPlan[]>(PLANS_KEY, []);
}

function saveLocalPlans(plans: EscrowPlan[]) {
  writeStored(PLANS_KEY, plans);
}

function localMilestones() {
  return readStored<EscrowMilestone[]>(MILESTONES_KEY, []);
}

function saveLocalMilestones(milestones: EscrowMilestone[]) {
  writeStored(MILESTONES_KEY, milestones);
}

function localReleases() {
  return readStored<EscrowRelease[]>(RELEASES_KEY, []);
}

function buildMilestones(plan: EscrowPlan): EscrowMilestone[] {
  const base = Math.floor((100 / projectStages.length) * 100) / 100;
  let usedPercent = 0;
  let usedAmount = 0;

  return projectStages.map((stage, index) => {
    const isLast = index === projectStages.length - 1;
    const percent = isLast ? Number((100 - usedPercent).toFixed(2)) : base;
    const amount = isLast
      ? Number((plan.totalAmount - usedAmount).toFixed(2))
      : Number(((plan.totalAmount * percent) / 100).toFixed(2));

    usedPercent = Number((usedPercent + percent).toFixed(2));
    usedAmount = Number((usedAmount + amount).toFixed(2));

    return {
      id: generateId('escrow-milestone'),
      planId: plan.id,
      commissionId: plan.commissionId,
      stageId: stage.id,
      stageLabel: stage.label,
      percent,
      amount,
      status: 'pending',
    };
  });
}

export async function createEscrowDraft(input: CreateEscrowDraftInput): Promise<EscrowBundle> {
  const existing = localPlans().find((plan) => plan.commissionId === input.commissionId);
  if (existing) {
    return {
      plan: existing,
      milestones: localMilestones().filter((item) => item.planId === existing.id),
      releases: localReleases().filter((item) => item.planId === existing.id),
    };
  }

  const now = new Date().toISOString();
  const plan: EscrowPlan = {
    id: generateId('escrow-plan'),
    commissionId: input.commissionId,
    totalAmount: input.totalAmount,
    currency: 'CNY',
    status: 'draft',
    releasedAmount: 0,
    createdById: input.createdById,
    createdAt: now,
    updatedAt: now,
  };
  const milestones = buildMilestones(plan);

  saveLocalPlans([plan, ...localPlans()]);
  saveLocalMilestones([...milestones, ...localMilestones()]);

  return { plan, milestones, releases: [] };
}
```

**Step 4: Run test**

Run: `npm test -- src/test/services/escrowService.test.ts`

Expected: PASS for draft creation tests.

---

### Task 3: Add Funding Validation and Milestone Updates

**Files:**
- Modify: `src/services/escrowService.ts`
- Modify: `src/test/services/escrowService.test.ts`

**Step 1: Write failing tests**

Add tests:

```ts
it('rejects funding when milestone percentages do not add up to 100', async () => {
  const { createEscrowDraft, updateEscrowMilestones, fundEscrowPlan } = await import('@/services/escrowService');

  const draft = await createEscrowDraft({ commissionId: 1, totalAmount: 10000, createdById: 'client-1' });
  await updateEscrowMilestones(draft.plan.id, [
    { milestoneId: draft.milestones[0].id, percent: 50 },
    { milestoneId: draft.milestones[1].id, percent: 40 },
  ]);

  await expect(fundEscrowPlan(draft.plan.id)).rejects.toThrow('付款比例合计必须等于 100%');
});

it('funds a valid draft plan', async () => {
  const { createEscrowDraft, fundEscrowPlan } = await import('@/services/escrowService');

  const draft = await createEscrowDraft({ commissionId: 1, totalAmount: 10000, createdById: 'client-1' });
  const funded = await fundEscrowPlan(draft.plan.id);

  expect(funded.plan.status).toBe('funded');
  expect(funded.plan.fundedAt).toBeTruthy();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/test/services/escrowService.test.ts`

Expected: FAIL because `updateEscrowMilestones` and `fundEscrowPlan` do not exist.

**Step 3: Implement minimal functions**

Add to `src/services/escrowService.ts`:

```ts
export interface MilestonePercentUpdate {
  milestoneId: string;
  percent: number;
}

function bundleForPlan(plan: EscrowPlan): EscrowBundle {
  return {
    plan,
    milestones: localMilestones().filter((item) => item.planId === plan.id),
    releases: localReleases().filter((item) => item.planId === plan.id),
  };
}

function assertPercentTotal(milestones: EscrowMilestone[]) {
  const total = Number(milestones.reduce((sum, item) => sum + item.percent, 0).toFixed(2));
  if (total !== 100) throw new Error('付款比例合计必须等于 100%');
}

function recalculateMilestoneAmounts(plan: EscrowPlan, milestones: EscrowMilestone[]) {
  let usedAmount = 0;
  return milestones.map((item, index) => {
    const isLast = index === milestones.length - 1;
    const amount = isLast
      ? Number((plan.totalAmount - usedAmount).toFixed(2))
      : Number(((plan.totalAmount * item.percent) / 100).toFixed(2));
    usedAmount = Number((usedAmount + amount).toFixed(2));
    return { ...item, amount };
  });
}

export async function updateEscrowMilestones(
  planId: string,
  updates: MilestonePercentUpdate[],
): Promise<EscrowBundle> {
  const plan = localPlans().find((item) => item.id === planId);
  if (!plan) throw new Error('托管计划不存在');
  if (plan.status !== 'draft') throw new Error('已托管计划不能修改付款比例');

  const updateMap = new Map(updates.map((item) => [item.milestoneId, item.percent]));
  const milestonesForPlan = localMilestones().filter((item) => item.planId === planId);
  const updatedForPlan = recalculateMilestoneAmounts(
    plan,
    milestonesForPlan.map((item) => ({
      ...item,
      percent: updateMap.has(item.id) ? updateMap.get(item.id)! : item.percent,
    })),
  );

  saveLocalMilestones([
    ...updatedForPlan,
    ...localMilestones().filter((item) => item.planId !== planId),
  ]);

  return bundleForPlan(plan);
}

export async function fundEscrowPlan(planId: string): Promise<EscrowBundle> {
  const plan = localPlans().find((item) => item.id === planId);
  if (!plan) throw new Error('托管计划不存在');
  if (plan.totalAmount <= 0) throw new Error('托管金额必须大于 0');

  const milestones = localMilestones().filter((item) => item.planId === planId);
  assertPercentTotal(milestones);

  const now = new Date().toISOString();
  const funded: EscrowPlan = { ...plan, status: 'funded', fundedAt: now, updatedAt: now };
  saveLocalPlans(localPlans().map((item) => (item.id === planId ? funded : item)));

  return bundleForPlan(funded);
}
```

**Step 4: Run test**

Run: `npm test -- src/test/services/escrowService.test.ts`

Expected: PASS.

---

### Task 4: Add Release Logic

**Files:**
- Modify: `src/services/escrowService.ts`
- Modify: `src/test/services/escrowService.test.ts`

**Step 1: Write failing tests**

Add tests:

```ts
it('releases a funded milestone once', async () => {
  const { createEscrowDraft, fundEscrowPlan, releaseEscrowMilestone } = await import('@/services/escrowService');

  const draft = await createEscrowDraft({ commissionId: 1, totalAmount: 10000, createdById: 'client-1' });
  await fundEscrowPlan(draft.plan.id);

  const first = await releaseEscrowMilestone({
    commissionId: 1,
    stageId: draft.milestones[0].stageId,
    releasedById: 'client-1',
    releasedToId: 'aigcer-1',
  });
  const second = await releaseEscrowMilestone({
    commissionId: 1,
    stageId: draft.milestones[0].stageId,
    releasedById: 'client-1',
    releasedToId: 'aigcer-1',
  });

  expect(first.releases).toHaveLength(1);
  expect(second.releases).toHaveLength(1);
  expect(second.plan.releasedAmount).toBe(first.plan.releasedAmount);
  expect(second.milestones[0].status).toBe('released');
});

it('marks the plan completed after all milestones are released', async () => {
  const { createEscrowDraft, fundEscrowPlan, releaseEscrowMilestone } = await import('@/services/escrowService');

  const draft = await createEscrowDraft({ commissionId: 1, totalAmount: 10000, createdById: 'client-1' });
  await fundEscrowPlan(draft.plan.id);

  let bundle = draft;
  for (const milestone of draft.milestones) {
    bundle = await releaseEscrowMilestone({
      commissionId: 1,
      stageId: milestone.stageId,
      releasedById: 'client-1',
      releasedToId: 'aigcer-1',
    });
  }

  expect(bundle.plan.status).toBe('completed');
  expect(bundle.plan.releasedAmount).toBe(10000);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/test/services/escrowService.test.ts`

Expected: FAIL because `releaseEscrowMilestone` does not exist.

**Step 3: Implement release**

Add to `src/services/escrowService.ts`:

```ts
export interface ReleaseEscrowMilestoneInput {
  commissionId: number;
  stageId: string;
  releasedById: string;
  releasedToId: string;
}

export async function getEscrowBundleByCommission(commissionId: number): Promise<EscrowBundle | null> {
  const plan = localPlans().find((item) => item.commissionId === commissionId);
  return plan ? bundleForPlan(plan) : null;
}

export async function releaseEscrowMilestone(input: ReleaseEscrowMilestoneInput): Promise<EscrowBundle> {
  const plan = localPlans().find((item) => item.commissionId === input.commissionId);
  if (!plan) throw new Error('托管计划不存在');
  if (plan.status !== 'funded' && plan.status !== 'completed') throw new Error('托管计划尚未确认');

  const milestones = localMilestones().filter((item) => item.planId === plan.id);
  const milestone = milestones.find((item) => item.stageId === input.stageId);
  if (!milestone) throw new Error('托管节点不存在');
  if (milestone.status === 'released') return bundleForPlan(plan);

  const now = new Date().toISOString();
  const release: EscrowRelease = {
    id: generateId('escrow-release'),
    planId: plan.id,
    commissionId: plan.commissionId,
    milestoneId: milestone.id,
    stageId: milestone.stageId,
    stageLabel: milestone.stageLabel,
    amount: milestone.amount,
    releasedById: input.releasedById,
    releasedToId: input.releasedToId,
    createdAt: now,
  };

  const updatedMilestones = localMilestones().map((item) => (
    item.id === milestone.id ? { ...item, status: 'released' as const, releasedAt: now } : item
  ));
  saveLocalMilestones(updatedMilestones);

  const milestonesForPlan = updatedMilestones.filter((item) => item.planId === plan.id);
  const releasedAmount = Number(milestonesForPlan
    .filter((item) => item.status === 'released')
    .reduce((sum, item) => sum + item.amount, 0)
    .toFixed(2));
  const completed = milestonesForPlan.every((item) => item.status === 'released');
  const updatedPlan: EscrowPlan = {
    ...plan,
    releasedAmount,
    status: completed ? 'completed' : 'funded',
    completedAt: completed ? now : plan.completedAt,
    updatedAt: now,
  };

  saveLocalPlans(localPlans().map((item) => (item.id === plan.id ? updatedPlan : item)));
  writeStored(RELEASES_KEY, [release, ...localReleases()]);

  return bundleForPlan(updatedPlan);
}
```

**Step 4: Run test**

Run: `npm test -- src/test/services/escrowService.test.ts`

Expected: PASS.

---

### Task 5: Add Supabase Schema

**Files:**
- Modify: `supabase/p0-production-schema.sql`

**Step 1: Add schema**

Append SQL after existing project delivery/dispute tables:

```sql
create table if not exists public.escrow_plans (
  id text primary key default gen_random_uuid()::text,
  commission_id bigint not null references public.commissions(id) on delete cascade,
  total_amount numeric not null check (total_amount > 0),
  currency text not null default 'CNY',
  status text not null default 'draft' check (status in ('draft', 'funded', 'completed')),
  released_amount numeric not null default 0,
  created_by_id text not null,
  funded_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.escrow_milestones (
  id text primary key default gen_random_uuid()::text,
  plan_id text not null references public.escrow_plans(id) on delete cascade,
  commission_id bigint not null references public.commissions(id) on delete cascade,
  stage_id text not null,
  stage_label text not null,
  percent numeric not null check (percent >= 0),
  amount numeric not null check (amount >= 0),
  status text not null default 'pending' check (status in ('pending', 'released')),
  released_at timestamptz
);

create table if not exists public.escrow_releases (
  id text primary key default gen_random_uuid()::text,
  plan_id text not null references public.escrow_plans(id) on delete cascade,
  commission_id bigint not null references public.commissions(id) on delete cascade,
  milestone_id text not null references public.escrow_milestones(id) on delete cascade,
  stage_id text not null,
  stage_label text not null,
  amount numeric not null check (amount >= 0),
  released_by_id text not null,
  released_to_id text not null,
  created_at timestamptz not null default now()
);
```

**Step 2: Add indexes and RLS**

Add indexes and policies following the same “project parties plus admins” pattern already used for `project_progress` and `project_deliverables`.

**Step 3: Verify SQL text**

Run: `rg -n "escrow_plans|escrow_milestones|escrow_releases" supabase/p0-production-schema.sql`

Expected: all three tables and policy blocks appear.

---

### Task 6: Add Supabase Mapping and Fallback Paths

**Files:**
- Modify: `src/services/escrowService.ts`
- Modify: `src/test/services/escrowService.test.ts`

**Step 1: Write failing fallback test**

Add a test that mocks `isSupabaseConfigured: true` with failed table calls and proves local fallback still works.

```ts
it('falls back to local storage when remote escrow tables are unavailable', async () => {
  vi.doMock('@/lib/supabase', () => ({
    isSupabaseConfigured: true,
    supabase: {
      from: () => ({
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: new Error('offline') }) }) }),
        insert: () => ({ select: () => ({ single: async () => ({ data: null, error: new Error('offline') }) }) }),
      }),
    },
  }));
  vi.resetModules();

  const { createEscrowDraft } = await import('@/services/escrowService');
  const draft = await createEscrowDraft({ commissionId: 1, totalAmount: 10000, createdById: 'client-1' });

  expect(draft.plan.status).toBe('draft');
  expect(draft.milestones.length).toBeGreaterThan(0);
});
```

**Step 2: Run test to verify it fails or exposes missing remote branch**

Run: `npm test -- src/test/services/escrowService.test.ts`

Expected: FAIL until service imports Supabase and has a fallback wrapper.

**Step 3: Implement remote-aware wrappers**

Update `escrowService.ts` to:

- Import `isSupabaseConfigured` and `supabase`.
- Add `withFallback<T>(remote, fallback)` helper.
- Add row mappers for plans, milestones, releases.
- Make `getEscrowBundleByCommission`, `createEscrowDraft`, `fundEscrowPlan`, `updateEscrowMilestones`, and `releaseEscrowMilestone` attempt Supabase first when configured.
- Preserve local writes after successful remote calls so UI has consistent fallback state.

**Step 4: Run tests**

Run: `npm test -- src/test/services/escrowService.test.ts`

Expected: PASS.

---

### Task 7: Wire Escrow UI Into Commission Detail

**Files:**
- Modify: `src/pages/CommissionDetail.tsx`

**Step 1: Add queries and state**

Use existing `useQuery` and `useMutation` patterns:

- Query key: `['escrow', commissionId]`.
- Load with `getEscrowBundleByCommission(commissionId)`.
- Add local state for editable total amount and milestone percentages.

**Step 2: Add panel**

Render the panel only when `acceptedApplicant` exists.

Panel states:

- No plan: input total amount and “创建托管计划” button.
- Draft: editable milestone ratios and “确认托管（模拟）” button.
- Funded/completed: read-only funding summary, milestone list, and release records.

**Step 3: Add validation UI**

Show:

- 比例合计。
- 总额、已释放、待释放。
- Invalid ratio warning when total is not 100%.

**Step 4: Run type check/build**

Run: `npm run build`

Expected: build succeeds.

---

### Task 8: Release Funds on Delivery Confirmation

**Files:**
- Modify: `src/pages/CommissionDetail.tsx`
- Test: `src/test/services/escrowService.test.ts`

**Step 1: Add service integration test**

Add a test that confirms `releaseEscrowMilestone` can be called after a simulated current `stageId` and produces a release.

**Step 2: Update `handleStageActionV2`**

In the branch where甲方确认交付成功:

- Capture the current stage before calling `confirmProjectStageDelivery`.
- After delivery confirmation succeeds, call `releaseEscrowMilestone` with:
  - `commissionId`
  - current stage ID
  - current user ID as `releasedById`
  - accepted applicant ID as `releasedToId`
- Invalidate `['escrow', commission.id]`.
- Keep delivery confirmation successful even if escrow release throws, but show a toast explaining托管释放失败.

**Step 3: Run focused tests**

Run: `npm test -- src/test/services/escrowService.test.ts`

Expected: PASS.

**Step 4: Run build**

Run: `npm run build`

Expected: PASS.

---

### Task 9: Final Verification

**Files:**
- No code changes unless verification exposes issues.

**Step 1: Run escrow service tests**

Run: `npm test -- src/test/services/escrowService.test.ts`

Expected: all escrow tests pass.

**Step 2: Run full test suite**

Run: `npm test`

Expected: all non-skipped tests pass.

**Step 3: Run production build**

Run: `npm run build`

Expected: build succeeds.

**Step 4: Manual demo path**

Run: `npm run dev`

Open the app and verify:

- Login as demo client.
- Open a project with accepted creator or accept one.
- Create escrow draft.
- Adjust ratios.
- Confirm simulated funding.
- Submit/confirm one delivery milestone.
- See the corresponding escrow milestone released and release record created.

**Step 5: Commit**

Commit after verification:

```bash
git add src/types/escrow.ts src/services/escrowService.ts src/test/services/escrowService.test.ts src/pages/CommissionDetail.tsx supabase/p0-production-schema.sql
git commit -m "feat: add escrow payment flow"
```
