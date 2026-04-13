// src/types/commission.ts
export interface Commission {
  id: number;
  title: string;
  description: string;
  tag: '实名认证' | '企业认证' | '未认证';
  reputation: string;
  deadline: string;
  category: string;
  applicants: number;
  priceRange: string;
  authorId: string;
  authorNickname: string;
  authorVerification: 'realname' | 'enterprise' | 'none';
  purpose: '商业用途' | '个人用途';
  style?: string;
  resolution?: string;
  format?: string;
  // 静态 mock 扩展字段（用于 CommissionDetail 展示）
  rating?: number;
  reviews?: number;
  completionRate?: string;
  handlingFee?: string;
}

export interface Application {
  id: string;
  commissionId: number;
  aigcerId: string;
  aigcerNickname: string;
  message: string;
  expectedPrice: string;
  status: 'pending' | 'accepted' | 'rejected';
  appliedAt: string;
}
