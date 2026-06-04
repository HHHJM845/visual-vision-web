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
    expect(result).toEqual([
      expect.objectContaining({ id: 'a1', score: 90, matchedTags: expect.any(Array), matchedPortfolioIds: expect.any(Array), reasons: expect.any(Array) }),
      expect.objectContaining({ id: 'a2', score: 60, matchedTags: expect.any(Array), matchedPortfolioIds: expect.any(Array), reasons: expect.any(Array) }),
    ]);
  });

  it('throws when response is invalid JSON', async () => {
    mockDeepSeekResponse('抱歉无法处理');
    await expect(
      matchApplicants('test', 'test', [])
    ).rejects.toThrow();
  });

  it('parses JSON wrapped in markdown code fences', async () => {
    mockDeepSeekResponse('```json\n[{"id":"a1","score":90}]\n```');
    const result = await matchApplicants('desc', 'cat', [{ id: 'a1', bio: '', styles: [], tools: [] }]);
    expect(result).toEqual([
      expect.objectContaining({ id: 'a1', score: 90, matchedTags: expect.any(Array), matchedPortfolioIds: expect.any(Array), reasons: expect.any(Array) }),
    ]);
  });

  it('returns matched tags, portfolio evidence and reasons when DeepSeek is unavailable', async () => {
    mockFetch.mockRejectedValueOnce(new Error('offline'));

    const result = await matchApplicants(
      '需要赛博朋克风格的科幻产品宣传短片，包含动态影像和分镜',
      '创意短片',
      [
        {
          id: 'a1',
          bio: '擅长科幻品牌宣传',
          styles: ['科幻', '赛博朋克'],
          tools: ['Runway'],
          portfolio: [
            {
              id: 'pf-1',
              title: '赛博朋克产品宣传片',
              description: '动态影像、分镜和城市科幻镜头',
              imageUrl: 'https://example.com/pf.jpg',
            },
          ],
        },
      ]
    );

    expect(result[0]).toMatchObject({
      id: 'a1',
      matchedTags: expect.arrayContaining(['赛博朋克', '科幻', '产品宣传', '动态影像', '分镜']),
      matchedPortfolioIds: ['pf-1'],
      reasons: expect.arrayContaining([
        expect.stringContaining('命中标签'),
        expect.stringContaining('匹配作品'),
      ]),
    });
  });
});
