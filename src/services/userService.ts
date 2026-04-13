// src/services/userService.ts
import { supabase } from '@/lib/supabase';
import { User, VerificationStatus, ClientVerificationType, AigcerProfile } from '@/types/user';
import { mapProfile } from '@/services/authService';

export async function updateVerificationStatus(
  userId: string,
  status: VerificationStatus,
  clientVerificationType?: ClientVerificationType,
): Promise<User> {
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
