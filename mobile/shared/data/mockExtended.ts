export interface WalletData {
  balance: string;
  frozen: string;
  totalEarned: string;
  pendingPayout: string;
}

export interface AIEfficiencyData {
  productionSpeed: string;
  qualityScore: number;
  toolsUsed: string[];
  trend: string[];
}

export interface SampleWork {
  id: string;
  title: string;
  thumbnailUrl: string;
  type: 'video' | 'image';
  views: number;
  likes: number;
}

export interface NotificationItem {
  id: string;
  type: 'commission' | 'payment' | 'review' | 'system';
  title: string;
  body: string;
  time: string;
  read: boolean;
}

export interface ContractData {
  id: string;
  commissionTitle: string;
  amount: string;
  escrowAmount: string;
  milestones: { label: string; amount: string; dueDate: string; status: 'pending' | 'done' }[];
  signedAt?: string;
}

export const mockWallet: WalletData = {
  balance: '¥12,480',
  frozen: '¥3,200',
  totalEarned: '¥48,600',
  pendingPayout: '¥8,000',
};

export const mockAIEfficiency: AIEfficiencyData = {
  productionSpeed: '3.2x',
  qualityScore: 94,
  toolsUsed: ['Sora', 'Runway', 'Kling', 'ComfyUI'],
  trend: [60, 72, 80, 88, 92, 94],
};

export const mockSampleWorks: SampleWork[] = [
  { id: '1', title: '科幻短片《星际迷途》片段', thumbnailUrl: '', type: 'video', views: 4200, likes: 312 },
  { id: '2', title: '古风仙侠MV《问道》', thumbnailUrl: '', type: 'video', views: 2800, likes: 198 },
  { id: '3', title: '品牌宣传片动画截帧', thumbnailUrl: '', type: 'image', views: 1100, likes: 85 },
];

export const mockNotifications: NotificationItem[] = [
  { id: '1', type: 'commission', title: '新的申请通过审核', body: '您对《科幻短片》的申请已通过，请查看合同详情。', time: '2分钟前', read: false },
  { id: '2', type: 'payment', title: '收到里程碑付款', body: '第一阶段里程碑款项 ¥3,200 已到账。', time: '1小时前', read: false },
  { id: '3', type: 'review', title: '样片待您验收', body: '创作者已提交样片，请在24小时内完成验收。', time: '3小时前', read: true },
];

export const mockContract: ContractData = {
  id: 'c001',
  commissionTitle: '科幻短片《星际迷途》AI影像制作',
  amount: '¥16,000',
  escrowAmount: '¥16,000',
  milestones: [
    { label: '前期策划', amount: '¥3,200', dueDate: '2026-04-20', status: 'done' },
    { label: '样片制作', amount: '¥6,400', dueDate: '2026-05-05', status: 'pending' },
    { label: '正片交付', amount: '¥6,400', dueDate: '2026-05-20', status: 'pending' },
  ],
  signedAt: '2026-04-10',
};
