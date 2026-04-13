import { describe, it, expect, beforeEach } from 'vitest';
import {
  getCommissions, getCommissionById, createCommission,
  applyToCommission, getApplicationsByAigcer,
} from '@/services/commissionService';

beforeEach(() => { localStorage.clear(); });

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
