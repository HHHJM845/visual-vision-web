import { demoUsers } from '@/data/mockData';
import { buildCreatorCapabilityProfile } from '@/services/creatorTaggingService';
import { mapProfile } from '@/services/authService';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { ProfileRow } from '@/services/authService';
import type { Commission } from '@/types/commission';
import type { AigcerProfile, User } from '@/types/user';

const USERS_KEY = 'visionai.users';

export interface CreatorDemandInput {
  title?: string;
  description: string;
  category?: string;
}

export interface CreatorRecommendation {
  creator: User & { aigcerProfile: AigcerProfile };
  capabilityTags: string[];
  matchedTags: string[];
  matchedPortfolioIds: string[];
  score: number;
  reasons: string[];
}

function uniqueById(users: User[]) {
  const seen = new Set<string>();
  return users.filter((user) => {
    if (seen.has(user.id)) return false;
    seen.add(user.id);
    return true;
  });
}

function readLocalUsers(): User[] {
  if (typeof window === 'undefined') return demoUsers;
  const raw = window.localStorage.getItem(USERS_KEY);
  if (!raw) return demoUsers;
  try {
    return uniqueById([...(JSON.parse(raw) as User[]), ...demoUsers]);
  } catch {
    return demoUsers;
  }
}

function verifiedCreators(users: User[]): Array<User & { aigcerProfile: AigcerProfile }> {
  return users.filter((user): user is User & { aigcerProfile: AigcerProfile } => (
    user.role === 'aigcer' &&
    user.verificationStatus === 'verified' &&
    !!user.aigcerProfile
  ));
}

async function fetchCreatorsRemote(): Promise<Array<User & { aigcerProfile: AigcerProfile }>> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'aigcer')
    .eq('verification_status', 'verified');
  if (error) throw new Error(error.message);
  return verifiedCreators((data || []).map((row) => mapProfile(row as ProfileRow)));
}

async function listCreators(): Promise<Array<User & { aigcerProfile: AigcerProfile }>> {
  if (!isSupabaseConfigured) return verifiedCreators(readLocalUsers());
  try {
    const remote = await fetchCreatorsRemote();
    return remote.length ? remote : verifiedCreators(readLocalUsers());
  } catch {
    return verifiedCreators(readLocalUsers());
  }
}

function normalizeText(text: string) {
  return text.toLowerCase();
}

function textTokens(text: string) {
  return normalizeText(text)
    .split(/[\s,，。；;、.：:（）()【】[\]{}"'“”~\-_/]+/)
    .filter((token) => token.length >= 2);
}

function includesDemand(demandText: string, tag: string) {
  const normalizedTag = normalizeText(tag);
  if (demandText.includes(normalizedTag)) return true;
  return normalizedTag
    .split(/[\s,，。；;、.：:（）()【】[\]{}"'“”~\-_/]+/)
    .some((token) => token.length >= 2 && demandText.includes(token));
}

function scoreCreator(creator: User & { aigcerProfile: AigcerProfile }, demand?: CreatorDemandInput): CreatorRecommendation {
  const profile = buildCreatorCapabilityProfile(creator.aigcerProfile);
  const demandText = normalizeText([demand?.title, demand?.description, demand?.category].filter(Boolean).join(' '));
  const demandTokens = textTokens(demandText);
  const matchedTags = demand
    ? profile.capabilityTags.filter((tag) => includesDemand(demandText, tag)).slice(0, 8)
    : [];
  const matchedPortfolio = profile.portfolioTags
    .map((item) => {
      const itemTokens = textTokens(item.sourceText);
      const tagHits = demand ? item.tags.filter((tag) => includesDemand(demandText, tag)) : [];
      const tokenHits = demand ? itemTokens.filter((token) => demandTokens.includes(token)) : [];
      return { item, hits: tagHits.length * 2 + tokenHits.length };
    })
    .filter(({ hits }) => hits > 0)
    .sort((a, b) => b.hits - a.hits);
  const matchedPortfolioIds = matchedPortfolio.slice(0, 3).map(({ item }) => item.id);
  const profileCompleteness = Math.min(
    18,
    creator.aigcerProfile.styles.length * 3 +
      creator.aigcerProfile.tools.length * 2 +
      creator.aigcerProfile.portfolio.length * 2 +
      (creator.aigcerProfile.bio ? 4 : 0),
  );
  const score = demand
    ? Math.min(98, 52 + matchedTags.length * 5 + matchedPortfolioIds.length * 9 + profileCompleteness)
    : Math.min(95, 62 + profileCompleteness + Math.min(12, profile.capabilityTags.length));

  return {
    creator,
    capabilityTags: profile.capabilityTags,
    matchedTags,
    matchedPortfolioIds,
    score,
    reasons: [
      matchedTags.length
        ? `命中能力标签：${matchedTags.slice(0, 5).join('、')}`
        : demand
          ? '暂未命中明确标签，可结合作品进一步判断'
          : '能力标签来自创作者资料和作品集文本',
      matchedPortfolioIds.length
        ? `找到 ${matchedPortfolioIds.length} 个相关作品，可直接查看案例`
        : demand
          ? '暂无直接命中的作品案例'
          : `作品集包含 ${creator.aigcerProfile.portfolio.length} 个案例`,
      profileCompleteness >= 12 ? '资料和作品集较完整，适合优先沟通' : '资料完整度一般，建议补充询问交付经验',
    ],
  };
}

export async function getCreatorRecommendations(demand?: CreatorDemandInput): Promise<CreatorRecommendation[]> {
  const creators = await listCreators();
  return creators
    .map((creator) => scoreCreator(creator, demand))
    .sort((a, b) => b.score - a.score);
}

export function demandFromCommission(commission: Commission): CreatorDemandInput {
  return {
    title: commission.title,
    description: commission.description,
    category: commission.category,
  };
}
