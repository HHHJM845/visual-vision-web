# AI 需求写手 + 智能匹配 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在委托发布页嵌入 AI 需求优化助手，在委托详情页嵌入智能应征者匹配排序，均调用 DeepSeek API。

**Architecture:** 新增 `aiService.ts` 封装 DeepSeek 调用，两个自定义 Hook（`useAIBrief`、`useSmartMatch`）管理 loading/error/cache 状态，UI 改动仅在 `CommissionNew.tsx` 和 `CommissionDetail.tsx`，不引入新 UI 库。`commissionService.ts` 新增 `getApplicantsWithProfiles` 联表查询。

**Tech Stack:** DeepSeek Chat API（兼容 OpenAI 格式）、Vitest + jsdom + @testing-library/react、shadcn/ui（Dialog、Badge、Button）、Supabase join query

---

## File Map

| 操作 | 路径 | 职责 |
|------|------|------|
| Create | `src/services/aiService.ts` | DeepSeek API 封装：enhanceBrief + matchApplicants |
| Create | `src/hooks/useAIBrief.ts` | 需求写手 loading/result/error 状态 |
| Create | `src/hooks/useSmartMatch.ts` | 智能匹配 loading/scores/error/cache 状态 |
| Create | `src/services/aiService.test.ts` | aiService 单元测试 |
| Create | `src/hooks/useAIBrief.test.ts` | useAIBrief hook 测试 |
| Create | `src/hooks/useSmartMatch.test.ts` | useSmartMatch hook 测试 |
| Modify | `src/services/commissionService.ts` | 新增 getApplicantsWithProfiles + ApplicantWithProfile 类型 |
| Modify | `src/pages/CommissionNew.tsx` | 添加 AI 优化按钮 + Dialog |
| Modify | `src/pages/CommissionDetail.tsx` | 添加应征者列表 + Tab + 匹配度 Badge |
| Create | `.env.example` | 记录需要的环境变量 |
| Modify | `.env` (本地) | 填入实际 DeepSeek API Key |

---

## Task 1: 环境变量配置

**Files:**
- Create: `.env.example`
- Modify: `.env` (本地，不提交)

- [ ] **Step 1: 创建 .env.example**

```
VITE_DEEPSEEK_API_KEY=your_deepseek_api_key_here
VITE_DEEPSEEK_BASE_URL=https://api.deepseek.com
```

- [ ] **Step 2: 在本地 .env 填入真实 Key**

打开 `.env`（若不存在则创建），填入：
```
VITE_DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx
VITE_DEEPSEEK_BASE_URL=https://api.deepseek.com
```

- [ ] **Step 3: 确认 .env 在 .gitignore 中**

运行：
```bash
grep "\.env" .gitignore
```
预期看到 `.env` 或 `.env.*`（排除 `.env.example`）。若没有则添加：
```
.env
```

- [ ] **Step 4: Commit .env.example**

```bash
git add .env.example
git commit -m "chore: add .env.example for DeepSeek API config"
```

---

## Task 2: DeepSeek AI 服务

**Files:**
- Create: `src/services/aiService.ts`
- Create: `src/services/aiService.test.ts`

- [ ] **Step 1: 写失败测试**

创建 `src/services/aiService.test.ts`：

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { enhanceBrief, matchApplicants } from './aiService';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function mockDeepSeekResponse(content: string) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      choices: [{ message: { content } }],
    }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  import.meta.env.VITE_DEEPSEEK_API_KEY = 'test-key';
  import.meta.env.VITE_DEEPSEEK_BASE_URL = 'https://api.deepseek.com';
});

describe('enhanceBrief', () => {
  it('returns enhanced description from DeepSeek', async () => {
    mockDeepSeekResponse('这是一个品牌宣传片项目，风格现代科技感...');
    const result = await enhanceBrief('我要一个科技感海报');
    expect(result).toBe('这是一个品牌宣传片项目，风格现代科技感...');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.deepseek.com/v1/chat/completions',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('throws when API returns non-ok status', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401 });
    await expect(enhanceBrief('test')).rejects.toThrow('DeepSeek API error: 401');
  });
});

describe('matchApplicants', () => {
  it('parses JSON scores from DeepSeek response', async () => {
    mockDeepSeekResponse('[{"id":"a1","score":90},{"id":"a2","score":60}]');
    const result = await matchApplicants(
      '科幻风格宣传片',
      '创意短片',
      [
        { id: 'a1', bio: '擅长科幻风格', styles: ['科幻', '赛博朋克'], tools: ['Midjourney'] },
        { id: 'a2', bio: '日系插画师', styles: ['日系', '可爱'], tools: ['Stable Diffusion'] },
      ]
    );
    expect(result).toEqual([{ id: 'a1', score: 90 }, { id: 'a2', score: 60 }]);
  });

  it('throws when response is invalid JSON', async () => {
    mockDeepSeekResponse('抱歉无法处理');
    await expect(
      matchApplicants('test', 'test', [])
    ).rejects.toThrow();
  });
});
```

- [ ] **Step 2: 确认测试失败**

```bash
npx vitest run src/services/aiService.test.ts
```
预期：FAIL（模块不存在）

- [ ] **Step 3: 实现 aiService.ts**

创建 `src/services/aiService.ts`：

```typescript
const BASE_URL = import.meta.env.VITE_DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
const API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY as string;

async function callDeepSeek(messages: { role: string; content: string }[]): Promise<string> {
  const res = await fetch(`${BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ model: 'deepseek-chat', messages, temperature: 0.7 }),
  });
  if (!res.ok) throw new Error(`DeepSeek API error: ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content as string;
}

export async function enhanceBrief(roughIdea: string): Promise<string> {
  const content = `你是一个创意委托平台的需求顾问。用户想发布一个 AI 生成内容的委托项目。

用户的粗略想法：${roughIdea}

请根据以下结构生成一段专业的项目描述（200字以内，中文）：
- 项目背景：这是什么项目，用于什么场景
- 风格要求：期望的视觉风格、色调、情绪
- 用途说明：商业/个人，如何使用
- 交付要求：格式、尺寸或其他具体要求

只输出描述正文，不要加任何标题或前缀。`;
  return callDeepSeek([{ role: 'user', content }]);
}

export type ApplicantInput = {
  id: string;
  bio: string;
  styles: string[];
  tools: string[];
};

export async function matchApplicants(
  commissionDescription: string,
  category: string,
  applicants: ApplicantInput[]
): Promise<{ id: string; score: number }[]> {
  const content = `你是一个创意委托平台的智能匹配系统。

委托项目描述：
${commissionDescription}
委托分类：${category}

以下是应征者列表（JSON格式）：
${JSON.stringify(applicants)}
每个应征者包含：id, bio（个人简介）, styles（擅长风格列表）, tools（使用工具列表）

请为每个应征者打一个匹配度分数（0-100的整数），基于其风格、工具与委托需求的契合程度。
只输出 JSON 数组，格式：[{"id": "...", "score": 85}, ...]
不要有任何其他文字。`;
  const raw = await callDeepSeek([{ role: 'user', content }]);
  return JSON.parse(raw) as { id: string; score: number }[];
}
```

- [ ] **Step 4: 确认测试通过**

```bash
npx vitest run src/services/aiService.test.ts
```
预期：PASS（3 个测试全绿）

- [ ] **Step 5: Commit**

```bash
git add src/services/aiService.ts src/services/aiService.test.ts
git commit -m "feat: add DeepSeek AI service (enhanceBrief + matchApplicants)"
```

---

## Task 3: useAIBrief Hook

**Files:**
- Create: `src/hooks/useAIBrief.ts`
- Create: `src/hooks/useAIBrief.test.ts`

- [ ] **Step 1: 写失败测试**

创建 `src/hooks/useAIBrief.test.ts`：

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAIBrief } from './useAIBrief';

vi.mock('@/services/aiService', () => ({
  enhanceBrief: vi.fn(),
}));

import { enhanceBrief } from '@/services/aiService';
const mockEnhanceBrief = vi.mocked(enhanceBrief);

describe('useAIBrief', () => {
  it('初始状态：无结果，无错误，不在加载中', () => {
    const { result } = renderHook(() => useAIBrief());
    expect(result.current.isLoading).toBe(false);
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('generate 成功后 result 有值', async () => {
    mockEnhanceBrief.mockResolvedValueOnce('这是优化后的描述');
    const { result } = renderHook(() => useAIBrief());
    await act(async () => {
      await result.current.generate('我要科技感海报');
    });
    expect(result.current.result).toBe('这是优化后的描述');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('generate 失败后 error 有值', async () => {
    mockEnhanceBrief.mockRejectedValueOnce(new Error('网络错误'));
    const { result } = renderHook(() => useAIBrief());
    await act(async () => {
      await result.current.generate('test');
    });
    expect(result.current.error).toBe('AI 生成失败，请重试');
    expect(result.current.result).toBeNull();
  });

  it('reset 清除 result 和 error', async () => {
    mockEnhanceBrief.mockResolvedValueOnce('有结果');
    const { result } = renderHook(() => useAIBrief());
    await act(async () => { await result.current.generate('test'); });
    act(() => { result.current.reset(); });
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
```

- [ ] **Step 2: 确认测试失败**

```bash
npx vitest run src/hooks/useAIBrief.test.ts
```
预期：FAIL（模块不存在）

- [ ] **Step 3: 实现 useAIBrief.ts**

创建 `src/hooks/useAIBrief.ts`：

```typescript
import { useState } from 'react';
import { enhanceBrief } from '@/services/aiService';

export function useAIBrief() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate(roughIdea: string) {
    setIsLoading(true);
    setError(null);
    try {
      const enhanced = await enhanceBrief(roughIdea);
      setResult(enhanced);
    } catch {
      setError('AI 生成失败，请重试');
    } finally {
      setIsLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setError(null);
  }

  return { isLoading, result, error, generate, reset };
}
```

- [ ] **Step 4: 确认测试通过**

```bash
npx vitest run src/hooks/useAIBrief.test.ts
```
预期：PASS（4 个测试全绿）

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useAIBrief.ts src/hooks/useAIBrief.test.ts
git commit -m "feat: add useAIBrief hook"
```

---

## Task 4: AI 需求写手 UI（CommissionNew）

**Files:**
- Modify: `src/pages/CommissionNew.tsx`

- [ ] **Step 1: 在 CommissionNew.tsx 顶部添加 import**

在现有 import 列表末尾（`import { createCommission } from...` 之后）添加：

```typescript
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useAIBrief } from '@/hooks/useAIBrief';
import { useToast } from '@/hooks/use-toast';
```

> 注意：若文件顶部已有 `useState`，只需添加其余 import，不要重复。

- [ ] **Step 2: 在组件函数体内初始化 hook 和 state**

在 `CommissionNew` 函数体内，`useForm` 初始化之后添加：

```typescript
const { toast } = useToast();
const { isLoading: aiLoading, result: aiResult, error: aiError, generate, reset } = useAIBrief();
const [briefOpen, setBriefOpen] = useState(false);
const [roughIdea, setRoughIdea] = useState('');

async function handleGenerate() {
  await generate(roughIdea);
}

function handleUseBrief() {
  if (aiResult) {
    setValue('description', aiResult);
    setBriefOpen(false);
    reset();
    setRoughIdea('');
  }
}

function handleOpenBrief() {
  reset();
  setRoughIdea('');
  setBriefOpen(true);
}
```

- [ ] **Step 3: 替换描述字段，添加 AI 优化按钮**

找到文件中这段代码（约第 80-84 行）：

```tsx
<div>
  <Label>项目描述</Label>
  <Textarea className="mt-1" rows={4} placeholder="详细描述影片风格、时长、用途、参考案例等..." {...register("description")} />
  {errors.description && <p className="text-destructive text-xs mt-1">{errors.description.message}</p>}
</div>
```

替换为：

```tsx
<div>
  <div className="flex items-center justify-between mb-1">
    <Label>项目描述</Label>
    <button
      type="button"
      onClick={handleOpenBrief}
      className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
    >
      ✨ AI 优化
    </button>
  </div>
  <Textarea rows={4} placeholder="详细描述影片风格、时长、用途、参考案例等..." {...register("description")} />
  {errors.description && <p className="text-destructive text-xs mt-1">{errors.description.message}</p>}
</div>
```

- [ ] **Step 4: 在 return 的最外层 div 内末尾添加 Dialog**

在 `</div>` 闭合标签（整个 return 的最后一个闭合标签）之前添加：

```tsx
<Dialog open={briefOpen} onOpenChange={setBriefOpen}>
  <DialogContent className="max-w-lg">
    <DialogHeader>
      <DialogTitle>✨ AI 帮你写需求</DialogTitle>
    </DialogHeader>
    <div className="space-y-4 py-2">
      <div>
        <Label className="text-sm text-muted-foreground mb-1 block">
          用一句话说说你要什么
        </Label>
        <Textarea
          rows={2}
          placeholder="例如：我需要一个赛博朋克风格的60秒品牌宣传片"
          value={roughIdea}
          onChange={e => setRoughIdea(e.target.value)}
        />
      </div>
      {aiResult && (
        <div className="bg-muted rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-2">AI 生成结果：</p>
          <p className="text-sm leading-relaxed">{aiResult}</p>
        </div>
      )}
      {aiError && <p className="text-destructive text-sm">{aiError}</p>}
    </div>
    <DialogFooter className="gap-2">
      {aiResult ? (
        <>
          <button
            type="button"
            onClick={() => { reset(); setRoughIdea(''); }}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            重新生成
          </button>
          <Button onClick={handleUseBrief}>使用这个描述</Button>
        </>
      ) : (
        <Button onClick={handleGenerate} disabled={!roughIdea.trim() || aiLoading}>
          {aiLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />生成中...</> : '生成描述'}
        </Button>
      )}
    </DialogFooter>
  </DialogContent>
</Dialog>
```

- [ ] **Step 5: 在浏览器验证**

打开 http://localhost:8080/commissions/new（需已登录 Client 且已认证），点击描述字段右上角「✨ AI 优化」，输入一句话，点「生成描述」，确认 loading 动画出现、结果显示、「使用这个描述」能填入 Textarea。

- [ ] **Step 6: Commit**

```bash
git add src/pages/CommissionNew.tsx
git commit -m "feat: add AI brief writer UI to CommissionNew"
```

---

## Task 5: getApplicantsWithProfiles

**Files:**
- Modify: `src/services/commissionService.ts`

- [ ] **Step 1: 在 commissionService.ts 末尾添加类型和函数**

打开 `src/services/commissionService.ts`，在文件末尾追加：

```typescript
export type ApplicantWithProfile = Application & {
  bio: string;
  styles: string[];
  tools: string[];
};

export async function getApplicantsWithProfiles(
  commissionId: number
): Promise<ApplicantWithProfile[]> {
  const { data, error } = await supabase
    .from('applications')
    .select(`
      *,
      profiles:aigcer_id (bio, styles, tools)
    `)
    .eq('commission_id', commissionId);
  if (error) throw new Error(error.message);

  return (data || []).map((row) => {
    const profile = row.profiles as { bio: string; styles: string[]; tools: string[] } | null;
    return {
      ...mapApplication(row),
      bio: profile?.bio || '',
      styles: profile?.styles || [],
      tools: profile?.tools || [],
    };
  });
}
```

- [ ] **Step 2: 确认 TypeScript 无报错**

```bash
npx tsc --noEmit
```
预期：无错误输出

- [ ] **Step 3: Commit**

```bash
git add src/services/commissionService.ts
git commit -m "feat: add getApplicantsWithProfiles to commissionService"
```

---

## Task 6: useSmartMatch Hook

**Files:**
- Create: `src/hooks/useSmartMatch.ts`
- Create: `src/hooks/useSmartMatch.test.ts`

- [ ] **Step 1: 写失败测试**

创建 `src/hooks/useSmartMatch.test.ts`：

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSmartMatch } from './useSmartMatch';

vi.mock('@/services/aiService', () => ({
  matchApplicants: vi.fn(),
}));

import { matchApplicants } from '@/services/aiService';
const mockMatch = vi.mocked(matchApplicants);

const applicants = [
  { id: 'a1', bio: '科幻风格', styles: ['科幻'], tools: ['MJ'], aigcerId: 'a1', commissionId: 1, aigcerNickname: 'Alice', message: '', expectedPrice: '5000', status: 'pending' as const, appliedAt: '' },
];

describe('useSmartMatch', () => {
  it('初始状态：无分数，无错误', () => {
    const { result } = renderHook(() => useSmartMatch());
    expect(result.current.scores).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('runMatch 成功后 scores 有值', async () => {
    mockMatch.mockResolvedValueOnce([{ id: 'a1', score: 88 }]);
    const { result } = renderHook(() => useSmartMatch());
    await act(async () => {
      await result.current.runMatch('科幻短片', '创意短片', applicants);
    });
    expect(result.current.scores).toEqual([{ id: 'a1', score: 88 }]);
  });

  it('runMatch 不重复调用（缓存）', async () => {
    mockMatch.mockResolvedValueOnce([{ id: 'a1', score: 88 }]);
    const { result } = renderHook(() => useSmartMatch());
    await act(async () => {
      await result.current.runMatch('desc', 'cat', applicants);
    });
    await act(async () => {
      await result.current.runMatch('desc', 'cat', applicants);
    });
    expect(mockMatch).toHaveBeenCalledTimes(1);
  });

  it('runMatch 失败后 error 有值', async () => {
    mockMatch.mockRejectedValueOnce(new Error('网络错误'));
    const { result } = renderHook(() => useSmartMatch());
    await act(async () => {
      await result.current.runMatch('desc', 'cat', applicants);
    });
    expect(result.current.error).toBe('匹配分析失败，请重试');
    expect(result.current.scores).toBeNull();
  });
});
```

- [ ] **Step 2: 确认测试失败**

```bash
npx vitest run src/hooks/useSmartMatch.test.ts
```
预期：FAIL

- [ ] **Step 3: 实现 useSmartMatch.ts**

创建 `src/hooks/useSmartMatch.ts`：

```typescript
import { useState } from 'react';
import { matchApplicants, ApplicantInput } from '@/services/aiService';
import { ApplicantWithProfile } from '@/services/commissionService';

type MatchScore = { id: string; score: number };

export function useSmartMatch() {
  const [isLoading, setIsLoading] = useState(false);
  const [scores, setScores] = useState<MatchScore[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runMatch(
    commissionDescription: string,
    category: string,
    applicants: ApplicantWithProfile[]
  ) {
    if (scores) return; // 已有缓存，不重复调用
    setIsLoading(true);
    setError(null);
    try {
      const inputs: ApplicantInput[] = applicants.map((a) => ({
        id: a.aigcerId,
        bio: a.bio,
        styles: a.styles,
        tools: a.tools,
      }));
      const result = await matchApplicants(commissionDescription, category, inputs);
      setScores(result);
    } catch {
      setError('匹配分析失败，请重试');
    } finally {
      setIsLoading(false);
    }
  }

  return { isLoading, scores, error, runMatch };
}
```

- [ ] **Step 4: 确认测试通过**

```bash
npx vitest run src/hooks/useSmartMatch.test.ts
```
预期：PASS（4 个测试全绿）

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useSmartMatch.ts src/hooks/useSmartMatch.test.ts
git commit -m "feat: add useSmartMatch hook with caching"
```

---

## Task 7: 智能匹配 UI（CommissionDetail）

**Files:**
- Modify: `src/pages/CommissionDetail.tsx`

- [ ] **Step 1: 在顶部添加 import**

在 `CommissionDetail.tsx` 现有 import 末尾追加：

```typescript
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getApplicantsWithProfiles, ApplicantWithProfile } from '@/services/commissionService';
import { useSmartMatch } from '@/hooks/useSmartMatch';
```

> 若已有 `useState`/`useEffect`，只添加缺少的部分。

- [ ] **Step 2: 在组件函数体内初始化 state 和 hook**

在 `CommissionDetail` 函数体内，现有 state 声明之后添加：

```typescript
const [applicants, setApplicants] = useState<ApplicantWithProfile[]>([]);
const [activeTab, setActiveTab] = useState<'all' | 'smart'>('all');
const { isLoading: matchLoading, scores, error: matchError, runMatch } = useSmartMatch();

useEffect(() => {
  if (commission) {
    getApplicantsWithProfiles(commission.id).then(setApplicants).catch(() => {});
  }
}, [commission]);

function handleSmartTab() {
  setActiveTab('smart');
  if (commission) {
    runMatch(commission.description, commission.category, applicants);
  }
}

function getScore(aigcerId: string): number | null {
  if (!scores) return null;
  return scores.find((s) => s.id === aigcerId)?.score ?? null;
}

function sortedApplicants(): ApplicantWithProfile[] {
  if (activeTab !== 'smart' || !scores) return applicants;
  return [...applicants].sort((a, b) => {
    const sa = scores.find((s) => s.id === a.aigcerId)?.score ?? 0;
    const sb = scores.find((s) => s.id === b.aigcerId)?.score ?? 0;
    return sb - sa;
  });
}
```

- [ ] **Step 3: 替换应征者列表区域**

找到 CommissionDetail.tsx 中这段代码（约第 240-254 行）：

```tsx
{/* Applicant list */}
<div className="bg-card rounded-lg border border-border p-6">
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-base font-semibold text-card-foreground">应征AIGCer列表</h2>
    <div className="flex gap-4 text-xs">
      <span className="text-primary cursor-pointer">本项目共应征AIGCer {commission.applicants} 名</span>
      <span className="text-primary cursor-pointer">需求方选定 0 名</span>
    </div>
  </div>
  {commission.applicants === 0 ? (
    <p className="text-sm text-muted-foreground text-center py-8">暂无AIGCer应征，快来成为第一位！</p>
  ) : (
    <p className="text-sm text-muted-foreground text-center py-8">已有 {commission.applicants} 位AIGCer应征</p>
  )}
</div>
```

替换为：

```tsx
{/* Applicant list */}
<div className="bg-card rounded-lg border border-border p-6">
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-base font-semibold text-card-foreground">应征AIGCer列表</h2>
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => setActiveTab('all')}
        className={`text-xs px-3 py-1 rounded-full border transition-colors ${
          activeTab === 'all'
            ? 'bg-primary text-primary-foreground border-primary'
            : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
        }`}
      >
        全部应征
      </button>
      <button
        type="button"
        onClick={handleSmartTab}
        className={`text-xs px-3 py-1 rounded-full border transition-colors ${
          activeTab === 'smart'
            ? 'bg-primary text-primary-foreground border-primary'
            : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
        }`}
      >
        ✨ 智能推荐
      </button>
    </div>
  </div>

  {matchLoading && (
    <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground text-sm">
      <Loader2 className="w-4 h-4 animate-spin" />
      AI 正在分析匹配度...
    </div>
  )}

  {matchError && (
    <p className="text-destructive text-sm text-center py-4">{matchError}</p>
  )}

  {!matchLoading && applicants.length === 0 && (
    <p className="text-sm text-muted-foreground text-center py-8">暂无AIGCer应征，快来成为第一位！</p>
  )}

  {!matchLoading && sortedApplicants().map((applicant) => {
    const score = getScore(applicant.aigcerId);
    return (
      <div
        key={applicant.id}
        className="flex items-start justify-between border border-border rounded-lg p-4 mb-3 last:mb-0"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{applicant.aigcerNickname}</span>
            {score !== null && (
              <span className="text-xs bg-cyan-500 text-white px-2 py-0.5 rounded-full">
                匹配 {score}%
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{applicant.message}</p>
          <p className="text-xs text-primary mt-1">{applicant.expectedPrice}</p>
        </div>
      </div>
    );
  })}
</div>
```

- [ ] **Step 4: 在浏览器验证**

1. 打开一个有应征者的委托详情页
2. 确认「全部应征」Tab 显示应征者列表
3. 点击「✨ 智能推荐」，确认 loading 动画出现
4. 确认分析完成后，每个应征者卡片显示「匹配 XX%」Badge，且按分数降序排列
5. 再次点击「✨ 智能推荐」，确认不重复调用 API（无新的 loading）

- [ ] **Step 5: Commit**

```bash
git add src/pages/CommissionDetail.tsx
git commit -m "feat: add smart matching UI to CommissionDetail"
```

---

## Task 8: 全量测试 & 最终验证

- [ ] **Step 1: 运行全部测试**

```bash
npx vitest run
```
预期：所有测试 PASS，无 FAIL

- [ ] **Step 2: TypeScript 类型检查**

```bash
npx tsc --noEmit
```
预期：无错误

- [ ] **Step 3: 端到端走一遍完整流程**

1. 以 Client 身份登录
2. 进入「发布新项目」，描述字段点「✨ AI 优化」，输入粗糙想法，生成描述，点「使用这个描述」
3. 确认描述已填入，提交委托
4. 进入该委托详情页，切换「✨ 智能推荐」Tab，查看匹配度排序

- [ ] **Step 4: 最终 Commit**

```bash
git add .
git commit -m "feat: AI brief writer + smart matching complete"
```
