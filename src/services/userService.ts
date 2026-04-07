// src/services/userService.ts
import { User, VerificationStatus, ClientVerificationType, AigcerProfile } from '@/types/user';
import { updateStoredUser } from '@/services/authService';

export async function updateVerificationStatus(
  userId: string,
  status: VerificationStatus,
  clientVerificationType?: ClientVerificationType,
): Promise<User> {
  await new Promise(r => setTimeout(r, 200));
  return updateStoredUser(userId, {
    verificationStatus: status,
    ...(clientVerificationType ? { clientVerificationType } : {}),
  });
}

export async function saveAigcerProfile(
  userId: string,
  profile: AigcerProfile,
): Promise<User> {
  await new Promise(r => setTimeout(r, 200));
  return updateStoredUser(userId, { aigcerProfile: profile });
}
