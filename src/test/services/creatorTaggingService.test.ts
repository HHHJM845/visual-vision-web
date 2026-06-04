import { describe, expect, it } from 'vitest';
import {
  buildCreatorCapabilityProfile,
  tagPortfolioItem,
} from '@/services/creatorTaggingService';

describe('creatorTaggingService', () => {
  it('generates tags from portfolio title and description', () => {
    const result = tagPortfolioItem({
      id: 'pf-1',
      title: '赛博朋克科幻短片',
      description: '使用 Runway 制作城市动态影像和产品宣传镜头',
      imageUrl: 'https://example.com/pf.jpg',
    });

    expect(result.tags).toEqual(expect.arrayContaining(['赛博朋克', '科幻', '短片', '动态影像', '产品宣传', 'Runway']));
    expect(result.sourceText).toContain('赛博朋克科幻短片');
  });

  it('merges profile, tools and portfolio tags into a deduped capability profile', () => {
    const profile = buildCreatorCapabilityProfile({
      bio: '擅长科幻品牌宣传和分镜设计',
      styles: ['科幻', '写实渲染'],
      tools: ['Runway', 'ComfyUI'],
      portfolio: [
        {
          id: 'pf-1',
          title: '科幻产品宣传片',
          description: '包含分镜、动态影像和剪辑',
          imageUrl: 'https://example.com/pf.jpg',
        },
      ],
    });

    expect(profile.capabilityTags).toEqual(expect.arrayContaining(['科幻', '品牌宣传', '产品宣传', '分镜', '动态影像', '剪辑', 'Runway', 'ComfyUI']));
    expect(profile.portfolioTags[0]).toMatchObject({
      id: 'pf-1',
      tags: expect.arrayContaining(['科幻', '产品宣传', '分镜']),
    });
    expect(profile.capabilityTags.filter((tag) => tag === '科幻')).toHaveLength(1);
  });
});
