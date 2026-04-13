// src/types/user.ts
export type UserRole = 'aigcer' | 'client';
export type VerificationStatus = 'none' | 'pending' | 'verified';
export type ClientVerificationType = 'realname' | 'enterprise';

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
}

export interface AigcerProfile {
  bio: string;
  styles: string[];
  tools: string[];
  portfolio: PortfolioItem[];
}

export interface User {
  id: string;
  email: string;
  phone: string;
  nickname: string;
  role: UserRole;
  verificationStatus: VerificationStatus;
  clientVerificationType?: ClientVerificationType;
  aigcerProfile?: AigcerProfile;
  avatar?: string;
  createdAt: string;
}
