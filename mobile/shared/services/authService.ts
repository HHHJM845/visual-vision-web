import { supabase } from '@shared/lib/supabase';
import { User, UserRole, PortfolioItem } from '@shared/types/user';

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
  password: string;
  nickname: string;
  role: UserRole;
}

export interface LoginParams {
  account: string;
  password: string;
}

export async function register(params: RegisterParams): Promise<User> {
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

  await new Promise(r => setTimeout(r, 500));

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user!.id)
    .single();

  return mapProfile(profile);
}

export async function login(params: LoginParams): Promise<User> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: params.account,
    password: params.account,
  });
  if (error) throw new Error('账号或密码错误');

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();
  if (profileError) throw new Error(profileError.message);

  return mapProfile(profile);
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  if (!profile) return null;

  return mapProfile(profile);
}

export async function updateStoredUser(
  userId: string,
  updates: Record<string, unknown>,
): Promise<User> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapProfile(data);
}
