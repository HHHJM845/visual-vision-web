// src/services/commissionService.ts
import { supabase } from '@/lib/supabase';
import { Commission, Application, DeliverySubmission, ProjectDispute } from '@/types/commission';
import { demoApplications, demoCommissions, demoUsers } from '@/data/mockData';

const COMMISSIONS_KEY = 'visionai.commissions';
const APPLICATIONS_KEY = 'visionai.applications';
const PROJECT_PROGRESS_KEY = 'visionai.projectProgress';
const PROJECT_DELIVERIES_KEY = 'visionai.projectDeliveries';
const PROJECT_DISPUTES_KEY = 'visionai.projectDisputes';
const isSupabaseConfigured = !String(import.meta.env.VITE_SUPABASE_URL || '').includes('placeholder');

export const projectStages = [
  { id: 'script', label: '脚本提报及反馈和确认', percent: 8, ownerAction: '确认脚本', aigcerAction: '提交脚本' },
  { id: 'style', label: '风格提报及确认', percent: 16, ownerAction: '确认风格', aigcerAction: '提交风格方案' },
  { id: 'setup', label: '前期人设场景提报及确认', percent: 24, ownerAction: '确认人设场景', aigcerAction: '提交人设场景' },
  { id: 'storyboard', label: '分镜提报及确认', percent: 32, ownerAction: '确认分镜', aigcerAction: '提交分镜' },
  { id: 'generation', label: '视频生成及剪辑', percent: 44, ownerAction: '确认生成剪辑', aigcerAction: '提交生成剪辑版' },
  { id: 'acopy', label: 'A copy', percent: 56, ownerAction: '确认 A copy', aigcerAction: '提交 A copy' },
  { id: 'acoRevision', label: 'Aco反馈及修改', percent: 68, ownerAction: '确认 Aco 修改', aigcerAction: '提交 Aco 修改版' },
  { id: 'bcopy', label: 'B copy', percent: 78, ownerAction: '确认 B copy', aigcerAction: '提交 B copy' },
  { id: 'bcoConfirm', label: 'Bco反馈及确认', percent: 88, ownerAction: '确认 Bco', aigcerAction: '提交 Bco 确认版' },
  { id: 'finalDelivery', label: '成片交付', percent: 96, ownerAction: '确认成片', aigcerAction: '提交成片' },
  { id: 'online', label: '上线', percent: 100, ownerAction: '确认上线', aigcerAction: '提交上线资料' },
] as const;

export type ProjectStageId = typeof projectStages[number]['id'];
export type ProjectStageStatus = 'waiting_aigcer' | 'waiting_owner' | 'completed';

export interface ProjectProgress {
  commissionId: number;
  currentStage: ProjectStageId;
  stageStatus: ProjectStageStatus;
  activeDeliveryId?: string;
  revisionCount?: number;
  submittedAt?: string;
  confirmedAt?: string;
  updatedAt: string;
}

export interface StageSubmissionInput {
  title: string;
  description: string;
  file?: File | null;
  submittedById: string;
  submittedByName: string;
}

export interface StageChangeRequestInput {
  feedback: string;
  requestedById: string;
}

export interface ProjectDisputeInput {
  commissionId: number;
  commissionTitle: string;
  stageId?: string;
  stageLabel?: string;
  applicantId?: string;
  applicantName?: string;
  reporterId: string;
  reporterName: string;
  reason: string;
  expectation: string;
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

function localDeliveries(): DeliverySubmission[] {
  return readStored<DeliverySubmission[]>(PROJECT_DELIVERIES_KEY, []);
}

function saveLocalDeliveries(deliveries: DeliverySubmission[]) {
  writeStored(PROJECT_DELIVERIES_KEY, deliveries);
}

function localDisputes(): ProjectDispute[] {
  return readStored<ProjectDispute[]>(PROJECT_DISPUTES_KEY, []);
}

function saveLocalDisputes(disputes: ProjectDispute[]) {
  writeStored(PROJECT_DISPUTES_KEY, disputes);
}

export function getProjectProgress(commissionId: number): ProjectProgress {
  const existing = localProgressRecords().find((item) => item.commissionId === commissionId);
  return existing ? {
    ...existing,
    stageStatus: existing.stageStatus ?? 'waiting_aigcer',
    revisionCount: existing.revisionCount ?? 0,
  } : {
    commissionId,
    currentStage: 'script',
    stageStatus: 'waiting_aigcer',
    revisionCount: 0,
    updatedAt: new Date().toISOString(),
  };
}

function saveProjectProgress(next: ProjectProgress): ProjectProgress {
  const records = localProgressRecords();
  saveLocalProgress([
    next,
    ...records.filter((item) => item.commissionId !== next.commissionId),
  ]);
  return next;
}

function mapProjectProgress(row: Record<string, unknown>): ProjectProgress {
  return {
    commissionId: Number(row.commission_id),
    currentStage: row.current_stage as ProjectStageId,
    stageStatus: row.stage_status as ProjectStageStatus,
    activeDeliveryId: row.active_delivery_id as string | undefined,
    revisionCount: Number(row.revision_count ?? 0),
    submittedAt: row.submitted_at as string | undefined,
    confirmedAt: row.confirmed_at as string | undefined,
    updatedAt: (row.updated_at as string) || new Date().toISOString(),
  };
}

function mapDelivery(row: Record<string, unknown>): DeliverySubmission {
  return {
    id: row.id as string,
    commissionId: Number(row.commission_id),
    stageId: row.stage_id as string,
    stageLabel: row.stage_label as string,
    version: Number(row.version ?? 1),
    title: row.title as string,
    description: row.description as string,
    fileName: row.file_name as string | undefined,
    fileUrl: row.file_url as string | undefined,
    submittedById: row.submitted_by_id as string,
    submittedByName: row.submitted_by_name as string,
    status: row.status as DeliverySubmission['status'],
    feedback: row.feedback as string | undefined,
    confirmedById: row.confirmed_by_id as string | undefined,
    confirmedAt: row.confirmed_at as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapDispute(row: Record<string, unknown>): ProjectDispute {
  return {
    id: row.id as string,
    commissionId: Number(row.commission_id),
    commissionTitle: row.commission_title as string,
    stageId: row.stage_id as string | undefined,
    stageLabel: row.stage_label as string | undefined,
    applicantId: row.applicant_id as string | undefined,
    applicantName: row.applicant_name as string | undefined,
    reporterId: row.reporter_id as string,
    reporterName: row.reporter_name as string,
    reason: row.reason as string,
    expectation: row.expectation as string,
    status: row.status as ProjectDispute['status'],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

async function saveProgressRemote(next: ProjectProgress): Promise<ProjectProgress> {
  return withFallback(async () => {
    const { data, error } = await supabase
      .from('project_progress')
      .upsert({
        commission_id: next.commissionId,
        current_stage: next.currentStage,
        stage_status: next.stageStatus,
        active_delivery_id: next.activeDeliveryId ?? null,
        revision_count: next.revisionCount ?? 0,
        submitted_at: next.submittedAt ?? null,
        confirmed_at: next.confirmedAt ?? null,
        updated_at: next.updatedAt,
      }, { onConflict: 'commission_id' })
      .select()
      .single();
    if (error) throw new Error(error.message);
    const mapped = mapProjectProgress(data);
    saveProjectProgress(mapped);
    return mapped;
  }, () => saveProjectProgress(next));
}

async function uploadDeliveryFile(commissionId: number, stageId: string, file?: File | null) {
  if (!file) return { fileName: undefined, fileUrl: undefined };
  if (!isSupabaseConfigured) {
    return { fileName: file.name, fileUrl: URL.createObjectURL(file) };
  }
  const safeName = file.name.replace(/[^\w.\-\u4e00-\u9fa5]/g, '_');
  const path = `${commissionId}/${stageId}/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage.from('project-deliverables').upload(path, file, { upsert: true });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from('project-deliverables').getPublicUrl(path);
  return { fileName: file.name, fileUrl: data.publicUrl };
}

export function submitProjectStage(commissionId: number): ProjectProgress {
  const current = getProjectProgress(commissionId);
  if (current.stageStatus !== 'waiting_aigcer') return current;
  return saveProjectProgress({
    ...current,
    stageStatus: 'waiting_owner',
    submittedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export function confirmProjectStage(commissionId: number): ProjectProgress {
  const current = getProjectProgress(commissionId);
  if (current.stageStatus !== 'waiting_owner') return current;
  const index = projectStages.findIndex((stage) => stage.id === current.currentStage);
  const isLastStage = index >= projectStages.length - 1;
  return saveProjectProgress({
    commissionId,
    currentStage: isLastStage ? current.currentStage : projectStages[index + 1].id,
    stageStatus: isLastStage ? 'completed' : 'waiting_aigcer',
    confirmedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export async function getProjectDeliveries(commissionId: number): Promise<DeliverySubmission[]> {
  return withFallback(async () => {
    const { data, error } = await supabase
      .from('project_deliverables')
      .select('*')
      .eq('commission_id', commissionId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    const rows = (data || []).map(mapDelivery);
    return rows.length ? rows : localDeliveries().filter((item) => item.commissionId === commissionId);
  }, () => localDeliveries().filter((item) => item.commissionId === commissionId));
}

export async function submitProjectStageDelivery(
  commissionId: number,
  input: StageSubmissionInput,
): Promise<{ progress: ProjectProgress; delivery: DeliverySubmission }> {
  const current = getProjectProgress(commissionId);
  if (current.stageStatus !== 'waiting_aigcer') {
    throw new Error('当前节点暂不能提交交付物');
  }
  const stage = projectStages.find((item) => item.id === current.currentStage) ?? projectStages[0];
  const existing = localDeliveries().filter((item) => item.commissionId === commissionId && item.stageId === stage.id);
  const version = existing.length + 1;
  const fileInfo = await uploadDeliveryFile(commissionId, stage.id, input.file);
  const now = new Date().toISOString();

  return withFallback(async () => {
    const { data, error } = await supabase
      .from('project_deliverables')
      .insert({
        commission_id: commissionId,
        stage_id: stage.id,
        stage_label: stage.label,
        version,
        title: input.title,
        description: input.description,
        file_name: fileInfo.fileName ?? null,
        file_url: fileInfo.fileUrl ?? null,
        submitted_by_id: input.submittedById,
        submitted_by_name: input.submittedByName,
        status: 'submitted',
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    const delivery = mapDelivery(data);
    saveLocalDeliveries([delivery, ...localDeliveries().filter((item) => item.id !== delivery.id)]);
    const progress = await saveProgressRemote({
      ...current,
      stageStatus: 'waiting_owner',
      activeDeliveryId: delivery.id,
      submittedAt: now,
      updatedAt: now,
    });
    return { progress, delivery };
  }, () => {
    const delivery: DeliverySubmission = {
      id: `delivery-${Date.now()}`,
      commissionId,
      stageId: stage.id,
      stageLabel: stage.label,
      version,
      title: input.title,
      description: input.description,
      ...fileInfo,
      submittedById: input.submittedById,
      submittedByName: input.submittedByName,
      status: 'submitted',
      createdAt: now,
      updatedAt: now,
    };
    saveLocalDeliveries([delivery, ...localDeliveries()]);
    const progress = saveProjectProgress({
      ...current,
      stageStatus: 'waiting_owner',
      activeDeliveryId: delivery.id,
      submittedAt: now,
      updatedAt: now,
    });
    return { progress, delivery };
  });
}

export async function requestProjectStageChanges(
  commissionId: number,
  input: StageChangeRequestInput,
): Promise<ProjectProgress> {
  const current = getProjectProgress(commissionId);
  if (current.stageStatus !== 'waiting_owner' || !current.activeDeliveryId) {
    throw new Error('当前节点没有待反馈的交付物');
  }
  const now = new Date().toISOString();

  return withFallback(async () => {
    const { error } = await supabase
      .from('project_deliverables')
      .update({
        status: 'changes_requested',
        feedback: input.feedback,
        updated_at: now,
      })
      .eq('id', current.activeDeliveryId);
    if (error) throw new Error(error.message);
    const progress = await saveProgressRemote({
      ...current,
      stageStatus: 'waiting_aigcer',
      revisionCount: (current.revisionCount ?? 0) + 1,
      updatedAt: now,
    });
    return progress;
  }, () => {
    saveLocalDeliveries(localDeliveries().map((item) => (
      item.id === current.activeDeliveryId
        ? { ...item, status: 'changes_requested', feedback: input.feedback, updatedAt: now }
        : item
    )));
    return saveProjectProgress({
      ...current,
      stageStatus: 'waiting_aigcer',
      revisionCount: (current.revisionCount ?? 0) + 1,
      updatedAt: now,
    });
  });
}

export async function confirmProjectStageDelivery(
  commissionId: number,
  confirmedById: string,
): Promise<ProjectProgress> {
  const current = getProjectProgress(commissionId);
  if (current.stageStatus !== 'waiting_owner') return current;
  const index = projectStages.findIndex((stage) => stage.id === current.currentStage);
  const isLastStage = index >= projectStages.length - 1;
  const now = new Date().toISOString();

  return withFallback(async () => {
    if (current.activeDeliveryId) {
      const { error } = await supabase
        .from('project_deliverables')
        .update({
          status: 'confirmed',
          confirmed_by_id: confirmedById,
          confirmed_at: now,
          updated_at: now,
        })
        .eq('id', current.activeDeliveryId);
      if (error) throw new Error(error.message);
    }
    return saveProgressRemote({
      commissionId,
      currentStage: isLastStage ? current.currentStage : projectStages[index + 1].id,
      stageStatus: isLastStage ? 'completed' : 'waiting_aigcer',
      activeDeliveryId: undefined,
      revisionCount: 0,
      confirmedAt: now,
      updatedAt: now,
    });
  }, () => {
    if (current.activeDeliveryId) {
      saveLocalDeliveries(localDeliveries().map((item) => (
        item.id === current.activeDeliveryId
          ? { ...item, status: 'confirmed', confirmedById, confirmedAt: now, updatedAt: now }
          : item
      )));
    }
    return saveProjectProgress({
      commissionId,
      currentStage: isLastStage ? current.currentStage : projectStages[index + 1].id,
      stageStatus: isLastStage ? 'completed' : 'waiting_aigcer',
      activeDeliveryId: undefined,
      revisionCount: 0,
      confirmedAt: now,
      updatedAt: now,
    });
  });
}

export async function createProjectDispute(input: ProjectDisputeInput): Promise<ProjectDispute> {
  const now = new Date().toISOString();
  return withFallback(async () => {
    const { data, error } = await supabase
      .from('project_disputes')
      .insert({
        commission_id: input.commissionId,
        commission_title: input.commissionTitle,
        stage_id: input.stageId ?? null,
        stage_label: input.stageLabel ?? null,
        applicant_id: input.applicantId ?? null,
        applicant_name: input.applicantName ?? null,
        reporter_id: input.reporterId,
        reporter_name: input.reporterName,
        reason: input.reason,
        expectation: input.expectation,
        status: 'pending',
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    const dispute = mapDispute(data);
    saveLocalDisputes([dispute, ...localDisputes().filter((item) => item.id !== dispute.id)]);
    return dispute;
  }, () => {
    const dispute: ProjectDispute = {
      id: `dispute-${Date.now()}`,
      ...input,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };
    saveLocalDisputes([dispute, ...localDisputes()]);
    return dispute;
  });
}

export async function getProjectDisputes(commissionId: number): Promise<ProjectDispute[]> {
  return withFallback(async () => {
    const { data, error } = await supabase
      .from('project_disputes')
      .select('*')
      .eq('commission_id', commissionId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    const rows = (data || []).map(mapDispute);
    return rows.length ? rows : localDisputes().filter((item) => item.commissionId === commissionId);
  }, () => localDisputes().filter((item) => item.commissionId === commissionId));
}

export function advanceProjectProgress(commissionId: number): ProjectProgress {
  const current = getProjectProgress(commissionId);
  const index = projectStages.findIndex((stage) => stage.id === current.currentStage);
  const nextStage = projectStages[Math.min(index + 1, projectStages.length - 1)].id;
  const next: ProjectProgress = {
    commissionId,
    currentStage: nextStage,
    stageStatus: nextStage === current.currentStage ? 'completed' : 'waiting_aigcer',
    updatedAt: new Date().toISOString(),
  };
  return saveProjectProgress(next);
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
