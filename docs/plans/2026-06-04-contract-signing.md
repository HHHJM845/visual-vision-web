# Contract Signing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a demonstrable contract signing flow that creates a project contract after a creator is accepted, lets both parties sign, and marks the contract active once both signatures exist.

**Architecture:** Add a contract domain with TypeScript types and a `contractService` that follows the existing Supabase-first/localStorage-fallback pattern. Wire a compact contract panel into `CommissionDetail` between the accepted-creator banner and escrow payment panel, so contract status becomes part of the cooperation flow.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, TanStack Query, Supabase, Tailwind CSS, shadcn/ui.

---

### Task 1: Add Contract Domain Types and First Failing Test

**Files:**
- Create: `src/types/contract.ts`
- Create: `src/test/services/contractService.test.ts`

**Step 1: Write the failing test**

Create `src/test/services/contractService.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: false,
  supabase: {},
}));

describe('contractService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it('creates a contract draft for an accepted project', async () => {
    const { createContractDraft } = await import('@/services/contractService');

    const contract = await createContractDraft({
      commissionId: 1,
      commissionTitle: 'AI 科幻短片制作',
      clientId: 'client-1',
      clientName: '甲方工作室',
      aigcerId: 'aigcer-1',
      aigcerName: '星河影像',
      budgetText: '¥5000 - 15000',
      deliveryFormat: 'MP4',
      milestoneSummary: ['脚本确认', '风格确认', '成片交付'],
      escrowSummary: '项目资金进入平台模拟托管，按节点验收释放。',
    });

    expect(contract.status).toBe('draft');
    expect(contract.commissionId).toBe(1);
    expect(contract.clientId).toBe('client-1');
    expect(contract.aigcerId).toBe('aigcer-1');
    expect(contract.terms.length).toBeGreaterThan(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/test/services/contractService.test.ts`

Expected: FAIL because `@/services/contractService` does not exist.

**Step 3: Add contract types**

Create `src/types/contract.ts`:

```ts
export type ContractStatus = 'draft' | 'client_signed' | 'aigcer_signed' | 'active';
export type ContractSignerRole = 'client' | 'aigcer';

export interface ProjectContract {
  id: string;
  commissionId: number;
  commissionTitle: string;
  clientId: string;
  clientName: string;
  aigcerId: string;
  aigcerName: string;
  budgetText: string;
  deliveryFormat: string;
  milestoneSummary: string[];
  escrowSummary: string;
  terms: string[];
  status: ContractStatus;
  clientSignedAt?: string;
  aigcerSignedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

**Step 4: Run test**

Run: `npm test -- src/test/services/contractService.test.ts`

Expected: still FAIL because the service is missing.

---

### Task 2: Implement Local Contract Draft Service

**Files:**
- Create: `src/services/contractService.ts`
- Modify: `src/test/services/contractService.test.ts`

**Step 1: Add failing duplicate-draft test**

Append to `src/test/services/contractService.test.ts`:

```ts
it('returns an existing contract instead of creating duplicates for one commission', async () => {
  const { createContractDraft } = await import('@/services/contractService');
  const input = {
    commissionId: 1,
    commissionTitle: 'AI 科幻短片制作',
    clientId: 'client-1',
    clientName: '甲方工作室',
    aigcerId: 'aigcer-1',
    aigcerName: '星河影像',
    budgetText: '¥5000 - 15000',
    deliveryFormat: 'MP4',
    milestoneSummary: ['脚本确认'],
    escrowSummary: '模拟托管',
  };

  const first = await createContractDraft(input);
  const second = await createContractDraft({ ...input, commissionTitle: '新的标题不应覆盖' });

  expect(second.id).toBe(first.id);
  expect(second.commissionTitle).toBe(first.commissionTitle);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/test/services/contractService.test.ts`

Expected: FAIL because `createContractDraft` is missing.

**Step 3: Implement local service**

Create `src/services/contractService.ts`:

```ts
import { ProjectContract } from '@/types/contract';

const CONTRACTS_KEY = 'visionai.projectContracts';

export interface CreateContractDraftInput {
  commissionId: number;
  commissionTitle: string;
  clientId: string;
  clientName: string;
  aigcerId: string;
  aigcerName: string;
  budgetText: string;
  deliveryFormat: string;
  milestoneSummary: string[];
  escrowSummary: string;
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

function localContracts() {
  return readStored<ProjectContract[]>(CONTRACTS_KEY, []);
}

function saveLocalContracts(contracts: ProjectContract[]) {
  writeStored(CONTRACTS_KEY, contracts);
}

function defaultTerms(input: CreateContractDraftInput) {
  return [
    `甲方 ${input.clientName} 委托乙方 ${input.aigcerName} 完成「${input.commissionTitle}」。`,
    `项目预算为 ${input.budgetText}，具体结算以双方确认的托管付款计划为准。`,
    `乙方应按项目里程碑提交交付物，甲方可确认或提出修改意见。`,
    input.escrowSummary,
    '双方确认签署后，本合同进入模拟履约状态。'
  ];
}

export async function createContractDraft(input: CreateContractDraftInput): Promise<ProjectContract> {
  const existing = localContracts().find((contract) => contract.commissionId === input.commissionId);
  if (existing) return existing;

  const now = new Date().toISOString();
  const contract: ProjectContract = {
    id: generateId('contract'),
    ...input,
    terms: defaultTerms(input),
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  };
  saveLocalContracts([contract, ...localContracts()]);
  return contract;
}
```

**Step 4: Run test**

Run: `npm test -- src/test/services/contractService.test.ts`

Expected: PASS for draft tests.

---

### Task 3: Implement Signing State Transitions

**Files:**
- Modify: `src/services/contractService.ts`
- Modify: `src/test/services/contractService.test.ts`

**Step 1: Add failing signing tests**

Append tests:

```ts
it('moves to client_signed when the client signs first', async () => {
  const { createContractDraft, signContract } = await import('@/services/contractService');
  const contract = await createContractDraft(baseInput());

  const signed = await signContract(contract.id, 'client');

  expect(signed.status).toBe('client_signed');
  expect(signed.clientSignedAt).toBeTruthy();
  expect(signed.aigcerSignedAt).toBeUndefined();
});

it('moves to aigcer_signed when the creator signs first', async () => {
  const { createContractDraft, signContract } = await import('@/services/contractService');
  const contract = await createContractDraft(baseInput());

  const signed = await signContract(contract.id, 'aigcer');

  expect(signed.status).toBe('aigcer_signed');
  expect(signed.aigcerSignedAt).toBeTruthy();
  expect(signed.clientSignedAt).toBeUndefined();
});

it('marks the contract active after both parties sign', async () => {
  const { createContractDraft, signContract } = await import('@/services/contractService');
  const contract = await createContractDraft(baseInput());

  await signContract(contract.id, 'client');
  const active = await signContract(contract.id, 'aigcer');

  expect(active.status).toBe('active');
  expect(active.clientSignedAt).toBeTruthy();
  expect(active.aigcerSignedAt).toBeTruthy();
});
```

Move common input into a helper at the top of the describe:

```ts
function baseInput() {
  return {
    commissionId: 1,
    commissionTitle: 'AI 科幻短片制作',
    clientId: 'client-1',
    clientName: '甲方工作室',
    aigcerId: 'aigcer-1',
    aigcerName: '星河影像',
    budgetText: '¥5000 - 15000',
    deliveryFormat: 'MP4',
    milestoneSummary: ['脚本确认', '风格确认', '成片交付'],
    escrowSummary: '项目资金进入平台模拟托管，按节点验收释放。',
  };
}
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/test/services/contractService.test.ts`

Expected: FAIL because `signContract` is not defined.

**Step 3: Implement signing**

Add to `src/services/contractService.ts`:

```ts
import { ContractSignerRole } from '@/types/contract';

function statusFor(contract: ProjectContract): ProjectContract['status'] {
  if (contract.clientSignedAt && contract.aigcerSignedAt) return 'active';
  if (contract.clientSignedAt) return 'client_signed';
  if (contract.aigcerSignedAt) return 'aigcer_signed';
  return 'draft';
}

export async function signContract(contractId: string, role: ContractSignerRole): Promise<ProjectContract> {
  const contract = localContracts().find((item) => item.id === contractId);
  if (!contract) throw new Error('合同不存在');

  if (role === 'client' && contract.clientSignedAt) return contract;
  if (role === 'aigcer' && contract.aigcerSignedAt) return contract;

  const now = new Date().toISOString();
  const updated: ProjectContract = {
    ...contract,
    clientSignedAt: role === 'client' ? now : contract.clientSignedAt,
    aigcerSignedAt: role === 'aigcer' ? now : contract.aigcerSignedAt,
    updatedAt: now,
  };
  updated.status = statusFor(updated);

  saveLocalContracts(localContracts().map((item) => (item.id === contractId ? updated : item)));
  return updated;
}
```

**Step 4: Run test**

Run: `npm test -- src/test/services/contractService.test.ts`

Expected: PASS.

---

### Task 4: Add Query and Supabase Fallback

**Files:**
- Modify: `src/services/contractService.ts`
- Modify: `src/test/services/contractService.test.ts`

**Step 1: Add failing query and fallback tests**

Add:

```ts
it('loads a contract by commission id', async () => {
  const { createContractDraft, getContractByCommission } = await import('@/services/contractService');
  await createContractDraft(baseInput());

  const contract = await getContractByCommission(1);

  expect(contract?.commissionId).toBe(1);
});

it('falls back to local storage when remote contract table is unavailable', async () => {
  supabaseState.isConfigured = true;
  supabaseState.failRemote = true;
  const { createContractDraft } = await import('@/services/contractService');

  const contract = await createContractDraft(baseInput());

  expect(contract.status).toBe('draft');
  expect(supabaseState.fromCalls).toBeGreaterThan(0);
});
```

Use the same hoisted `supabaseState` mock style as `src/test/services/escrowService.test.ts`.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/test/services/contractService.test.ts`

Expected: FAIL until Supabase-aware code and `getContractByCommission` exist.

**Step 3: Implement Supabase-aware service**

Update `contractService.ts` to:

- Import `isSupabaseConfigured` and `supabase`.
- Add `withFallback`.
- Add `mapContract`, `contractToRow`.
- Implement `getContractByCommission`.
- Make `createContractDraft` and `signContract` try Supabase first when configured, falling back to local storage.

**Step 4: Run test**

Run: `npm test -- src/test/services/contractService.test.ts`

Expected: PASS.

---

### Task 5: Add Supabase Contract Schema

**Files:**
- Modify: `supabase/p0-production-schema.sql`

**Step 1: Add table**

Add near escrow tables:

```sql
create table if not exists public.project_contracts (
  id text primary key default gen_random_uuid()::text,
  commission_id bigint not null references public.commissions(id) on delete cascade,
  commission_title text not null,
  client_id text not null,
  client_name text not null,
  aigcer_id text not null,
  aigcer_name text not null,
  budget_text text not null,
  delivery_format text not null,
  milestone_summary text[] not null default '{}',
  escrow_summary text not null,
  terms text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'client_signed', 'aigcer_signed', 'active')),
  client_signed_at timestamptz,
  aigcer_signed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

**Step 2: Add index, trigger, RLS**

Add:

- `project_contracts_commission_idx`
- `project_contracts_set_updated_at`
- enable RLS
- project parties read policy
- project owner insert/update policy
- accepted creator update policy

Use the existing project-party `exists (...)` pattern from escrow and project deliverables.

**Step 3: Verify SQL**

Run: `rg -n "project_contracts" supabase/p0-production-schema.sql`

Expected: table, index, trigger, RLS and policies appear.

---

### Task 6: Wire Contract Panel Into Commission Detail

**Files:**
- Modify: `src/pages/CommissionDetail.tsx`

**Step 1: Add imports and query**

Import:

```ts
import { createContractDraft, getContractByCommission, signContract } from '@/services/contractService';
```

Add query:

```ts
const { data: contract = null, refetch: refetchContract } = useQuery({
  queryKey: ['contract', commissionId],
  queryFn: () => getContractByCommission(commissionId),
  enabled: Number.isFinite(commissionId) && !!acceptedApplicant,
});
```

**Step 2: Add handlers**

Add:

- `handleCreateContractDraft`
- `handleSignContract`

`handleCreateContractDraft` should require project owner and accepted applicant. Use commission data, `projectStages.map(stage => stage.label)`, and escrow summary text.

`handleSignContract` should infer role:

- project owner → `client`
- accepted AIGCer → `aigcer`

**Step 3: Add UI panel**

Insert between accepted creator banner and escrow payment panel.

Panel states:

- No contract: project owner sees “生成合同草稿”; creator sees “等待甲方生成合同”
- Draft/single signed: summary + signature cards + current user sign button
- Active: “合同已生效” + timestamps

**Step 4: Run build**

Run: `npm run build`

Expected: PASS.

---

### Task 7: Final Verification and Push

**Files:**
- No code changes unless verification exposes issues.

**Step 1: Run contract tests**

Run: `npm test -- src/test/services/contractService.test.ts`

Expected: all contract tests pass.

**Step 2: Run full tests**

Run: `npm test`

Expected: all non-skipped tests pass.

**Step 3: Run build**

Run: `npm run build`

Expected: build succeeds.

**Step 4: Manual visual check**

Run: `npm run dev -- --host 127.0.0.1 --port 5173`

Open `/commissions/0` with demo client localStorage:

- Select creator.
- Generate contract draft.
- Sign as client.
- Switch localStorage to demo AIGCer.
- Sign as creator.
- Confirm contract shows active.

**Step 5: Commit and push**

```bash
git add src/types/contract.ts src/services/contractService.ts src/test/services/contractService.test.ts src/pages/CommissionDetail.tsx supabase/p0-production-schema.sql
git commit -m "feat: add contract signing flow"
git push
```
