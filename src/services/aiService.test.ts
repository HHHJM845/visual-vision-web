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
