import { beforeEach, describe, expect, it, vi } from 'vitest';

const supabaseState = vi.hoisted(() => ({
  isConfigured: false,
  failRemote: true,
  fromCalls: 0,
}));

vi.mock('@/lib/supabase', () => ({
  get isSupabaseConfigured() {
    return supabaseState.isConfigured;
  },
  supabase: {
    from: vi.fn(() => ({
      ...(() => {
        supabaseState.fromCalls += 1;
        return {};
      })(),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(async () => ({ data: null, error: supabaseState.failRemote ? new Error('offline') : null })),
          order: vi.fn(async () => ({ data: [], error: supabaseState.failRemote ? new Error('offline') : null })),
        })),
        order: vi.fn(async () => ({ data: [], error: supabaseState.failRemote ? new Error('offline') : null })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(async () => ({ data: null, error: new Error('offline') })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(async () => ({ data: null, error: new Error('offline') })),
      })),
    })),
  },
}));

describe('escrowService', () => {
  beforeEach(() => {
    localStorage.clear();
    supabaseState.isConfigured = false;
    supabaseState.failRemote = true;
    supabaseState.fromCalls = 0;
    vi.resetModules();
  });

  it('creates default milestones whose percentages add up to 100', async () => {
    const { createEscrowDraft } = await import('@/services/escrowService');

    const draft = await createEscrowDraft({
      commissionId: 1,
      totalAmount: 10000,
      createdById: 'client-1',
    });

    expect(draft.plan.status).toBe('draft');
    expect(draft.plan.totalAmount).toBe(10000);
    expect(draft.milestones.length).toBeGreaterThan(0);
    expect(draft.milestones.reduce((sum, item) => sum + item.percent, 0)).toBe(100);
    expect(draft.milestones.reduce((sum, item) => sum + item.amount, 0)).toBe(10000);
  });

  it('derives a default escrow amount from budget text', async () => {
    const { getDefaultEscrowAmount } = await import('@/services/escrowService');

    expect(getDefaultEscrowAmount('¥3k ~ 8k')).toBe(8000);
    expect(getDefaultEscrowAmount('¥500 ~ 2k')).toBe(2000);
    expect(getDefaultEscrowAmount('1.5w - 3万')).toBe(30000);
    expect(getDefaultEscrowAmount('待议')).toBe(0);
  });

  it('returns an existing draft instead of creating duplicate plans for the same commission', async () => {
    const { createEscrowDraft } = await import('@/services/escrowService');

    const first = await createEscrowDraft({ commissionId: 1, totalAmount: 10000, createdById: 'client-1' });
    const second = await createEscrowDraft({ commissionId: 1, totalAmount: 12000, createdById: 'client-1' });

    expect(second.plan.id).toBe(first.plan.id);
    expect(second.plan.totalAmount).toBe(10000);
    expect(second.milestones).toHaveLength(first.milestones.length);
  });

  it('rejects funding when milestone percentages do not add up to 100', async () => {
    const { createEscrowDraft, updateEscrowMilestones, fundEscrowPlan } = await import('@/services/escrowService');

    const draft = await createEscrowDraft({ commissionId: 1, totalAmount: 10000, createdById: 'client-1' });
    await updateEscrowMilestones(draft.plan.id, [
      { milestoneId: draft.milestones[0].id, percent: 50 },
      { milestoneId: draft.milestones[1].id, percent: 40 },
    ]);

    await expect(fundEscrowPlan(draft.plan.id)).rejects.toThrow('付款比例合计必须等于 100%');
  });

  it('funds a valid draft plan', async () => {
    const { createEscrowDraft, fundEscrowPlan } = await import('@/services/escrowService');

    const draft = await createEscrowDraft({ commissionId: 1, totalAmount: 10000, createdById: 'client-1' });
    const funded = await fundEscrowPlan(draft.plan.id);

    expect(funded.plan.status).toBe('funded');
    expect(funded.plan.fundedAt).toBeTruthy();
  });

  it('releases a funded milestone once', async () => {
    const { createEscrowDraft, fundEscrowPlan, releaseEscrowMilestone } = await import('@/services/escrowService');

    const draft = await createEscrowDraft({ commissionId: 1, totalAmount: 10000, createdById: 'client-1' });
    await fundEscrowPlan(draft.plan.id);

    const first = await releaseEscrowMilestone({
      commissionId: 1,
      stageId: draft.milestones[0].stageId,
      releasedById: 'client-1',
      releasedToId: 'aigcer-1',
    });
    const second = await releaseEscrowMilestone({
      commissionId: 1,
      stageId: draft.milestones[0].stageId,
      releasedById: 'client-1',
      releasedToId: 'aigcer-1',
    });

    expect(first.releases).toHaveLength(1);
    expect(second.releases).toHaveLength(1);
    expect(second.plan.releasedAmount).toBe(first.plan.releasedAmount);
    expect(second.milestones[0].status).toBe('released');
  });

  it('freezes a disputed milestone and blocks release until resumed', async () => {
    const {
      createEscrowDraft,
      freezeEscrowMilestone,
      fundEscrowPlan,
      releaseEscrowMilestone,
      resumeFrozenEscrowMilestone,
    } = await import('@/services/escrowService');

    const draft = await createEscrowDraft({ commissionId: 1, totalAmount: 10000, createdById: 'client-1' });
    await fundEscrowPlan(draft.plan.id);

    const frozen = await freezeEscrowMilestone({
      commissionId: 1,
      stageId: draft.milestones[0].stageId,
      frozenById: 'client-1',
    });

    expect(frozen.plan.status).toBe('frozen');
    expect(frozen.milestones[0].status).toBe('frozen');
    await expect(releaseEscrowMilestone({
      commissionId: 1,
      stageId: draft.milestones[0].stageId,
      releasedById: 'client-1',
      releasedToId: 'aigcer-1',
    })).rejects.toThrow('当前节点款项因纠纷已冻结');

    const resumed = await resumeFrozenEscrowMilestone({
      commissionId: 1,
      stageId: draft.milestones[0].stageId,
      frozenById: 'admin-1',
    });

    expect(resumed.plan.status).toBe('funded');
    expect(resumed.milestones[0].status).toBe('pending');
  });

  it('refunds a disputed milestone without increasing creator released amount', async () => {
    const {
      createEscrowDraft,
      freezeEscrowMilestone,
      fundEscrowPlan,
      refundEscrowMilestone,
    } = await import('@/services/escrowService');

    const draft = await createEscrowDraft({ commissionId: 1, totalAmount: 11000, createdById: 'client-1' });
    await fundEscrowPlan(draft.plan.id);
    await freezeEscrowMilestone({ commissionId: 1, stageId: draft.milestones[0].stageId, frozenById: 'client-1' });

    const refunded = await refundEscrowMilestone({
      commissionId: 1,
      stageId: draft.milestones[0].stageId,
      refundedById: 'admin-1',
      refundToId: 'client-1',
      note: '裁定首节点退款',
    });

    expect(refunded.plan.status).toBe('funded');
    expect(refunded.plan.releasedAmount).toBe(0);
    expect(refunded.milestones[0].status).toBe('refunded');
    expect(refunded.releases[0]).toMatchObject({
      releaseType: 'refund',
      releasedToId: 'client-1',
      amount: draft.milestones[0].amount,
    });
  });

  it('partially releases a disputed milestone and refunds the remainder', async () => {
    const {
      createEscrowDraft,
      freezeEscrowMilestone,
      fundEscrowPlan,
      partiallyReleaseEscrowMilestone,
    } = await import('@/services/escrowService');

    const draft = await createEscrowDraft({ commissionId: 1, totalAmount: 11000, createdById: 'client-1' });
    await fundEscrowPlan(draft.plan.id);
    await freezeEscrowMilestone({ commissionId: 1, stageId: draft.milestones[0].stageId, frozenById: 'client-1' });

    const partial = await partiallyReleaseEscrowMilestone({
      commissionId: 1,
      stageId: draft.milestones[0].stageId,
      releasedById: 'admin-1',
      releasedToId: 'aigcer-1',
      refundToId: 'client-1',
      releaseAmount: 500,
      note: '已完成部分工作',
    });

    expect(partial.plan.status).toBe('funded');
    expect(partial.plan.releasedAmount).toBe(500);
    expect(partial.milestones[0].status).toBe('partially_released');
    expect(partial.releases.map((item) => item.releaseType)).toEqual(['refund', 'partial_release']);
    expect(partial.releases.find((item) => item.releaseType === 'refund')?.amount).toBe(draft.milestones[0].amount - 500);
  });

  it('marks the plan completed after all milestones are released', async () => {
    const { createEscrowDraft, fundEscrowPlan, releaseEscrowMilestone } = await import('@/services/escrowService');

    const draft = await createEscrowDraft({ commissionId: 1, totalAmount: 10000, createdById: 'client-1' });
    await fundEscrowPlan(draft.plan.id);

    let bundle = draft;
    for (const milestone of draft.milestones) {
      bundle = await releaseEscrowMilestone({
        commissionId: 1,
        stageId: milestone.stageId,
        releasedById: 'client-1',
        releasedToId: 'aigcer-1',
      });
    }

    expect(bundle.plan.status).toBe('completed');
    expect(bundle.plan.releasedAmount).toBe(10000);
  });

  it('falls back to local storage when remote escrow tables are unavailable', async () => {
    supabaseState.isConfigured = true;
    supabaseState.failRemote = true;

    const { createEscrowDraft } = await import('@/services/escrowService');
    const draft = await createEscrowDraft({ commissionId: 1, totalAmount: 10000, createdById: 'client-1' });

    expect(draft.plan.status).toBe('draft');
    expect(draft.milestones.length).toBeGreaterThan(0);
    expect(supabaseState.fromCalls).toBeGreaterThan(0);
  });
});
