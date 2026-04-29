import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { AigcerProfile, ClientVerificationType, User, VerificationStatus } from '@/types/user';
import { demoUsers } from '@/data/mockData';
import { mapProfile, ProfileRow } from '@/services/authService';

const USERS_KEY = 'visionai.users';
const CURRENT_USER_KEY = 'visionai.currentUser';

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
  const nextUsers = users.map((user) => (user.id === userId ? { ...user, ...updates } : user));
  const updated = nextUsers.find((user) => user.id === userId);
  if (!updated) throw new Error('用户不存在');

  window.localStorage.setItem(USERS_KEY, JSON.stringify(nextUsers));
  window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updated));
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
    .single<ProfileRow>();

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
    .single<ProfileRow>();

  if (error) throw new Error(error.message);
  return mapProfile(data);
}
