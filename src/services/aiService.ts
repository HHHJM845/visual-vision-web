import { buildCreatorCapabilityProfile } from '@/services/creatorTaggingService';
import { PortfolioItem } from '@/types/user';

const BASE_URL = import.meta.env.VITE_DEEPSEEK_BASE_URL || 'https://api.deepseek.com';

async function callDeepSeek(messages: { role: 'system' | 'user' | 'assistant'; content: string }[], temperature = 0.7): Promise<string> {
  const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY as string;
  const res = await fetch(`${BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: 'deepseek-chat', messages, temperature }),
  });
  if (!res.ok) throw new Error(`DeepSeek API error: ${res.status}`);
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') throw new Error('Unexpected DeepSeek response shape');
  return content;
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
  portfolio?: PortfolioItem[];
};

export type MatchResult = {
  id: string;
  score: number;
  matchedTags: string[];
  matchedPortfolioIds: string[];
  reasons: string[];
};

function tokensFromText(text: string) {
  return text
    .toLowerCase()
    .split(/[\s,，。；;、.：:（）()【】[\]{}"'“”]+/)
    .filter((token) => token.length >= 2);
}

function fallbackApplicantScores(
  commissionDescription: string,
  category: string,
  applicants: ApplicantInput[],
): MatchResult[] {
  const demandText = `${commissionDescription} ${category}`.toLowerCase();
  const demandTokens = tokensFromText(demandText);

  return applicants.map((applicant) => {
    const capability = buildCreatorCapabilityProfile(applicant);
    const matchedTags = capability.capabilityTags.filter((tag) => demandText.includes(tag.toLowerCase()));
    const styleHits = applicant.styles.filter((style) => demandText.includes(style.toLowerCase())).length;
    const toolHits = applicant.tools.filter((tool) => demandText.includes(tool.toLowerCase())).length;
    const bioHits = tokensFromText(applicant.bio).filter((token) => demandTokens.includes(token)).length;
    const matchedPortfolio = capability.portfolioTags
      .map((item) => ({
        item,
        hits: item.tags.filter((tag) => demandText.includes(tag.toLowerCase())),
      }))
      .filter(({ hits }) => hits.length > 0)
      .sort((a, b) => b.hits.length - a.hits.length);
    const matchedPortfolioIds = matchedPortfolio.slice(0, 3).map(({ item }) => item.id);
    const profileCompleteness = Math.min(12, applicant.styles.length * 2 + applicant.tools.length * 2 + (applicant.bio ? 4 : 0));
    const score = Math.min(
      96,
      58 + matchedTags.length * 5 + styleHits * 8 + toolHits * 6 + bioHits * 4 + matchedPortfolioIds.length * 6 + profileCompleteness,
    );

    return {
      id: applicant.id,
      score,
      matchedTags: matchedTags.slice(0, 8),
      matchedPortfolioIds,
      reasons: [
        matchedTags.length ? `命中标签：${matchedTags.slice(0, 5).join('、')}` : '暂未命中明确能力标签',
        matchedPortfolioIds.length ? `匹配作品：${matchedPortfolioIds.length} 个相关作品` : '暂无直接匹配作品',
        profileCompleteness >= 8 ? '创作者资料较完整，可辅助判断交付能力' : '创作者资料较少，建议进一步沟通确认',
      ],
    };
  }).sort((a, b) => b.score - a.score);
}

function normalizeMatchResults(rows: Array<Partial<MatchResult> & { id: string; score: number }>, applicants: ApplicantInput[]): MatchResult[] {
  const fallback = fallbackApplicantScores('', '', applicants);
  return rows.map((row) => {
    const evidence = fallback.find((item) => item.id === row.id);
    return {
      id: row.id,
      score: row.score,
      matchedTags: row.matchedTags ?? evidence?.matchedTags ?? [],
      matchedPortfolioIds: row.matchedPortfolioIds ?? evidence?.matchedPortfolioIds ?? [],
      reasons: row.reasons ?? evidence?.reasons ?? [],
    };
  });
}

export async function matchApplicants(
  commissionDescription: string,
  category: string,
  applicants: ApplicantInput[],
): Promise<MatchResult[]> {
  const content = `你是一个创意委托平台的智能匹配系统。

委托项目描述：
${commissionDescription}
委托分类：${category}

以下是应征者列表（JSON格式）：
${JSON.stringify(applicants)}
每个应征者包含：id, bio（个人简介）, styles（擅长风格列表）, tools（使用工具列表）, portfolio（作品集）

请为每个应征者返回 JSON 数组。字段：
- id
- score：0-100 的整数
- matchedTags：命中的能力标签数组
- matchedPortfolioIds：最相关作品 id 数组
- reasons：推荐理由数组

只输出 JSON 数组，不要有任何其他文字。`;
  let raw: string;
  try {
    raw = await callDeepSeek([{ role: 'user', content }], 0.1);
  } catch {
    return fallbackApplicantScores(commissionDescription, category, applicants);
  }

  try {
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    return normalizeMatchResults(JSON.parse(cleaned) as Array<Partial<MatchResult> & { id: string; score: number }>, applicants);
  } catch (error) {
    if (applicants.length) return fallbackApplicantScores(commissionDescription, category, applicants);
    throw error;
  }
}
