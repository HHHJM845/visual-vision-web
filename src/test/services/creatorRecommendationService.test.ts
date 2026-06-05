import { describe, expect, it, vi } from 'vitest';
import { getCreatorRecommendations } from '@/services/creatorRecommendationService';

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: false,
  supabase: {},
}));

describe('creatorRecommendationService', () => {
  it('recommends verified creators with matched tags and portfolio evidence', async () => {
    const results = await getCreatorRecommendations({
      title: '科幻品牌宣传片',
      description: '需要科技产品发布视觉短片，强调赛博朋克和动态影像',
      category: '商业宣传片',
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].creator.role).toBe('aigcer');
    expect(results[0].score).toBeGreaterThan(0);
    expect(results[0].matchedTags).toEqual(expect.arrayContaining(['科幻']));
    expect(results[0].matchedPortfolioIds.length).toBeGreaterThan(0);
    expect(results[0].reasons.join(' ')).toContain('相关作品');
  });

  it('still returns creator cards without a demand input', async () => {
    const results = await getCreatorRecommendations();

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].capabilityTags.length).toBeGreaterThan(0);
    expect(results[0].reasons.join(' ')).toContain('作品集');
  });
});
