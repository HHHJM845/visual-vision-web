// src/services/commissionService.ts
import { supabase } from '@/lib/supabase';
import { Commission, Application } from '@/types/commission';
import { demoApplications, demoCommissions, demoUsers } from '@/data/mockData';

const COMMISSIONS_KEY = 'visionai.commissions';
const APPLICATIONS_KEY = 'visionai.applications';
const PROJECT_PROGRESS_KEY = 'visionai.projectProgress';
const isSupabaseConfigured = !String(import.meta.env.VITE_SUPABASE_URL || '').includes('placeholder');

export const projectStages = [
  { id: 'kickoff', label: '开始合作', percent: 0, ownerAction: '确认启动', aigcerAction: '查看需求' },
  { id: 'concept', label: '概念稿', percent: 20, ownerAction: '确认概念稿', aigcerAction: '提交概念稿' },
  { id: 'storyboard', label: '分镜', percent: 40, ownerAction: '确认分镜', aigcerAction: '提交分镜' },
  { id: 'roughCut', label: '粗剪', percent: 70, ownerAction: '确认粗剪', aigcerAction: '提交粗剪' },
  { id: 'delivered', label: '确认交付', percent: 100, ownerAction: '完成验收', aigcerAction: '查看验收' },
] as const;

export type ProjectStageId = typeof projectStages[number]['id'];

export interface ProjectProgress {
  commissionId: number;
  currentStage: ProjectStageId;
  updatedAt: string;
}

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

function localProgressRecords(): ProjectProgress[] {
  return readStored<ProjectProgress[]>(PROJECT_PROGRESS_KEY, []);
}

function saveLocalProgress(records: ProjectProgress[]) {
  writeStored(PROJECT_PROGRESS_KEY, records);
}

export function getProjectProgress(commissionId: number): ProjectProgress {
  const existing = localProgressRecords().find((item) => item.commissionId === commissionId);
  return existing ?? {
    commissionId,
    currentStage: 'kickoff',
    updatedAt: new Date().toISOString(),
  };
}

export function advanceProjectProgress(commissionId: number): ProjectProgress {
  const records = localProgressRecords();
  const current = getProjectProgress(commissionId);
  const index = projectStages.findIndex((stage) => stage.id === current.currentStage);
  const nextStage = projectStages[Math.min(index + 1, projectStages.length - 1)].id;
  const next: ProjectProgress = {
    commissionId,
    currentStage: nextStage,
    updatedAt: new Date().toISOString(),
  };

  saveLocalProgress([
    next,
    ...records.filter((item) => item.commissionId !== commissionId),
  ]);
  return next;
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
    status: (row.status as Commission['status']) || 'open',
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
    const rows = (data || []).map(mapCommission);
    return rows.length ? rows : localCommissions().sort((a, b) => b.id - a.id);
  }, () => localCommissions().sort((a, b) => b.id - a.id));
}

export async function getCommissionById(id: number): Promise<Commission | null> {
  return withFallback(async () => {
    const { data, error } = await supabase
      .from('commissions')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) {
      return localCommissions().find((commission) => commission.id === id) ?? null;
    }
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
        status: data.status ?? 'open',
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
      status: data.status ?? 'open',
    };
    saveLocalCommissions([commission, ...commissions]);
    return commission;
  });
}

function toCommissionRow(updates: Partial<Commission>) {
  const row: Record<string, unknown> = {};
  if (updates.title !== undefined) row.title = updates.title;
  if (updates.description !== undefined) row.description = updates.description;
  if (updates.category !== undefined) row.category = updates.category;
  if (updates.priceRange !== undefined) row.price_range = updates.priceRange;
  if (updates.deadline !== undefined) row.deadline = updates.deadline;
  if (updates.purpose !== undefined) row.purpose = updates.purpose;
  if (updates.format !== undefined) row.format = updates.format;
  if (updates.status !== undefined) row.status = updates.status;
  return row;
}

export async function updateCommission(
  commissionId: number,
  updates: Partial<Pick<Commission, 'title' | 'description' | 'category' | 'priceRange' | 'deadline' | 'purpose' | 'format' | 'status'>>,
): Promise<Commission> {
  return withFallback(async () => {
    const { data, error } = await supabase
      .from('commissions')
      .update(toCommissionRow(updates))
      .eq('id', commissionId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return mapCommission(data);
  }, () => {
    let updated: Commission | undefined;
    const commissions = localCommissions().map((commission) => {
      if (commission.id !== commissionId) return commission;
      updated = { ...commission, ...updates };
      return updated;
    });
    if (!updated) throw new Error('项目不存在');
    saveLocalCommissions(commissions);
    return updated;
  });
}

export function closeCommission(commissionId: number): Promise<Commission> {
  return updateCommission(commissionId, { status: 'closed' });
}

export async function deleteCommission(commissionId: number): Promise<void> {
  return withFallback(async () => {
    const { error } = await supabase
      .from('commissions')
      .delete()
      .eq('id', commissionId);
    if (error) throw new Error(error.message);
  }, () => {
    saveLocalCommissions(localCommissions().filter((commission) => commission.id !== commissionId));
    saveLocalApplications(localApplications().filter((application) => application.commissionId !== commissionId));
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
    const rows = (data || []).map(mapApplication);
    return rows.length ? rows : localApplications().filter((application) => application.aigcerId === aigcerId);
  }, () => localApplications().filter((application) => application.aigcerId === aigcerId));
}

export async function getApplicationsByCommission(commissionId: number): Promise<Application[]> {
  return withFallback(async () => {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('commission_id', commissionId);
    if (error) throw new Error(error.message);
    const rows = (data || []).map(mapApplication);
    return rows.length ? rows : localApplications().filter((application) => application.commissionId === commissionId);
  }, () => localApplications().filter((application) => application.commissionId === commissionId));
}

export async function getApplicationsByAuthor(authorId: string): Promise<Application[]> {
  return withFallback(async () => {
    const { data: commissions, error: commissionError } = await supabase
      .from('commissions')
      .select('id')
      .eq('author_id', authorId);
    if (commissionError) throw new Error(commissionError.message);

    const ids = (commissions || []).map((commission) => commission.id as number);
    if (ids.length === 0) return [];

    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .in('commission_id', ids);
    if (error) throw new Error(error.message);
    const rows = (data || []).map(mapApplication);
    if (rows.length) return rows;
    const localIds = new Set(localCommissions().filter((commission) => commission.authorId === authorId).map((commission) => commission.id));
    return localApplications().filter((application) => localIds.has(application.commissionId));
  }, () => {
    const ids = new Set(localCommissions().filter((commission) => commission.authorId === authorId).map((commission) => commission.id));
    return localApplications().filter((application) => ids.has(application.commissionId));
  });
}

export async function updateApplicationStatus(
  commissionId: number,
  applicationId: string,
  status: Application['status'],
): Promise<Application> {
  return withFallback(async () => {
    if (status === 'accepted') {
      await supabase
        .from('applications')
        .update({ status: 'rejected' })
        .eq('commission_id', commissionId)
        .eq('status', 'pending')
        .neq('id', applicationId);
    }

    const { data, error } = await supabase
      .from('applications')
      .update({ status })
      .eq('id', applicationId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return mapApplication(data);
  }, () => {
    let updated: Application | undefined;
    const applications = localApplications().map((application) => {
      if (application.commissionId !== commissionId) return application;
      if (application.id === applicationId) {
        updated = { ...application, status };
        return updated;
      }
      if (status === 'accepted' && application.status === 'pending') {
        return { ...application, status: 'rejected' as const };
      }
      return application;
    });

    if (!updated) throw new Error('应征记录不存在');
    saveLocalApplications(applications);
    return updated;
  });
}

export async function updateApplicationDraft(
  applicationId: string,
  updates: Pick<Application, 'message' | 'expectedPrice'>,
): Promise<Application> {
  return withFallback(async () => {
    const { data, error } = await supabase
      .from('applications')
      .update({
        message: updates.message,
        expected_price: updates.expectedPrice,
      })
      .eq('id', applicationId)
      .eq('status', 'pending')
      .select()
      .single();
    if (error) throw new Error(error.message);
    return mapApplication(data);
  }, () => {
    let updated: Application | undefined;
    const applications = localApplications().map((application) => {
      if (application.id !== applicationId) return application;
      if (application.status !== 'pending') throw new Error('当前状态不可修改');
      updated = {
        ...application,
        message: updates.message,
        expectedPrice: updates.expectedPrice,
      };
      return updated;
    });
    if (!updated) throw new Error('应征记录不存在');
    saveLocalApplications(applications);
    return updated;
  });
}

export function withdrawApplication(applicationId: string): Promise<Application> {
  return withFallback(async () => {
    const { data, error } = await supabase
      .from('applications')
      .update({ status: 'withdrawn' })
      .eq('id', applicationId)
      .eq('status', 'pending')
      .select()
      .single();
    if (error) throw new Error(error.message);
    return mapApplication(data);
  }, () => {
    let updated: Application | undefined;
    const applications = localApplications().map((application) => {
      if (application.id !== applicationId) return application;
      if (application.status !== 'pending') throw new Error('当前状态不可撤回');
      updated = { ...application, status: 'withdrawn' as const };
      return updated;
    });
    if (!updated) throw new Error('应征记录不存在');
    saveLocalApplications(applications);
    return updated;
  });
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
        profiles:aigcer_id (aigcer_bio, aigcer_styles, aigcer_tools)
      `)
      .eq('commission_id', commissionId);
    if (error) throw new Error(error.message);

    const rows = (data || []).map((row) => {
      const profile = row.profiles as { aigcer_bio: string; aigcer_styles: string[]; aigcer_tools: string[] } | null;
      return {
        ...mapApplication(row),
        bio: profile?.aigcer_bio || '',
        styles: profile?.aigcer_styles || [],
        tools: profile?.aigcer_tools || [],
      };
    });
    if (rows.length) return rows;
    return localApplications()
      .filter((application) => application.commissionId === commissionId)
      .map((application) => {
        const profile = demoUsers.find((user) => user.id === application.aigcerId)?.aigcerProfile;
        return {
          ...application,
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
