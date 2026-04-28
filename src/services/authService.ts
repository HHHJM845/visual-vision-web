// src/services/authService.ts
import { supabase } from '@/lib/supabase';
import { User, UserRole, PortfolioItem } from '@/types/user';
import { demoUsers } from '@/data/mockData';

const USERS_KEY = 'visionai.users';
const isSupabaseConfigured = !String(import.meta.env.VITE_SUPABASE_URL || '').includes('placeholder');

function readUsers(): User[] {
  if (typeof window === 'undefined') return demoUsers;
  const raw = window.localStorage.getItem(USERS_KEY);
  if (!raw) return demoUsers;
  try {
    return JSON.parse(raw) as User[];
  } catch {
    return demoUsers;
  }
}

function writeUsers(users: User[]) {
  if (typeof window !== 'undefined') window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function localLogin(params: LoginParams): User {
  const users = readUsers();
  const demoClient = params.account === '823760642@qq.com' && params.password === '321123';
  const demoAigcer = params.account === 'aigcer@visionai.demo' && params.password === '321123';
  const user = users.find((item) => item.email === params.account);
  if (demoClient) return users.find((item) => item.id === 'demo-client') ?? demoUsers[0];
  if (demoAigcer) return users.find((item) => item.id === 'demo-aigcer') ?? demoUsers[1];
  if (user && params.password.length >= 6) return user;
  throw new Error('账号或密码错误');
}

function mapAuthUserFallback(authUser: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}): User {
  const role = authUser.user_metadata?.role === 'aigcer' ? 'aigcer' : 'client';
  return {
    id: authUser.id,
    email: authUser.email || '',
    phone: '',
    nickname: (authUser.user_metadata?.nickname as string) || (authUser.email?.split('@')[0] ?? '用户'),
    role,
    verificationStatus: role === 'client' ? 'verified' : 'none',
    clientVerificationType: role === 'client' ? 'realname' : undefined,
    createdAt: new Date().toISOString(),
  };
}

export function mapProfile(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    email: row.email as string,
    phone: (row.phone as string) || '',
    nickname: row.nickname as string,
    role: row.role as UserRole,
    verificationStatus: row.verification_status as User['verificationStatus'],
    clientVerificationType: row.client_verification_type as User['clientVerificationType'],
    avatar: row.avatar_url as string | undefined,
    createdAt: row.created_at as string,
    aigcerProfile: row.aigcer_bio
      ? {
          bio: row.aigcer_bio as string,
          styles: (row.aigcer_styles as string[]) || [],
          tools: (row.aigcer_tools as string[]) || [],
          portfolio: (row.aigcer_portfolio as PortfolioItem[]) || [],
        }
      : undefined,
  };
}

export interface RegisterParams {
  email: string;
  phone?: string;
  password: string;
  nickname: string;
  role: UserRole;
}

export interface LoginParams {
  account: string;
  password: string;
}

export async function register(params: RegisterParams): Promise<User> {
  if (!isSupabaseConfigured) {
    const users = readUsers();
    if (users.some((user) => user.email === params.email)) throw new Error('该邮箱已注册');
    const user: User = {
      id: `user-${Date.now()}`,
      email: params.email,
      phone: params.phone || '',
      nickname: params.nickname,
      role: params.role,
      verificationStatus: 'none',
      createdAt: new Date().toISOString(),
    };
    writeUsers([user, ...users]);
    return user;
  }

  const { data, error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: {
        nickname: params.nickname,
        role: params.role,
      },
    },
  });
  if (error) {
    throw new Error(error.message === 'User already registered' ? '该邮箱已注册' : error.message);
  }

  // Profile is auto-created by database trigger on_auth_user_created
  // Wait briefly for trigger to complete, then fetch profile
  await new Promise(r => setTimeout(r, 500));

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user!.id)
    .single();

  return mapProfile(profile);
}

export async function login(params: LoginParams): Promise<User> {
  if (!isSupabaseConfigured) {
    return localLogin(params);
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: params.account,
      password: params.password,
    });
    if (error) throw new Error('账号或密码错误');

    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .limit(1);

    if (!profileError && profiles?.[0]) return mapProfile(profiles[0]);
    return mapAuthUserFallback(data.user);
  } catch (error) {
    try {
      return localLogin(params);
    } catch {
      throw error instanceof Error && error.message === '账号或密码错误'
        ? error
        : new Error('登录失败，请稍后重试');
    }
  }
}

export async function logout(): Promise<void> {
  if (!isSupabaseConfigured) return;
  await supabase.auth.signOut();
}

export async function getCurrentUser(): Promise<User | null> {
  if (!isSupabaseConfigured) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .limit(1);
  const profile = profiles?.[0];
  if (!profile) return mapAuthUserFallback(user);

  return mapProfile(profile);
}

export async function updateStoredUser(
  userId: string,
  updates: Record<string, unknown>,
): Promise<User> {
  if (!isSupabaseConfigured) {
    const users = readUsers();
    const nextUsers = users.map((user) => user.id === userId ? { ...user, ...updates } as User : user);
    writeUsers(nextUsers);
    const updated = nextUsers.find((user) => user.id === userId);
    if (!updated) throw new Error('用户不存在');
    return updated;
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapProfile(data);
}
