import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { demoUsers } from '@/data/mockData';
import { PortfolioItem, User, UserRole } from '@/types/user';
import type { User as SupabaseUser } from '@supabase/supabase-js';

const USERS_KEY = 'visionai.users';
const CURRENT_USER_KEY = 'visionai.currentUser';

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

export interface ProfileRow {
  id: string;
  email: string | null;
  phone: string | null;
  nickname: string | null;
  role: UserRole | null;
  verification_status: User['verificationStatus'] | null;
  client_verification_type: User['clientVerificationType'] | null;
  avatar_url: string | null;
  aigcer_bio: string | null;
  aigcer_styles: string[] | null;
  aigcer_tools: string[] | null;
  aigcer_portfolio: PortfolioItem[] | null;
  created_at: string | null;
}

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
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
}

function persistCurrentUser(user: User | null) {
  if (typeof window === 'undefined') return;
  if (user) window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  else window.localStorage.removeItem(CURRENT_USER_KEY);
}

function localRegister(params: RegisterParams): User {
  const users = readUsers();
  if (users.some((user) => user.email.toLowerCase() === params.email.toLowerCase())) {
    throw new Error('该邮箱已注册');
  }

  const user: User = {
    id: `local-${Date.now()}`,
    email: params.email,
    phone: params.phone || '',
    nickname: params.nickname,
    role: params.role,
    verificationStatus: 'none',
    createdAt: new Date().toISOString(),
  };
  writeUsers([user, ...users]);
  persistCurrentUser(user);
  return user;
}

function localLogin(params: LoginParams): User {
  const users = readUsers();
  const user =
    users.find((item) => item.email.toLowerCase() === params.account.toLowerCase()) ||
    (params.account === '823760642@qq.com' ? users.find((item) => item.id === 'demo-client') : undefined) ||
    (params.account === 'aigcer@visionai.demo' ? users.find((item) => item.id === 'demo-aigcer') : undefined);

  if (!user || params.password.length < 6) {
    throw new Error('账号或密码错误');
  }

  persistCurrentUser(user);
  return user;
}

function profileFromAuthUser(authUser: SupabaseUser): User {
  const metadata = authUser.user_metadata ?? {};
  const role: UserRole = metadata.role === 'client' ? 'client' : 'aigcer';

  return {
    id: authUser.id,
    email: authUser.email || '',
    phone: typeof metadata.phone === 'string' ? metadata.phone : '',
    nickname:
      (typeof metadata.nickname === 'string' && metadata.nickname) ||
      authUser.email?.split('@')[0] ||
      '新用户',
    role,
    verificationStatus: 'none',
    createdAt: authUser.created_at || new Date().toISOString(),
  };
}

export function mapProfile(row: ProfileRow): User {
  const role: UserRole = row.role === 'client' ? 'client' : 'aigcer';

  return {
    id: row.id,
    email: row.email || '',
    phone: row.phone || '',
    nickname: row.nickname || '新用户',
    role,
    verificationStatus: row.verification_status || 'none',
    clientVerificationType: row.client_verification_type || undefined,
    avatar: row.avatar_url || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    aigcerProfile: row.aigcer_bio
      ? {
          bio: row.aigcer_bio,
          styles: row.aigcer_styles || [],
          tools: row.aigcer_tools || [],
          portfolio: row.aigcer_portfolio || [],
        }
      : undefined,
  };
}

async function fetchProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle<ProfileRow>();

  if (error) throw new Error(error.message);
  return data ? mapProfile(data) : null;
}

async function upsertProfile(authUser: SupabaseUser, params?: Partial<RegisterParams>): Promise<User> {
  const fallback = profileFromAuthUser(authUser);
  const row = {
    id: authUser.id,
    email: params?.email || fallback.email,
    phone: params?.phone || fallback.phone,
    nickname: params?.nickname || fallback.nickname,
    role: params?.role || fallback.role,
    verification_status: 'none' as const,
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert(row, { onConflict: 'id' })
    .select()
    .single<ProfileRow>();

  if (error) {
    const existing = await fetchProfile(authUser.id).catch(() => null);
    if (existing) return existing;
    throw new Error(error.message);
  }

  return mapProfile(data);
}

export async function register(params: RegisterParams): Promise<User> {
  if (!isSupabaseConfigured) return localRegister(params);

  const { data, error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: {
        nickname: params.nickname,
        phone: params.phone || '',
        role: params.role,
      },
    },
  });

  if (error) {
    throw new Error(error.message === 'User already registered' ? '该邮箱已注册' : error.message);
  }
  if (!data.user) throw new Error('注册失败，请稍后重试');

  const user = await upsertProfile(data.user, params);
  persistCurrentUser(user);
  return user;
}

export async function login(params: LoginParams): Promise<User> {
  if (!isSupabaseConfigured) return localLogin(params);

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: params.account,
      password: params.password,
    });

    if (error || !data.user) {
      throw new Error('账号或密码错误');
    }

    const user = (await fetchProfile(data.user.id)) || (await upsertProfile(data.user));
    persistCurrentUser(user);
    return user;
  } catch (error) {
    try {
      return localLogin(params);
    } catch {
      throw error instanceof Error ? error : new Error('账号或密码错误');
    }
  }
}

export async function logout(): Promise<void> {
  persistCurrentUser(null);
  if (isSupabaseConfigured) await supabase.auth.signOut();
}

export async function getCurrentUser(): Promise<User | null> {
  if (!isSupabaseConfigured) {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      window.localStorage.removeItem(CURRENT_USER_KEY);
      return null;
    }
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const current = (await fetchProfile(user.id)) || (await upsertProfile(user));
  persistCurrentUser(current);
  return current;
}

export async function updateStoredUser(
  userId: string,
  updates: Record<string, unknown>,
): Promise<User> {
  if (!isSupabaseConfigured) {
    const users = readUsers();
    const nextUsers = users.map((user) =>
      user.id === userId ? ({ ...user, ...updates } as User) : user,
    );
    writeUsers(nextUsers);
    const updated = nextUsers.find((user) => user.id === userId);
    if (!updated) throw new Error('用户不存在');
    persistCurrentUser(updated);
    return updated;
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single<ProfileRow>();

  if (error) throw new Error(error.message);

  const user = mapProfile(data);
  persistCurrentUser(user);
  return user;
}
