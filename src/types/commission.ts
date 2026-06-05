// src/types/commission.ts
import type { UserRole } from './user';
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
  status?: 'pending_review' | 'open' | 'closed';
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
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  appliedAt: string;
}

export type DeliveryStatus = 'submitted' | 'changes_requested' | 'confirmed';

export interface DeliverySubmission {
  id: string;
  commissionId: number;
  stageId: string;
  stageLabel: string;
  version: number;
  title: string;
  description: string;
  fileName?: string;
  fileUrl?: string;
  submittedById: string;
  submittedByName: string;
  status: DeliveryStatus;
  feedback?: string;
  confirmedById?: string;
  confirmedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type DeliveryReviewCommentType = 'note' | 'change_request' | 'approval';

export interface DeliveryReviewComment {
  id: string;
  commissionId: number;
  deliveryId: string;
  stageId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  body: string;
  commentType: DeliveryReviewCommentType;
  createdAt: string;
  updatedAt: string;
}

export type DisputeStatus = 'pending' | 'processing' | 'resolved' | 'rejected';
export type DisputeResolutionAction = 'resume' | 'reject_resume' | 'refund' | 'partial_release' | 'request_changes';

export interface ProjectDispute {
  id: string;
  commissionId: number;
  commissionTitle: string;
  stageId?: string;
  stageLabel?: string;
  deliveryId?: string;
  deliveryVersion?: number;
  deliveryTitle?: string;
  applicantId?: string;
  applicantName?: string;
  reporterId: string;
  reporterName: string;
  reason: string;
  expectation: string;
  status: DisputeStatus;
  resolutionAction?: DisputeResolutionAction;
  resolutionNote?: string;
  resolvedById?: string;
  resolvedByName?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}
