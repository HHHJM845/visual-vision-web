export type EscrowPlanStatus = 'draft' | 'funded' | 'completed';
export type EscrowMilestoneStatus = 'pending' | 'released';

export interface EscrowPlan {
  id: string;
  commissionId: number;
  totalAmount: number;
  currency: 'CNY';
  status: EscrowPlanStatus;
  releasedAmount: number;
  createdById: string;
  fundedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EscrowMilestone {
  id: string;
  planId: string;
  commissionId: number;
  stageId: string;
  stageLabel: string;
  percent: number;
  amount: number;
  status: EscrowMilestoneStatus;
  releasedAt?: string;
}

export interface EscrowRelease {
  id: string;
  planId: string;
  commissionId: number;
  milestoneId: string;
  stageId: string;
  stageLabel: string;
  amount: number;
  releasedById: string;
  releasedToId: string;
  createdAt: string;
}

export interface EscrowBundle {
  plan: EscrowPlan;
  milestones: EscrowMilestone[];
  releases: EscrowRelease[];
}
