// src/services/authService.ts
import { StoredUser, User, UserRole } from '@/types/user';

const USERS_KEY = 'vai_users';
const CURRENT_KEY = 'vai_current_user_id';

function getStoredUsers(): StoredUser[] {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); }
  catch { return []; }
}
function saveStoredUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export interface RegisterParams {
  phone: string;
  email: string;
  password: string;
  nickname: string;
  role: UserRole;
}

export interface LoginParams {
  account: string; // phone or email
  password: string;
}

export async function register(params: RegisterParams): Promise<User> {
  await new Promise(r => setTimeout(r, 300));
  const users = getStoredUsers();
  const exists = users.find(u =>
    (params.phone && u.phone === params.phone) ||
    (params.email && u.email === params.email)
  );
  if (exists) throw new Error('该账号已注册');
  const { password, ...rest } = {
    id: crypto.randomUUID(),
    phone: params.phone,
    email: params.email,
    nickname: params.nickname,
    role: params.role,
    verificationStatus: 'none' as const,
    password: params.password,
    createdAt: new Date().toISOString(),
  };
  const storedUser: StoredUser = { ...rest, password };
  users.push(storedUser);
  saveStoredUsers(users);
  localStorage.setItem(CURRENT_KEY, storedUser.id);
  return rest;
}

export async function login(params: LoginParams): Promise<User> {
  await new Promise(r => setTimeout(r, 300));
  const users = getStoredUsers();
  const found = users.find(u =>
    (u.phone === params.account || u.email === params.account) &&
    u.password === params.password
  );
  if (!found) throw new Error('账号或密码错误');
  localStorage.setItem(CURRENT_KEY, found.id);
  const { password: _, ...user } = found;
  return user;
}

export function logout(): void {
  localStorage.removeItem(CURRENT_KEY);
}

export function getCurrentUser(): User | null {
  const id = localStorage.getItem(CURRENT_KEY);
  if (!id) return null;
  const found = getStoredUsers().find(u => u.id === id);
  if (!found) return null;
  const { password: _, ...user } = found;
  return user;
}

export function updateStoredUser(userId: string, updates: Partial<StoredUser>): User {
  const users = getStoredUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) throw new Error('User not found');
  users[idx] = { ...users[idx], ...updates };
  saveStoredUsers(users);
  const { password: _, ...user } = users[idx];
  return user;
}
