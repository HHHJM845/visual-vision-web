import { describe, expect, it } from 'vitest';
import { Application, Commission, DeliverySubmission } from '@/types/commission';
import { ProjectContract } from '@/types/contract';
import { EscrowBundle } from '@/types/escrow';
import { ProjectProgress } from '@/services/commissionService';
import { buildAigcerTodos, buildClientTodos } from '@/services/projectTodoService';

const commission: Commission = {
  id: 1,
  title: 'AI科幻短片制作',
  description: '测试项目',
  tag: '企业认证',
  reputation: '信誉优良',
  deadline: '2026-06-12',
  category: '创意短片',
  applicants: 1,
  priceRange: '¥5k ~ 15k',
  authorId: 'client-1',
  authorNickname: '画境工作室',
  authorVerification: 'enterprise',
  purpose: '商业用途',
  status: 'open',
};

const acceptedApplication: Application = {
  id: 'app-1',
  commissionId: 1,
  aigcerId: 'aigcer-1',
  aigcerNickname: '星河影像',
  message: '我可以做',
  expectedPrice: '¥12000',
  status: 'accepted',
  appliedAt: '2026-04-18T10:00:00.000Z',
};

const progress: ProjectProgress = {
  commissionId: 1,
  currentStage: 'script',
  stageStatus: 'waiting_owner',
  updatedAt: '2026-06-04T10:00:00.000Z',
};

const contract: ProjectContract = {
  id: 'contract-1',
  commissionId: 1,
  commissionTitle: commission.title,
  clientId: 'client-1',
  clientName: '画境工作室',
  aigcerId: 'aigcer-1',
  aigcerName: '星河影像',
  budgetText: '¥5k ~ 15k',
  deliveryFormat: 'MP4',
  milestoneSummary: '脚本、终稿',
  escrowSummary: '按节点释放',
  terms: '项目交付条款',
  status: 'draft',
  createdAt: '2026-06-04T10:00:00.000Z',
  updatedAt: '2026-06-04T10:00:00.000Z',
};

const escrowBundle: EscrowBundle = {
  plan: {
    id: 'escrow-1',
    commissionId: 1,
    totalAmount: 15000,
    currency: 'CNY',
    status: 'draft',
    releasedAmount: 0,
    createdById: 'client-1',
    createdAt: '2026-06-04T10:00:00.000Z',
    updatedAt: '2026-06-04T10:00:00.000Z',
  },
  milestones: [],
  releases: [],
};

const changeRequest: DeliverySubmission = {
  id: 'delivery-1',
  commissionId: 1,
  stageId: 'script',
  stageLabel: '脚本',
  version: 1,
  title: '脚本初稿',
  description: '需要修改',
  submittedById: 'aigcer-1',
  submittedByName: '星河影像',
  status: 'changes_requested',
  feedback: '请调整节奏',
  createdAt: '2026-06-04T10:00:00.000Z',
  updatedAt: '2026-06-04T10:00:00.000Z',
};

describe('projectTodoService', () => {
  it('creates client todos for missing contract, draft escrow, and waiting owner delivery', () => {
    const todos = buildClientTodos({
      commissions: [commission],
      applications: [acceptedApplication],
      contractsByCommission: {},
      escrowByCommission: { 1: escrowBundle },
      progressByCommission: { 1: progress },
      deliveriesByCommission: {},
    });

    expect(todos.map((todo) => todo.actionLabel)).toEqual(['生成合同', '确认交付', '确认托管']);
    expect(todos[0]).toMatchObject({
      commissionTitle: commission.title,
      targetPath: '/commissions/1',
      priority: 10,
    });
  });

  it('creates client todo when there is no escrow plan', () => {
    const todos = buildClientTodos({
      commissions: [commission],
      applications: [acceptedApplication],
      contractsByCommission: { 1: { ...contract, clientSignedAt: '2026-06-04T10:01:00.000Z' } },
      escrowByCommission: {},
      progressByCommission: {},
      deliveriesByCommission: {},
    });

    expect(todos.map((todo) => todo.actionLabel)).toContain('创建托管');
  });

  it('creates aigcer todos for unsigned contract, current stage submission, and requested changes', () => {
    const todos = buildAigcerTodos({
      applications: [acceptedApplication],
      commissionsById: { 1: commission },
      contractsByCommission: { 1: contract },
      progressByCommission: { 1: { ...progress, stageStatus: 'waiting_aigcer' } },
      deliveriesByCommission: { 1: [changeRequest] },
    });

    expect(todos.map((todo) => todo.actionLabel)).toEqual(['签署合同', '修改交付', '提交节点']);
    expect(todos[1].description).toContain('请调整节奏');
  });
});
