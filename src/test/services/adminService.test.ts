import { beforeEach, describe, expect, it } from 'vitest';
import type { Commission, ProjectDispute } from '@/types/commission';
import type { User } from '@/types/user';

const commission: Commission = {
  id: 99,
  title: '争议测试项目',
  description: '用于测试后台纠纷裁决。',
  tag: '实名认证',
  reputation: '信誉优良',
  deadline: '2026-07-01',
  category: '商业宣传片',
  applicants: 1,
  priceRange: '¥10000',
  authorId: 'client-99',
  authorNickname: '测试甲方',
  authorVerification: 'realname',
  purpose: '商业用途',
  status: 'open',
};

const dispute: ProjectDispute = {
  id: 'dispute-99',
  commissionId: commission.id,
  commissionTitle: commission.title,
  stageId: 'script',
  stageLabel: '脚本提报及反馈和确认',
  applicantId: 'aigcer-99',
  applicantName: '测试乙方',
  reporterId: 'client-99',
  reporterName: '测试甲方',
  reason: '首版脚本范围有争议。',
  expectation: '平台裁定部分释放。',
  status: 'pending',
  createdAt: '2026-06-05T10:00:00.000Z',
  updatedAt: '2026-06-05T10:00:00.000Z',
};

const admin: User = {
  id: 'admin-1',
  email: 'admin@example.com',
  phone: '',
  nickname: '管理员',
  role: 'admin',
  adminRole: 'super_admin',
  verificationStatus: 'verified',
  createdAt: '2026-06-01T00:00:00.000Z',
};

describe('adminService dispute resolution', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('visionai.commissions', JSON.stringify([commission]));
    localStorage.setItem('visionai.projectDisputes', JSON.stringify([dispute]));
  });

  it('partially releases escrow and resolves the dispute review', async () => {
    const { createEscrowDraft, freezeEscrowMilestone, fundEscrowPlan } = await import('@/services/escrowService');
    const { listAuditLogs, resolveDisputeReview } = await import('@/services/adminService');

    const draft = await createEscrowDraft({ commissionId: commission.id, totalAmount: 11000, createdById: commission.authorId });
    await fundEscrowPlan(draft.plan.id);
    await freezeEscrowMilestone({ commissionId: commission.id, stageId: 'script', frozenById: commission.authorId });

    const result = await resolveDisputeReview('dispute-dispute-99', {
      action: 'partial_release',
      releaseAmount: 500,
      note: '脚本框架已完成，释放部分款项。',
    }, admin);

    const plans = JSON.parse(localStorage.getItem('visionai.escrowPlans') || '[]');
    const milestones = JSON.parse(localStorage.getItem('visionai.escrowMilestones') || '[]');
    const releases = JSON.parse(localStorage.getItem('visionai.escrowReleases') || '[]');
    const disputes = JSON.parse(localStorage.getItem('visionai.projectDisputes') || '[]');

    expect(result.status).toBe('verified');
    expect(plans[0].releasedAmount).toBe(500);
    expect(milestones.find((item: { stageId: string }) => item.stageId === 'script').status).toBe('partially_released');
    expect(releases.map((item: { releaseType: string }) => item.releaseType)).toEqual(['refund', 'partial_release']);
    expect(disputes[0].status).toBe('resolved');
    expect(disputes[0].resolutionAction).toBe('partial_release');
    expect(disputes[0].resolutionNote).toContain('部分释放');
    expect(disputes[0].resolvedByName).toBe('管理员');
    expect(listAuditLogs()[0].note).toContain('部分释放');
  });

  it('requests supplemental delivery and returns the stage to the creator', async () => {
    const {
      getProjectProgress,
      requestProjectStageChanges,
      submitProjectStageDelivery,
    } = await import('@/services/commissionService');
    const { listAuditLogs, resolveDisputeReview } = await import('@/services/adminService');

    const { delivery: firstDelivery } = await submitProjectStageDelivery(commission.id, {
      title: '脚本初稿',
      description: '提交脚本初稿供甲方确认。',
      submittedById: 'aigcer-99',
      submittedByName: '测试乙方',
    });
    await requestProjectStageChanges(commission.id, {
      feedback: '常规修改意见。',
      requestedById: commission.authorId,
    });
    const { delivery: secondDelivery } = await submitProjectStageDelivery(commission.id, {
      title: '脚本二稿',
      description: '提交脚本二稿供甲方确认。',
      submittedById: 'aigcer-99',
      submittedByName: '测试乙方',
    });
    localStorage.setItem('visionai.projectDisputes', JSON.stringify([{
      ...dispute,
      deliveryId: firstDelivery.id,
      deliveryVersion: firstDelivery.version,
      deliveryTitle: firstDelivery.title,
    }]));

    const result = await resolveDisputeReview('dispute-dispute-99', {
      action: 'request_changes',
      note: '需要补充产品镜头说明后重新提交。',
    }, admin);

    const deliveries = JSON.parse(localStorage.getItem('visionai.projectDeliveries') || '[]');
    const disputes = JSON.parse(localStorage.getItem('visionai.projectDisputes') || '[]');
    const updatedDelivery = deliveries.find((item: { id: string }) => item.id === firstDelivery.id);
    const untouchedDelivery = deliveries.find((item: { id: string }) => item.id === secondDelivery.id);
    const progress = getProjectProgress(commission.id);

    expect(result.status).toBe('needs_changes');
    expect(updatedDelivery.status).toBe('changes_requested');
    expect(updatedDelivery.feedback).toContain('需要补充产品镜头说明');
    expect(untouchedDelivery.status).toBe('submitted');
    expect(progress.stageStatus).toBe('waiting_aigcer');
    expect(progress.currentStage).toBe('script');
    expect(progress.activeDeliveryId).toBe(firstDelivery.id);
    expect(disputes[0].status).toBe('processing');
    expect(disputes[0].resolutionAction).toBe('request_changes');
    expect(disputes[0].resolutionNote).toContain('要求补交付');
    expect(listAuditLogs()[0].note).toContain('要求补交付');
  });
});
