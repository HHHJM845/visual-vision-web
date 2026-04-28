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
