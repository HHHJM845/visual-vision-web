import { Commission, Application } from '@/types/commission';

const COMMISSIONS_KEY = 'vai_commissions';
const APPLICATIONS_KEY = 'vai_applications';

const STATIC_COMMISSIONS: Commission[] = [
  { id: 0, title: "企业品牌AI宣传片制作", description: "需要制作一支60秒企业品牌宣传AI影片，风格现代简洁，突出科技感，需包含产品展示、公司文化等内容。", tag: "实名认证", reputation: "信誉优良", deadline: "2026-04-29", category: "商业宣传片", applicants: 0, priceRange: "¥3k - 8k", authorId: "mock", authorNickname: "柚柚酒", authorVerification: "realname", purpose: "商业用途", rating: 5, reviews: 17, completionRate: "17 / 17", handlingFee: "5%" },
  { id: 1, title: "AI科幻短片制作（已有分镜）", description: "未来科幻风格短片，时长约3分钟，已有分镜脚本，需按照我方提供的参考风格进行AI影片生成与合成。", tag: "企业认证", reputation: "信誉优良", deadline: "2026-04-30", category: "创意短片", applicants: 1, priceRange: "¥5k - 15k", authorId: "mock", authorNickname: "画境工作室", authorVerification: "enterprise", purpose: "商业用途", rating: 5, reviews: 32, completionRate: "30 / 32", handlingFee: "5%" },
  { id: 2, title: "游戏宣传AI概念影像制作", description: "需要制作游戏上线宣传概念影像，时长30秒，风格奇幻史诗，需要AI生成角色动态与场景融合。", tag: "实名认证", reputation: "信誉优良", deadline: "2026-04-16", category: "概念影像", applicants: 1, priceRange: "¥2k - 6k", authorId: "mock", authorNickname: "星辰", authorVerification: "realname", purpose: "商业用途", rating: 4, reviews: 8, completionRate: "7 / 8", handlingFee: "5%" },
  { id: 3, title: "虚拟主播AI形象短视频", description: "为虚拟主播制作AI形象宣传短视频，时长约15秒，需要Q版可爱风格，含动态效果。", tag: "企业认证", reputation: "信誉优良", deadline: "2026-04-30", category: "短视频", applicants: 1, priceRange: "¥500 - 2k", authorId: "mock", authorNickname: "V社工作室", authorVerification: "enterprise", purpose: "商业用途", rating: 5, reviews: 15, completionRate: "14 / 15", handlingFee: "5%" },
  { id: 4, title: "个人IP形象AI动态展示视频", description: "为个人原创IP制作AI动态展示视频，时长约20秒，需要配合已有形象设定进行AI生成。", tag: "未认证", reputation: "信誉优良", deadline: "2026-04-29", category: "创意短片", applicants: 0, priceRange: "¥300 - 1k", authorId: "mock", authorNickname: "小鱼", authorVerification: "none", purpose: "个人用途", rating: 3, reviews: 2, completionRate: "2 / 2", handlingFee: "5%" },
  { id: 5, title: "二次元风格AI宣传影片", description: "卡通日系厚涂风格AI影片，含角色动态、场景切换，用于产品发布会宣传展示。", tag: "未认证", reputation: "信誉优良", deadline: "2027-03-01", category: "商业宣传片", applicants: 1, priceRange: "¥3k - 20k", authorId: "mock", authorNickname: "梦想家", authorVerification: "none", purpose: "商业用途", rating: 4, reviews: 5, completionRate: "4 / 5", handlingFee: "5%" },
  { id: 6, title: "暗黑哥特风AI概念影像", description: "整体氛围暗黑哥特风格，AI生成二次元人偶与复古洛丽塔融合场景，低饱和冷色调，破碎感强烈。", tag: "实名认证", reputation: "信誉优良", deadline: "2026-04-15", category: "概念影像", applicants: 0, priceRange: "¥1k - 5k", authorId: "mock", authorNickname: "暗夜蔷薇", authorVerification: "realname", purpose: "个人用途", rating: 5, reviews: 12, completionRate: "11 / 12", handlingFee: "5%" },
  { id: 7, title: "海洋主题AI短片制作", description: "以海天使为原型的海洋主题AI短片，配色以鲜艳蓝色为主，需融入海洋生物元素，时长约30秒。", tag: "实名认证", reputation: "信誉优良", deadline: "2026-04-05", category: "创意短片", applicants: 1, priceRange: "¥500 - 2k", authorId: "mock", authorNickname: "海天使", authorVerification: "realname", purpose: "个人用途", rating: 4, reviews: 6, completionRate: "5 / 6", handlingFee: "5%" },
];

function getUserCommissions(): Commission[] {
  try { return JSON.parse(localStorage.getItem(COMMISSIONS_KEY) || '[]'); }
  catch { return []; }
}
function saveUserCommissions(list: Commission[]) {
  localStorage.setItem(COMMISSIONS_KEY, JSON.stringify(list));
}
function getStoredApplications(): Application[] {
  try { return JSON.parse(localStorage.getItem(APPLICATIONS_KEY) || '[]'); }
  catch { return []; }
}
function saveApplications(list: Application[]) {
  localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(list));
}

export async function getCommissions(): Promise<Commission[]> {
  return [...STATIC_COMMISSIONS, ...getUserCommissions()];
}

export async function getCommissionById(id: number): Promise<Commission | null> {
  const all = await getCommissions();
  return all.find(c => c.id === id) ?? null;
}

export async function getCommissionsByAuthor(authorId: string): Promise<Commission[]> {
  const all = await getCommissions();
  return all.filter(c => c.authorId === authorId);
}

export async function createCommission(
  data: Omit<Commission, 'id' | 'applicants'>,
): Promise<Commission> {
  await new Promise(r => setTimeout(r, 300));
  const commission: Commission = { ...data, id: Date.now(), applicants: 0 };
  const existing = getUserCommissions();
  existing.push(commission);
  saveUserCommissions(existing);
  return commission;
}

export async function applyToCommission(
  commissionId: number,
  aigcerId: string,
  aigcerNickname: string,
  message: string,
  expectedPrice: string,
): Promise<Application> {
  await new Promise(r => setTimeout(r, 300));
  const apps = getStoredApplications();
  if (apps.find(a => a.commissionId === commissionId && a.aigcerId === aigcerId)) {
    throw new Error('已经应征过该项目');
  }
  const application: Application = {
    id: crypto.randomUUID(),
    commissionId, aigcerId, aigcerNickname, message, expectedPrice,
    status: 'pending',
    appliedAt: new Date().toISOString(),
  };
  apps.push(application);
  saveApplications(apps);
  const userCommissions = getUserCommissions();
  const idx = userCommissions.findIndex(c => c.id === commissionId);
  if (idx !== -1) { userCommissions[idx].applicants += 1; saveUserCommissions(userCommissions); }
  return application;
}

export async function getApplicationsByAigcer(aigcerId: string): Promise<Application[]> {
  return getStoredApplications().filter(a => a.aigcerId === aigcerId);
}

export async function getApplicationsByCommission(commissionId: number): Promise<Application[]> {
  return getStoredApplications().filter(a => a.commissionId === commissionId);
}
