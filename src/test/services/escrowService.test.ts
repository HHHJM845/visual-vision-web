import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: false,
  supabase: {},
}));

describe('escrowService', () => {
  beforeEach(() => {
    localStorage.clear();
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
});
