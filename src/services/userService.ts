// src/services/userService.ts
import { supabase } from '@/lib/supabase';
import { User, VerificationStatus, ClientVerificationType, AigcerProfile } from '@/types/user';
import { mapProfile } from '@/services/authService';
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

function saveUser(userId: string, updates: Partial<User>): User {
  const users = readUsers();
  const nextUsers = users.map((user) => user.id === userId ? { ...user, ...updates } : user);
  const updated = nextUsers.find((user) => user.id === userId);
  if (!updated) throw new Error('用户不存在');
  window.localStorage.setItem(USERS_KEY, JSON.stringify(nextUsers));
  return updated;
}

export async function updateVerificationStatus(
  userId: string,
  status: VerificationStatus,
  clientVerificationType?: ClientVerificationType,
): Promise<User> {
  if (!isSupabaseConfigured) {
    return saveUser(userId, {
      verificationStatus: status,
      ...(clientVerificationType ? { clientVerificationType } : {}),
    });
  }

  const updates: Record<string, unknown> = { verification_status: status };
  if (clientVerificationType) updates.client_verification_type = clientVerificationType;

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapProfile(data);
}

export async function saveAigcerProfile(
  userId: string,
  profile: AigcerProfile,
): Promise<User> {
  if (!isSupabaseConfigured) {
    return saveUser(userId, { aigcerProfile: profile });
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({
      aigcer_bio: profile.bio,
      aigcer_styles: profile.styles,
      aigcer_tools: profile.tools,
      aigcer_portfolio: profile.portfolio,
    })
    .eq('id', userId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapProfile(data);
}
