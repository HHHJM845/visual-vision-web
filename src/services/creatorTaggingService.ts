import { PortfolioItem } from '@/types/user';

export interface PortfolioTagResult {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  tags: string[];
  sourceText: string;
}

export interface CreatorCapabilityProfile {
  capabilityTags: string[];
  portfolioTags: PortfolioTagResult[];
}

export interface CreatorCapabilityInput {
  bio: string;
  styles: string[];
  tools: string[];
  portfolio?: PortfolioItem[];
}

const TAG_PATTERNS: Array<[string, RegExp]> = [
  ['赛博朋克', /赛博|cyber/i],
  ['科幻', /科幻|未来|机甲|科技|星际|sci/i],
  ['国风', /国风|水墨|古典|东方/i],
  ['二次元', /二次元|日系|动漫|卡通|角色/i],
  ['写实', /写实|真人|真实|渲染/i],
  ['产品宣传', /产品|发布|商品/i],
  ['品牌宣传', /品牌|企业|文化|宣传/i],
  ['短片', /短片|影片|视频|片/i],
  ['动态影像', /动态|动效|影像|生成|合成/i],
  ['角色', /角色|人物|人设|主播/i],
  ['场景', /场景|城市|世界观|环境/i],
  ['分镜', /分镜|镜头|脚本/i],
  ['剪辑', /剪辑|粗剪|成片|后期/i],
  ['Runway', /runway/i],
  ['Kling', /kling|可灵/i],
  ['ComfyUI', /comfy/i],
  ['Midjourney', /midjourney|mj/i],
  ['Stable Diffusion', /stable diffusion|sd/i],
];

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function tagsFromText(text: string) {
  return TAG_PATTERNS
    .filter(([, pattern]) => pattern.test(text))
    .map(([tag]) => tag);
}

export function tagPortfolioItem(item: PortfolioItem): PortfolioTagResult {
  const sourceText = `${item.title} ${item.description}`.trim();
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    imageUrl: item.imageUrl,
    sourceText,
    tags: unique(tagsFromText(sourceText)),
  };
}

export function buildCreatorCapabilityProfile(input: CreatorCapabilityInput): CreatorCapabilityProfile {
  const portfolioTags = (input.portfolio ?? []).map(tagPortfolioItem);
  const profileText = [input.bio, ...input.styles, ...input.tools].join(' ');
  const capabilityTags = unique([
    ...input.styles,
    ...input.tools,
    ...tagsFromText(profileText),
    ...portfolioTags.flatMap((item) => item.tags),
  ]).slice(0, 18);

  return {
    capabilityTags,
    portfolioTags,
  };
}
