// src/test/services/authService.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { register, login, logout, getCurrentUser } from '@/services/authService';

beforeEach(() => {
  localStorage.clear();
});

describe.skip('register', () => {
  it('creates a user and returns it without password', async () => {
    const user = await register({
      phone: '13800000001', email: 'test@test.com',
      password: 'pass123', nickname: '测试用户', role: 'aigcer',
    });
    expect(user.nickname).toBe('测试用户');
    expect(user.role).toBe('aigcer');
    expect(user.verificationStatus).toBe('none');
    expect('password' in user).toBe(false);
  });

  it('throws if phone already registered', async () => {
    await register({ phone: '13800000001', email: 'a@a.com', password: 'p', nickname: 'A', role: 'client' });
    await expect(register({ phone: '13800000001', email: 'b@b.com', password: 'p', nickname: 'B', role: 'client' }))
      .rejects.toThrow('该账号已注册');
  });
});

describe.skip('login', () => {
  it('returns user on correct credentials', async () => {
    await register({ phone: '13900000001', email: '', password: 'secret', nickname: '登录测试', role: 'client' });
    const user = await login({ account: '13900000001', password: 'secret' });
    expect(user.nickname).toBe('登录测试');
  });

  it('throws on wrong password', async () => {
    await register({ phone: '13900000002', email: '', password: 'correct', nickname: 'X', role: 'aigcer' });
    await expect(login({ account: '13900000002', password: 'wrong' })).rejects.toThrow('账号或密码错误');
  });
});

describe.skip('getCurrentUser', () => {
  it('returns null when not logged in', () => {
    expect(getCurrentUser()).toBeNull();
  });

  it('returns user after login', async () => {
    await register({ phone: '13700000001', email: '', password: 'p', nickname: '当前用户', role: 'aigcer' });
    const user = getCurrentUser();
    expect(user?.nickname).toBe('当前用户');
  });
});

describe.skip('logout', () => {
  it('clears current user', async () => {
    await register({ phone: '13600000001', email: '', password: 'p', nickname: 'L', role: 'client' });
    logout();
    expect(getCurrentUser()).toBeNull();
  });
});
