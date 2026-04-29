import { beforeEach, describe, expect, it, vi } from 'vitest';

const supabaseState = vi.hoisted(() => ({
  loginError: null as Error | null,
  commissionsData: [] as Array<Record<string, unknown>>,
}));

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      signInWithPassword: vi.fn(async () => ({
        data: { user: null },
        error: supabaseState.loginError ?? new Error('remote auth unavailable'),
      })),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(async () => ({ data: { user: null }, error: null })),
    },
    from: vi.fn((table: string) => {
      if (table === 'commissions') {
        return {
          select: vi.fn(() => ({
            order: vi.fn(async () => ({ data: supabaseState.commissionsData, error: null })),
          })),
        };
      }

      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({ data: null, error: null })),
            single: vi.fn(async () => ({ data: null, error: null })),
          })),
        })),
      };
    }),
  },
}));

describe('P0 product flow fallbacks', () => {
  beforeEach(() => {
    localStorage.clear();
    supabaseState.loginError = new Error('remote auth unavailable');
    supabaseState.commissionsData = [];
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.resetModules();
  });

  it('lets demo client sign in when remote auth is unavailable', async () => {
    const { login } = await import('@/services/authService');

    const user = await login({ account: '823760642@qq.com', password: '321123' });

    expect(user.id).toBe('demo-client');
    expect(user.role).toBe('client');
    expect(user.verificationStatus).toBe('verified');
  });

  it('shows seeded demo commissions when the configured remote has no projects', async () => {
    const { getCommissions } = await import('@/services/commissionService');

    const commissions = await getCommissions();

    expect(commissions.length).toBeGreaterThan(0);
    expect(commissions.some((commission) => commission.title.includes('AI'))).toBe(true);
  });

  it('advances accepted project progress through the first delivery stage', async () => {
    const {
      advanceProjectProgress,
      getProjectProgress,
    } = await import('@/services/commissionService');

    expect(getProjectProgress(1).currentStage).toBe('kickoff');

    const next = advanceProjectProgress(1);

    expect(next.currentStage).toBe('concept');
    expect(getProjectProgress(1).currentStage).toBe('concept');
  });

  it('lets project owners edit, close, and delete a project in the local fallback store', async () => {
    const {
      closeCommission,
      deleteCommission,
      getCommissionById,
      updateCommission,
    } = await import('@/services/commissionService');

    const edited = await updateCommission(0, { title: '更新后的品牌片项目' });
    expect(edited.title).toBe('更新后的品牌片项目');

    const closed = await closeCommission(0);
    expect(closed.status).toBe('closed');

    await deleteCommission(0);
    expect(await getCommissionById(0)).toBeNull();
  });

  it('lets applicants update and withdraw their pending application', async () => {
    const {
      getApplicationsByAigcer,
      updateApplicationDraft,
      withdrawApplication,
    } = await import('@/services/commissionService');

    const edited = await updateApplicationDraft('app-demo-1', {
      message: '更新后的应征说明，补充样片安排。',
      expectedPrice: '¥7200',
    });

    expect(edited.message).toContain('更新后的应征说明');
    expect(edited.expectedPrice).toBe('¥7200');

    const withdrawn = await withdrawApplication('app-demo-1');
    expect(withdrawn.status).toBe('withdrawn');

    const applications = await getApplicationsByAigcer('demo-aigcer');
    expect(applications.find((item) => item.id === 'app-demo-1')?.status).toBe('withdrawn');
  });
});
