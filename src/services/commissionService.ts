// src/services/commissionService.ts
import { supabase } from '@/lib/supabase';
import { Commission, Application } from '@/types/commission';
import { demoApplications, demoCommissions, demoUsers } from '@/data/mockData';

const COMMISSIONS_KEY = 'visionai.commissions';
const APPLICATIONS_KEY = 'visionai.applications';
const isSupabaseConfigured = !String(import.meta.env.VITE_SUPABASE_URL || '').includes('placeholder');

function readStored<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStored<T>(key: string, value: T) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(key, JSON.stringify(value));
  }
}

function localCommissions(): Commission[] {
  return readStored(COMMISSIONS_KEY, demoCommissions);
}

function saveLocalCommissions(commissions: Commission[]) {
  writeStored(COMMISSIONS_KEY, commissions);
}

function localApplications(): Application[] {
  return readStored(APPLICATIONS_KEY, demoApplications);
}

function saveLocalApplications(applications: Application[]) {
  writeStored(APPLICATIONS_KEY, applications);
}

async function withFallback<T>(remote: () => Promise<T>, local: () => T | Promise<T>): Promise<T> {
  if (!isSupabaseConfigured) return local();
  try {
    return await remote();
  } catch (error) {
    console.warn('Supabase unavailable, using local demo data.', error);
    return local();
  }
}

function mapCommission(row: Record<string, unknown>): Commission {
  return {
    id: row.id as number,
    title: row.title as string,
    description: row.description as string,
    tag: row.tag as Commission['tag'],
    reputation: (row.reputation as string) || '信誉优良',
    deadline: row.deadline as string,
    category: row.category as string,
    applicants: (row.applicants as number) || 0,
    priceRange: row.price_range as string,
    authorId: (row.author_id as string) || 'mock',
    authorNickname: row.author_nickname as string,
    authorVerification: (row.author_verification as Commission['authorVerification']) || 'none',
    purpose: row.purpose as Commission['purpose'],
    rating: row.rating as number,
    reviews: row.reviews as number,
    completionRate: row.completion_rate as string,
    handlingFee: row.handling_fee as string,
  };
}

function mapApplication(row: Record<string, unknown>): Application {
  return {
    id: row.id as string,
    commissionId: row.commission_id as number,
    aigcerId: row.aigcer_id as string,
    aigcerNickname: row.aigcer_nickname as string,
    message: row.message as string,
    expectedPrice: row.expected_price as string,
    status: row.status as Application['status'],
    appliedAt: row.applied_at as string,
  };
}

export async function getCommissions(): Promise<Commission[]> {
  return withFallback(async () => {
    const { data, error } = await supabase
      .from('commissions')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map(mapCommission);
  }, () => localCommissions().sort((a, b) => b.id - a.id));
}

export async function getCommissionById(id: number): Promise<Commission | null> {
  return withFallback(async () => {
    const { data, error } = await supabase
      .from('commissions')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return mapCommission(data);
  }, () => localCommissions().find((commission) => commission.id === id) ?? null);
}

export async function getCommissionsByAuthor(authorId: string): Promise<Commission[]> {
  return withFallback(async () => {
    const { data, error } = await supabase
      .from('commissions')
      .select('*')
      .eq('author_id', authorId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map(mapCommission);
  }, () => localCommissions().filter((commission) => commission.authorId === authorId).sort((a, b) => b.id - a.id));
}

export async function createCommission(
  data: Omit<Commission, 'id' | 'applicants'>,
): Promise<Commission> {
  return withFallback(async () => {
    const { data: row, error } = await supabase
      .from('commissions')
      .insert({
        title: data.title,
        description: data.description,
        tag: data.tag,
        reputation: data.reputation,
        deadline: data.deadline,
        category: data.category,
        price_range: data.priceRange,
        author_id: data.authorId,
        author_nickname: data.authorNickname,
        author_verification: data.authorVerification,
        purpose: data.purpose,
        rating: data.rating ?? 5,
        reviews: data.reviews ?? 0,
        completion_rate: data.completionRate ?? '0 / 0',
        handling_fee: data.handlingFee ?? '5%',
        applicants: 0,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return mapCommission(row);
  }, () => {
    const commissions = localCommissions();
    const commission: Commission = {
      ...data,
      id: Math.max(0, ...commissions.map((item) => item.id)) + 1,
      applicants: 0,
      rating: data.rating ?? 5,
      reviews: data.reviews ?? 0,
      completionRate: data.completionRate ?? '0 / 0',
      handlingFee: data.handlingFee ?? '5%',
    };
    saveLocalCommissions([commission, ...commissions]);
    return commission;
  });
}

export async function applyToCommission(
  commissionId: number,
  aigcerId: string,
  aigcerNickname: string,
  message: string,
  expectedPrice: string,
): Promise<Application> {
  return withFallback(async () => {
    const { data: existing } = await supabase
      .from('applications')
      .select('id')
      .eq('commission_id', commissionId)
      .eq('aigcer_id', aigcerId)
      .maybeSingle();
    if (existing) throw new Error('已经应征过该项目');

    const { data, error } = await supabase
      .from('applications')
      .insert({
        commission_id: commissionId,
        aigcer_id: aigcerId,
        aigcer_nickname: aigcerNickname,
        message,
        expected_price: expectedPrice,
        status: 'pending',
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    const { data: commission } = await supabase
      .from('commissions')
      .select('applicants')
      .eq('id', commissionId)
      .single();
    await supabase
      .from('commissions')
      .update({ applicants: ((commission?.applicants as number) || 0) + 1 })
      .eq('id', commissionId);

    return mapApplication(data);
  }, () => {
    const applications = localApplications();
    if (applications.some((application) => application.commissionId === commissionId && application.aigcerId === aigcerId)) {
      throw new Error('已经应征过该项目');
    }
    const application: Application = {
      id: `app-${Date.now()}`,
      commissionId,
      aigcerId,
      aigcerNickname,
      message,
      expectedPrice,
      status: 'pending',
      appliedAt: new Date().toISOString(),
    };
    saveLocalApplications([application, ...applications]);
    saveLocalCommissions(localCommissions().map((commission) => (
      commission.id === commissionId ? { ...commission, applicants: commission.applicants + 1 } : commission
    )));
    return application;
  });
}

export async function getApplicationsByAigcer(aigcerId: string): Promise<Application[]> {
  return withFallback(async () => {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('aigcer_id', aigcerId);
    if (error) throw new Error(error.message);
    return (data || []).map(mapApplication);
  }, () => localApplications().filter((application) => application.aigcerId === aigcerId));
}

export async function getApplicationsByCommission(commissionId: number): Promise<Application[]> {
  return withFallback(async () => {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('commission_id', commissionId);
    if (error) throw new Error(error.message);
    return (data || []).map(mapApplication);
  }, () => localApplications().filter((application) => application.commissionId === commissionId));
}

export type ApplicantWithProfile = Application & {
  bio: string;
  styles: string[];
  tools: string[];
};

export async function getApplicantsWithProfiles(
  commissionId: number
): Promise<ApplicantWithProfile[]> {
  return withFallback(async () => {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        profiles:aigcer_id (bio, styles, tools)
      `)
      .eq('commission_id', commissionId);
    if (error) throw new Error(error.message);

    return (data || []).map((row) => {
      const profile = row.profiles as { bio: string; styles: string[]; tools: string[] } | null;
      return {
        ...mapApplication(row),
        bio: profile?.bio || '',
        styles: profile?.styles || [],
        tools: profile?.tools || [],
      };
    });
  }, () => localApplications()
    .filter((application) => application.commissionId === commissionId)
    .map((application) => {
      const profile = demoUsers.find((user) => user.id === application.aigcerId)?.aigcerProfile;
      return {
        ...application,
        bio: profile?.bio || '',
        styles: profile?.styles || [],
        tools: profile?.tools || [],
      };
    }));
}
