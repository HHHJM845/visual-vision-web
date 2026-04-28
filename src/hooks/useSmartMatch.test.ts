import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSmartMatch } from './useSmartMatch';

vi.mock('@/services/aiService', () => ({
  matchApplicants: vi.fn(),
}));

import { matchApplicants } from '@/services/aiService';
const mockMatch = vi.mocked(matchApplicants);

const applicants = [
  { id: 'app1', aigcerId: 'a1', commissionId: 1, aigcerNickname: 'Alice', message: '', expectedPrice: '5000', status: 'pending' as const, appliedAt: '', bio: '科幻风格', styles: ['科幻'], tools: ['MJ'] },
];

describe('useSmartMatch', () => {
  beforeEach(() => {
    mockMatch.mockClear();
  });

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
