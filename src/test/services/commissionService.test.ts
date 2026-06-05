import { describe, it, expect, beforeEach } from 'vitest';
import {
  addDeliveryReviewComment,
  createProjectDispute,
  getCommissions, getCommissionById, createCommission,
  applyToCommission, getApplicationsByAigcer,
  formatProjectInvitationResponse,
  getDeliveryReviewComments,
  getProjectDisputes,
  getApplicationsByCommission, inviteCreatorToCommission,
  hasProjectInvitationResponse,
  isProjectInvitationApplication,
  submitProjectStageDelivery,
} from '@/services/commissionService';

beforeEach(() => { localStorage.clear(); });

describe('commissionService local fallback', () => {
  it('returns demo commissions without waiting for Supabase configuration', async () => {
    const list = await getCommissions();

    expect(list.some((item) => item.id === 1)).toBe(true);
  });

  it('adds invited creators to the project candidate pool', async () => {
    const commission = await getCommissionById(0);
    expect(commission).not.toBeNull();

    const invited = await inviteCreatorToCommission(
      commission!,
      'creator-ink-motion',
      '青岚动境',
      commission!.authorId,
    );

    expect(invited).toMatchObject({
      commissionId: commission!.id,
      aigcerId: 'creator-ink-motion',
      status: 'pending',
      expectedPrice: commission!.priceRange,
    });
    expect(invited.message).toContain('项目邀约');

    const applications = await getApplicationsByCommission(commission!.id);
    expect(applications.some((item) => item.aigcerId === 'creator-ink-motion')).toBe(true);
  });

  it('prevents duplicate creator invitations for the same project', async () => {
    const commission = await getCommissionById(0);
    expect(commission).not.toBeNull();

    await inviteCreatorToCommission(commission!, 'creator-ink-motion', '青岚动境', commission!.authorId);

    await expect(
      inviteCreatorToCommission(commission!, 'creator-ink-motion', '青岚动境', commission!.authorId),
    ).rejects.toThrow('已经应征过该项目');
  });

  it('identifies invitation applications and formatted responses', async () => {
    const commission = await getCommissionById(0);
    expect(commission).not.toBeNull();

    const invited = await inviteCreatorToCommission(
      commission!,
      'creator-ink-motion',
      '青岚动境',
      commission!.authorId,
    );
    const responded = {
      ...invited,
      message: formatProjectInvitationResponse('我有档期，可先提供首版样片。'),
    };
    const regular = {
      ...invited,
      message: '我想应征这个项目。',
    };

    expect(isProjectInvitationApplication(invited)).toBe(true);
    expect(isProjectInvitationApplication(responded)).toBe(true);
    expect(isProjectInvitationApplication(regular)).toBe(false);
    expect(hasProjectInvitationResponse(invited)).toBe(false);
    expect(hasProjectInvitationResponse(responded)).toBe(true);
  });

  it('stores review comments against a specific delivery version', async () => {
    const { delivery } = await submitProjectStageDelivery(0, {
      title: '脚本初稿',
      description: '提交脚本初稿和镜头节奏说明。',
      submittedById: 'creator-ink-motion',
      submittedByName: '青岚动境',
    });

    const comment = await addDeliveryReviewComment({
      commissionId: 0,
      deliveryId: delivery.id,
      stageId: delivery.stageId,
      authorId: 'client-1',
      authorName: '品牌甲方',
      authorRole: 'client',
      body: '第 3 镜头需要补产品特写。',
      commentType: 'change_request',
    });
    await addDeliveryReviewComment({
      commissionId: 1,
      deliveryId: 'other-delivery',
      stageId: 'script',
      authorId: 'client-1',
      authorName: '品牌甲方',
      authorRole: 'client',
      body: '其他项目批注',
    });

    const comments = await getDeliveryReviewComments(0);

    expect(comment.commentType).toBe('change_request');
    expect(comments).toHaveLength(1);
    expect(comments[0]).toMatchObject({
      deliveryId: delivery.id,
      body: '第 3 镜头需要补产品特写。',
    });
  });

  it('rejects empty delivery review comments', async () => {
    await expect(addDeliveryReviewComment({
      commissionId: 0,
      deliveryId: 'delivery-1',
      stageId: 'script',
      authorId: 'client-1',
      authorName: '品牌甲方',
      authorRole: 'client',
      body: '   ',
    })).rejects.toThrow('请填写批注内容');
  });

  it('stores disputes against a specific delivery version when available', async () => {
    const { delivery } = await submitProjectStageDelivery(0, {
      title: '脚本争议版本',
      description: '提交后进入争议处理。',
      submittedById: 'creator-ink-motion',
      submittedByName: '青岚动境',
    });

    const dispute = await createProjectDispute({
      commissionId: 0,
      commissionTitle: '企业品牌AI宣传片制作',
      stageId: delivery.stageId,
      stageLabel: delivery.stageLabel,
      deliveryId: delivery.id,
      deliveryVersion: delivery.version,
      deliveryTitle: delivery.title,
      applicantId: 'creator-ink-motion',
      applicantName: '青岚动境',
      reporterId: 'client-1',
      reporterName: '品牌甲方',
      reason: '脚本范围和约定不一致。',
      expectation: '希望平台要求补充修改。',
    });
    const disputes = await getProjectDisputes(0);

    expect(dispute).toMatchObject({
      deliveryId: delivery.id,
      deliveryVersion: 1,
      deliveryTitle: '脚本争议版本',
    });
    expect(disputes[0]).toMatchObject({
      deliveryId: delivery.id,
      deliveryTitle: '脚本争议版本',
    });
  });
});

describe.skip('getCommissions', () => {
  it('returns static commissions when no user commissions exist', async () => {
    const list = await getCommissions();
    expect(list.length).toBeGreaterThanOrEqual(8);
    expect(list[0].id).toBe(0);
  });

  it('includes newly created commissions', async () => {
    await createCommission({
      title: '新项目', description: '描述', tag: '实名认证',
      deadline: '2026-12-01', category: '创意短片', priceRange: '¥1k - 3k',
      authorId: 'user1', authorNickname: '张三', authorVerification: 'realname',
      purpose: '商业用途', reputation: '信誉优良',
    });
    const list = await getCommissions();
    expect(list.some(c => c.title === '新项目')).toBe(true);
  });
});

describe.skip('getCommissionById', () => {
  it('returns commission with matching id', async () => {
    const c = await getCommissionById(0);
    expect(c?.title).toBe('企业品牌AI宣传片制作');
  });

  it('returns null for unknown id', async () => {
    const c = await getCommissionById(99999);
    expect(c).toBeNull();
  });
});

describe.skip('applyToCommission', () => {
  it('creates application', async () => {
    const app = await applyToCommission(0, 'aigcer1', '李四', '我来应征', '¥5k');
    expect(app.commissionId).toBe(0);
    expect(app.status).toBe('pending');
  });

  it('throws if already applied', async () => {
    await applyToCommission(0, 'aigcer1', '李四', 'msg', '¥5k');
    await expect(applyToCommission(0, 'aigcer1', '李四', 'msg2', '¥5k'))
      .rejects.toThrow('已经应征过该项目');
  });
});

describe.skip('getApplicationsByAigcer', () => {
  it('returns only applications for given aigcer', async () => {
    await applyToCommission(0, 'aigcer-A', 'A', 'msg', '¥1k');
    await applyToCommission(1, 'aigcer-B', 'B', 'msg', '¥2k');
    const apps = await getApplicationsByAigcer('aigcer-A');
    expect(apps).toHaveLength(1);
    expect(apps[0].aigcerId).toBe('aigcer-A');
  });
});
