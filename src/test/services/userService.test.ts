// src/test/services/userService.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { register } from '@/services/authService';
import { updateVerificationStatus, saveAigcerProfile } from '@/services/userService';

beforeEach(() => { localStorage.clear(); });

describe.skip('updateVerificationStatus', () => {
  it('updates verificationStatus to verified', async () => {
    const user = await register({ phone: '13800000001', email: '', password: 'p', nickname: 'U', role: 'client' });
    const updated = await updateVerificationStatus(user.id, 'verified', 'realname');
    expect(updated.verificationStatus).toBe('verified');
    expect(updated.clientVerificationType).toBe('realname');
  });
});

describe.skip('saveAigcerProfile', () => {
  it('saves profile to user', async () => {
    const user = await register({ phone: '13800000002', email: '', password: 'p', nickname: 'A', role: 'aigcer' });
    const updated = await saveAigcerProfile(user.id, {
      bio: '我是AIGCer', styles: ['二次元'], tools: ['Runway'],
      portfolio: [],
    });
    expect(updated.aigcerProfile?.bio).toBe('我是AIGCer');
    expect(updated.aigcerProfile?.styles).toContain('二次元');
  });
});
