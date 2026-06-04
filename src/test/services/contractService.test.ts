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
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(async () => ({ data: null, error: new Error('offline') })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(async () => ({ data: null, error: new Error('offline') })),
          })),
        })),
      })),
    })),
  },
}));

const draftInput = {
  commissionId: 1,
  commissionTitle: '品牌视觉短片',
  clientId: 'client-1',
  clientName: '甲方团队',
  aigcerId: 'aigcer-1',
  aigcerName: '创作者 A',
  budgetText: '¥10,000',
  deliveryFormat: '视频 + 分镜文件',
  milestoneSummary: '脚本、初稿、终稿',
  escrowSummary: '平台托管，按节点释放',
};

describe('contractService', () => {
  beforeEach(() => {
    localStorage.clear();
    supabaseState.isConfigured = false;
    supabaseState.failRemote = true;
    supabaseState.fromCalls = 0;
    vi.resetModules();
  });

  it('creates a draft contract for a selected creator', async () => {
    const { createContractDraft } = await import('@/services/contractService');

    const contract = await createContractDraft(draftInput);

    expect(contract.status).toBe('draft');
    expect(contract.commissionId).toBe(1);
    expect(contract.clientName).toBe('甲方团队');
    expect(contract.aigcerName).toBe('创作者 A');
    expect(contract.terms).toContain('项目交付');
  });

  it('returns an existing contract instead of creating duplicate contracts for the same commission', async () => {
    const { createContractDraft } = await import('@/services/contractService');

    const first = await createContractDraft(draftInput);
    const second = await createContractDraft({ ...draftInput, budgetText: '¥20,000' });

    expect(second.id).toBe(first.id);
    expect(second.budgetText).toBe('¥10,000');
  });

  it('moves to client_signed when the client signs first', async () => {
    const { createContractDraft, signContract } = await import('@/services/contractService');

    const contract = await createContractDraft(draftInput);
    const signed = await signContract(contract.id, 'client');

    expect(signed.status).toBe('client_signed');
    expect(signed.clientSignedAt).toBeTruthy();
    expect(signed.aigcerSignedAt).toBeUndefined();
  });

  it('moves to aigcer_signed when the creator signs first', async () => {
    const { createContractDraft, signContract } = await import('@/services/contractService');

    const contract = await createContractDraft(draftInput);
    const signed = await signContract(contract.id, 'aigcer');

    expect(signed.status).toBe('aigcer_signed');
    expect(signed.aigcerSignedAt).toBeTruthy();
    expect(signed.clientSignedAt).toBeUndefined();
  });

  it('marks the contract active after both parties sign', async () => {
    const { createContractDraft, signContract } = await import('@/services/contractService');

    const contract = await createContractDraft(draftInput);
    await signContract(contract.id, 'client');
    const active = await signContract(contract.id, 'aigcer');

    expect(active.status).toBe('active');
    expect(active.clientSignedAt).toBeTruthy();
    expect(active.aigcerSignedAt).toBeTruthy();
  });

  it('does not change a signature timestamp when the same party signs again', async () => {
    const { createContractDraft, signContract } = await import('@/services/contractService');

    const contract = await createContractDraft(draftInput);
    const first = await signContract(contract.id, 'client');
    const second = await signContract(contract.id, 'client');

    expect(second.clientSignedAt).toBe(first.clientSignedAt);
    expect(second.status).toBe('client_signed');
  });

  it('falls back to local storage when remote contract table is unavailable', async () => {
    supabaseState.isConfigured = true;
    supabaseState.failRemote = true;

    const { createContractDraft } = await import('@/services/contractService');
    const contract = await createContractDraft(draftInput);

    expect(contract.status).toBe('draft');
    expect(contract.commissionTitle).toBe('品牌视觉短片');
    expect(supabaseState.fromCalls).toBeGreaterThan(0);
  });
});
