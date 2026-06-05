import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { projectStages } from '@/services/commissionService';
import { EscrowBundle, EscrowMilestone, EscrowPlan, EscrowRelease } from '@/types/escrow';

const PLANS_KEY = 'visionai.escrowPlans';
const MILESTONES_KEY = 'visionai.escrowMilestones';
const RELEASES_KEY = 'visionai.escrowReleases';

type DbRow = Record<string, unknown>;

export interface CreateEscrowDraftInput {
  commissionId: number;
  totalAmount: number;
  createdById: string;
}

export interface MilestonePercentUpdate {
  milestoneId: string;
  percent: number;
}

export interface ReleaseEscrowMilestoneInput {
  commissionId: number;
  stageId: string;
  releasedById: string;
  releasedToId: string;
}

export interface FreezeEscrowMilestoneInput {
  commissionId: number;
  stageId: string;
  frozenById: string;
}

export interface RefundEscrowMilestoneInput {
  commissionId: number;
  stageId: string;
  refundedById: string;
  refundToId: string;
  note?: string;
}

export interface PartiallyReleaseEscrowMilestoneInput {
  commissionId: number;
  stageId: string;
  releasedById: string;
  releasedToId: string;
  refundToId: string;
  releaseAmount: number;
  note?: string;
}

export function getDefaultEscrowAmount(priceRange?: string): number {
  const text = (priceRange ?? '').replace(/,/g, '');
  const matches = Array.from(text.matchAll(/(\d+(?:\.\d+)?)\s*(万|w|k)?/gi));
  if (!matches.length) return 0;

  return Math.max(...matches.map((match) => {
    const value = Number(match[1]);
    const unit = match[2]?.toLowerCase();
    if (unit === '万' || unit === 'w') return value * 10000;
    if (unit === 'k') return value * 1000;
    return value;
  }));
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

function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function localPlans() {
  return readStored<EscrowPlan[]>(PLANS_KEY, []);
}

function saveLocalPlans(plans: EscrowPlan[]) {
  writeStored(PLANS_KEY, plans);
}

function localMilestones() {
  return readStored<EscrowMilestone[]>(MILESTONES_KEY, []);
}

function saveLocalMilestones(milestones: EscrowMilestone[]) {
  writeStored(MILESTONES_KEY, milestones);
}

function localReleases() {
  return readStored<EscrowRelease[]>(RELEASES_KEY, []);
}

function saveLocalReleases(releases: EscrowRelease[]) {
  writeStored(RELEASES_KEY, releases);
}

async function withFallback<T>(remote: () => Promise<T>, fallback: () => T | Promise<T>): Promise<T> {
  if (!isSupabaseConfigured) return fallback();
  try {
    return await remote();
  } catch {
    return fallback();
  }
}

function bundleForPlanLocal(plan: EscrowPlan): EscrowBundle {
  return {
    plan,
    milestones: localMilestones().filter((item) => item.planId === plan.id),
    releases: localReleases().filter((item) => item.planId === plan.id),
  };
}

function saveBundleLocally(bundle: EscrowBundle) {
  saveLocalPlans([bundle.plan, ...localPlans().filter((item) => item.id !== bundle.plan.id)]);
  saveLocalMilestones([
    ...bundle.milestones,
    ...localMilestones().filter((item) => item.planId !== bundle.plan.id),
  ]);
  saveLocalReleases([
    ...bundle.releases,
    ...localReleases().filter((item) => item.planId !== bundle.plan.id),
  ]);
}

function assertPercentTotal(milestones: EscrowMilestone[]) {
  const total = Number(milestones.reduce((sum, item) => sum + item.percent, 0).toFixed(2));
  if (total !== 100) throw new Error('付款比例合计必须等于 100%');
}

function recalculateMilestoneAmounts(plan: EscrowPlan, milestones: EscrowMilestone[]) {
  let usedAmount = 0;
  return milestones.map((item, index) => {
    const isLast = index === milestones.length - 1;
    const amount = isLast
      ? Number((plan.totalAmount - usedAmount).toFixed(2))
      : Number(((plan.totalAmount * item.percent) / 100).toFixed(2));
    usedAmount = Number((usedAmount + amount).toFixed(2));
    return { ...item, amount };
  });
}

function buildMilestones(plan: EscrowPlan): EscrowMilestone[] {
  const base = Math.floor(100 / projectStages.length);
  let usedPercent = 0;
  let usedAmount = 0;

  return projectStages.map((stage, index) => {
    const isLast = index === projectStages.length - 1;
    const percent = isLast ? Number((100 - usedPercent).toFixed(2)) : base;
    const amount = isLast
      ? Number((plan.totalAmount - usedAmount).toFixed(2))
      : Number(((plan.totalAmount * percent) / 100).toFixed(2));

    usedPercent = Number((usedPercent + percent).toFixed(2));
    usedAmount = Number((usedAmount + amount).toFixed(2));

    return {
      id: generateId('escrow-milestone'),
      planId: plan.id,
      commissionId: plan.commissionId,
      stageId: stage.id,
      stageLabel: stage.label,
      percent,
      amount,
      status: 'pending',
    };
  });
}

function mapPlan(row: DbRow): EscrowPlan {
  return {
    id: row.id as string,
    commissionId: Number(row.commission_id),
    totalAmount: Number(row.total_amount),
    currency: 'CNY',
    status: row.status as EscrowPlan['status'],
    releasedAmount: Number(row.released_amount ?? 0),
    createdById: row.created_by_id as string,
    fundedAt: row.funded_at as string | undefined,
    completedAt: row.completed_at as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapMilestone(row: DbRow): EscrowMilestone {
  return {
    id: row.id as string,
    planId: row.plan_id as string,
    commissionId: Number(row.commission_id),
    stageId: row.stage_id as string,
    stageLabel: row.stage_label as string,
    percent: Number(row.percent),
    amount: Number(row.amount),
    status: row.status as EscrowMilestone['status'],
    releasedAt: row.released_at as string | undefined,
  };
}

function mapRelease(row: DbRow): EscrowRelease {
  return {
    id: row.id as string,
    planId: row.plan_id as string,
    commissionId: Number(row.commission_id),
    milestoneId: row.milestone_id as string,
    stageId: row.stage_id as string,
    stageLabel: row.stage_label as string,
    amount: Number(row.amount),
    releasedById: row.released_by_id as string,
    releasedToId: row.released_to_id as string,
    releaseType: (row.release_type as EscrowRelease['releaseType']) || 'release',
    note: row.note as string | undefined,
    createdAt: row.created_at as string,
  };
}

function planToRow(plan: EscrowPlan) {
  return {
    id: plan.id,
    commission_id: plan.commissionId,
    total_amount: plan.totalAmount,
    currency: plan.currency,
    status: plan.status,
    released_amount: plan.releasedAmount,
    created_by_id: plan.createdById,
    funded_at: plan.fundedAt ?? null,
    completed_at: plan.completedAt ?? null,
    created_at: plan.createdAt,
    updated_at: plan.updatedAt,
  };
}

function milestoneToRow(milestone: EscrowMilestone) {
  return {
    id: milestone.id,
    plan_id: milestone.planId,
    commission_id: milestone.commissionId,
    stage_id: milestone.stageId,
    stage_label: milestone.stageLabel,
    percent: milestone.percent,
    amount: milestone.amount,
    status: milestone.status,
    released_at: milestone.releasedAt ?? null,
  };
}

function releaseToRow(release: EscrowRelease) {
  return {
    id: release.id,
    plan_id: release.planId,
    commission_id: release.commissionId,
    milestone_id: release.milestoneId,
    stage_id: release.stageId,
    stage_label: release.stageLabel,
    amount: release.amount,
    released_by_id: release.releasedById,
    released_to_id: release.releasedToId,
    release_type: release.releaseType,
    note: release.note ?? null,
    created_at: release.createdAt,
  };
}

function isFinalMilestoneStatus(status: EscrowMilestone['status']) {
  return status === 'released' || status === 'refunded' || status === 'partially_released';
}

function creatorReleasedAmount(releases: EscrowRelease[], planId: string) {
  return Number(releases
    .filter((item) => item.planId === planId && item.releaseType !== 'refund')
    .reduce((sum, item) => sum + item.amount, 0)
    .toFixed(2));
}

function nextPlanStatusForMilestones(plan: EscrowPlan, milestones: EscrowMilestone[]) {
  if (milestones.some((item) => item.status === 'frozen')) return 'frozen';
  if (milestones.length > 0 && milestones.every((item) => isFinalMilestoneStatus(item.status))) return 'completed';
  return plan.status === 'draft' ? 'draft' : 'funded';
}

function createLocalEscrowDraft(input: CreateEscrowDraftInput): EscrowBundle {
  const existing = localPlans().find((plan) => plan.commissionId === input.commissionId);
  if (existing) return bundleForPlanLocal(existing);

  const now = new Date().toISOString();
  const plan: EscrowPlan = {
    id: generateId('escrow-plan'),
    commissionId: input.commissionId,
    totalAmount: input.totalAmount,
    currency: 'CNY',
    status: 'draft',
    releasedAmount: 0,
    createdById: input.createdById,
    createdAt: now,
    updatedAt: now,
  };
  const milestones = buildMilestones(plan);
  const bundle = { plan, milestones, releases: [] };

  saveBundleLocally(bundle);
  return bundle;
}

async function getRemoteBundleByCommission(commissionId: number): Promise<EscrowBundle | null> {
  const { data: planRow, error: planError } = await supabase
    .from('escrow_plans')
    .select('*')
    .eq('commission_id', commissionId)
    .maybeSingle();
  if (planError) throw new Error(planError.message);
  if (!planRow) return null;

  const plan = mapPlan(planRow as DbRow);
  const { data: milestoneRows, error: milestoneError } = await supabase
    .from('escrow_milestones')
    .select('*')
    .eq('plan_id', plan.id)
    .order('stage_id', { ascending: true });
  if (milestoneError) throw new Error(milestoneError.message);

  const { data: releaseRows, error: releaseError } = await supabase
    .from('escrow_releases')
    .select('*')
    .eq('plan_id', plan.id)
    .order('created_at', { ascending: false });
  if (releaseError) throw new Error(releaseError.message);

  const bundle = {
    plan,
    milestones: ((milestoneRows || []) as DbRow[]).map(mapMilestone),
    releases: ((releaseRows || []) as DbRow[]).map(mapRelease),
  };
  saveBundleLocally(bundle);
  return bundle;
}

async function insertRemoteDraft(bundle: EscrowBundle): Promise<EscrowBundle> {
  const { data: planRow, error: planError } = await supabase
    .from('escrow_plans')
    .insert(planToRow(bundle.plan))
    .select()
    .single();
  if (planError) throw new Error(planError.message);

  const { error: milestoneError } = await supabase
    .from('escrow_milestones')
    .insert(bundle.milestones.map(milestoneToRow));
  if (milestoneError) throw new Error(milestoneError.message);

  const remoteBundle = {
    ...bundle,
    plan: mapPlan(planRow as DbRow),
  };
  saveBundleLocally(remoteBundle);
  return remoteBundle;
}

async function updateRemoteMilestones(plan: EscrowPlan, milestones: EscrowMilestone[]) {
  for (const milestone of milestones) {
    const { error } = await supabase
      .from('escrow_milestones')
      .update(milestoneToRow(milestone))
      .eq('id', milestone.id);
    if (error) throw new Error(error.message);
  }
  return bundleForPlanLocal(plan);
}

async function updateRemotePlan(plan: EscrowPlan) {
  const { data, error } = await supabase
    .from('escrow_plans')
    .update(planToRow(plan))
    .eq('id', plan.id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  const updated = mapPlan(data as DbRow);
  saveLocalPlans(localPlans().map((item) => (item.id === updated.id ? updated : item)));
  return bundleForPlanLocal(updated);
}

async function insertRemoteRelease(release: EscrowRelease) {
  const { error } = await supabase
    .from('escrow_releases')
    .insert(releaseToRow(release));
  if (error) throw new Error(error.message);
}

export async function createEscrowDraft(input: CreateEscrowDraftInput): Promise<EscrowBundle> {
  return withFallback(async () => {
    const existing = await getRemoteBundleByCommission(input.commissionId);
    if (existing) return existing;
    return insertRemoteDraft(createLocalEscrowDraft(input));
  }, () => createLocalEscrowDraft(input));
}

export async function updateEscrowMilestones(
  planId: string,
  updates: MilestonePercentUpdate[],
): Promise<EscrowBundle> {
  const plan = localPlans().find((item) => item.id === planId);
  if (!plan) throw new Error('托管计划不存在');
  if (plan.status !== 'draft') throw new Error('已托管计划不能修改付款比例');

  const updateMap = new Map(updates.map((item) => [item.milestoneId, item.percent]));
  const milestonesForPlan = localMilestones().filter((item) => item.planId === planId);
  const updatedForPlan = recalculateMilestoneAmounts(
    plan,
    milestonesForPlan.map((item) => ({
      ...item,
      percent: updateMap.has(item.id) ? updateMap.get(item.id)! : item.percent,
    })),
  );

  saveLocalMilestones([
    ...updatedForPlan,
    ...localMilestones().filter((item) => item.planId !== planId),
  ]);

  return withFallback(
    () => updateRemoteMilestones(plan, updatedForPlan),
    () => bundleForPlanLocal(plan),
  );
}

export async function fundEscrowPlan(planId: string): Promise<EscrowBundle> {
  const plan = localPlans().find((item) => item.id === planId);
  if (!plan) throw new Error('托管计划不存在');
  if (plan.totalAmount <= 0) throw new Error('托管金额必须大于 0');

  const milestones = localMilestones().filter((item) => item.planId === planId);
  assertPercentTotal(milestones);

  const now = new Date().toISOString();
  const funded: EscrowPlan = { ...plan, status: 'funded', fundedAt: now, updatedAt: now };
  saveLocalPlans(localPlans().map((item) => (item.id === planId ? funded : item)));

  return withFallback(
    () => updateRemotePlan(funded),
    () => bundleForPlanLocal(funded),
  );
}

export async function getEscrowBundleByCommission(commissionId: number): Promise<EscrowBundle | null> {
  return withFallback(
    () => getRemoteBundleByCommission(commissionId),
    () => {
      const plan = localPlans().find((item) => item.commissionId === commissionId);
      return plan ? bundleForPlanLocal(plan) : null;
    },
  );
}

export async function releaseEscrowMilestone(input: ReleaseEscrowMilestoneInput): Promise<EscrowBundle> {
  const plan = localPlans().find((item) => item.commissionId === input.commissionId);
  if (!plan) throw new Error('托管计划不存在');
  if (plan.status === 'frozen') throw new Error('当前节点款项因纠纷已冻结');
  if (plan.status !== 'funded' && plan.status !== 'completed') throw new Error('托管计划尚未确认');

  const milestones = localMilestones().filter((item) => item.planId === plan.id);
  const milestone = milestones.find((item) => item.stageId === input.stageId);
  if (!milestone) throw new Error('托管节点不存在');
  if (milestone.status === 'released') return bundleForPlanLocal(plan);
  if (milestone.status === 'frozen') throw new Error('当前节点款项因纠纷已冻结');
  if (milestone.status === 'refunded') throw new Error('当前节点款项已退款');
  if (milestone.status === 'partially_released') throw new Error('当前节点款项已完成部分释放');

  const now = new Date().toISOString();
  const release: EscrowRelease = {
    id: generateId('escrow-release'),
    planId: plan.id,
    commissionId: plan.commissionId,
    milestoneId: milestone.id,
    stageId: milestone.stageId,
    stageLabel: milestone.stageLabel,
    amount: milestone.amount,
    releasedById: input.releasedById,
    releasedToId: input.releasedToId,
    releaseType: 'release',
    createdAt: now,
  };

  const updatedMilestones = localMilestones().map((item) => (
    item.id === milestone.id ? { ...item, status: 'released' as const, releasedAt: now } : item
  ));
  saveLocalMilestones(updatedMilestones);
  const updatedReleases = [release, ...localReleases()];

  const milestonesForPlan = updatedMilestones.filter((item) => item.planId === plan.id);
  const completed = milestonesForPlan.every((item) => isFinalMilestoneStatus(item.status));
  const updatedPlan: EscrowPlan = {
    ...plan,
    releasedAmount: creatorReleasedAmount(updatedReleases, plan.id),
    status: completed ? 'completed' : 'funded',
    completedAt: completed ? now : plan.completedAt,
    updatedAt: now,
  };

  saveLocalPlans(localPlans().map((item) => (item.id === plan.id ? updatedPlan : item)));
  saveLocalReleases(updatedReleases);

  return withFallback(async () => {
    await updateRemoteMilestones(updatedPlan, updatedMilestones.filter((item) => item.planId === plan.id));
    await updateRemotePlan(updatedPlan);
    await insertRemoteRelease(release);
    return bundleForPlanLocal(updatedPlan);
  }, () => bundleForPlanLocal(updatedPlan));
}

export async function freezeEscrowMilestone(input: FreezeEscrowMilestoneInput): Promise<EscrowBundle> {
  const plan = localPlans().find((item) => item.commissionId === input.commissionId);
  if (!plan) throw new Error('托管计划不存在');
  if (plan.status === 'draft') throw new Error('托管计划尚未确认');
  if (plan.status === 'completed') throw new Error('托管计划已全部释放');
  if (plan.status === 'cancelled') throw new Error('托管计划已取消');

  const milestones = localMilestones().filter((item) => item.planId === plan.id);
  const milestone = milestones.find((item) => item.stageId === input.stageId);
  if (!milestone) throw new Error('托管节点不存在');
  if (milestone.status === 'released' || milestone.status === 'refunded') return bundleForPlanLocal(plan);

  const now = new Date().toISOString();
  const updatedPlan: EscrowPlan = {
    ...plan,
    status: 'frozen',
    updatedAt: now,
  };
  const updatedMilestones = localMilestones().map((item) => (
    item.id === milestone.id ? { ...item, status: 'frozen' as const } : item
  ));

  saveLocalPlans(localPlans().map((item) => (item.id === plan.id ? updatedPlan : item)));
  saveLocalMilestones(updatedMilestones);

  return withFallback(async () => {
    await updateRemoteMilestones(updatedPlan, updatedMilestones.filter((item) => item.planId === plan.id));
    await updateRemotePlan(updatedPlan);
    return bundleForPlanLocal(updatedPlan);
  }, () => bundleForPlanLocal(updatedPlan));
}

export async function resumeFrozenEscrowMilestone(input: FreezeEscrowMilestoneInput): Promise<EscrowBundle> {
  const plan = localPlans().find((item) => item.commissionId === input.commissionId);
  if (!plan) throw new Error('托管计划不存在');

  const milestones = localMilestones().filter((item) => item.planId === plan.id);
  const milestone = milestones.find((item) => item.stageId === input.stageId);
  if (!milestone) throw new Error('托管节点不存在');
  if (milestone.status !== 'frozen') return bundleForPlanLocal(plan);

  const stillFrozen = milestones.some((item) => item.id !== milestone.id && item.status === 'frozen');
  const now = new Date().toISOString();
  const updatedPlan: EscrowPlan = {
    ...plan,
    status: stillFrozen ? 'frozen' : 'funded',
    updatedAt: now,
  };
  const updatedMilestones = localMilestones().map((item) => (
    item.id === milestone.id ? { ...item, status: 'pending' as const } : item
  ));

  saveLocalPlans(localPlans().map((item) => (item.id === plan.id ? updatedPlan : item)));
  saveLocalMilestones(updatedMilestones);

  return withFallback(async () => {
    await updateRemoteMilestones(updatedPlan, updatedMilestones.filter((item) => item.planId === plan.id));
    await updateRemotePlan(updatedPlan);
    return bundleForPlanLocal(updatedPlan);
  }, () => bundleForPlanLocal(updatedPlan));
}

export async function refundEscrowMilestone(input: RefundEscrowMilestoneInput): Promise<EscrowBundle> {
  const plan = localPlans().find((item) => item.commissionId === input.commissionId);
  if (!plan) throw new Error('托管计划不存在');
  if (plan.status === 'draft') throw new Error('托管计划尚未确认');
  if (plan.status === 'cancelled') throw new Error('托管计划已取消');

  const milestones = localMilestones().filter((item) => item.planId === plan.id);
  const milestone = milestones.find((item) => item.stageId === input.stageId);
  if (!milestone) throw new Error('托管节点不存在');
  if (isFinalMilestoneStatus(milestone.status)) return bundleForPlanLocal(plan);

  const now = new Date().toISOString();
  const refund: EscrowRelease = {
    id: generateId('escrow-refund'),
    planId: plan.id,
    commissionId: plan.commissionId,
    milestoneId: milestone.id,
    stageId: milestone.stageId,
    stageLabel: milestone.stageLabel,
    amount: milestone.amount,
    releasedById: input.refundedById,
    releasedToId: input.refundToId,
    releaseType: 'refund',
    note: input.note?.trim() || undefined,
    createdAt: now,
  };

  const updatedMilestones = localMilestones().map((item) => (
    item.id === milestone.id ? { ...item, status: 'refunded' as const, releasedAt: now } : item
  ));
  const updatedReleases = [refund, ...localReleases()];
  const milestonesForPlan = updatedMilestones.filter((item) => item.planId === plan.id);
  const completed = milestonesForPlan.every((item) => isFinalMilestoneStatus(item.status));
  const updatedPlan: EscrowPlan = {
    ...plan,
    releasedAmount: creatorReleasedAmount(updatedReleases, plan.id),
    status: completed ? 'completed' : nextPlanStatusForMilestones(plan, milestonesForPlan),
    completedAt: completed ? now : plan.completedAt,
    updatedAt: now,
  };

  saveLocalPlans(localPlans().map((item) => (item.id === plan.id ? updatedPlan : item)));
  saveLocalMilestones(updatedMilestones);
  saveLocalReleases(updatedReleases);

  return withFallback(async () => {
    await updateRemoteMilestones(updatedPlan, updatedMilestones.filter((item) => item.planId === plan.id));
    await updateRemotePlan(updatedPlan);
    await insertRemoteRelease(refund);
    return bundleForPlanLocal(updatedPlan);
  }, () => bundleForPlanLocal(updatedPlan));
}

export async function partiallyReleaseEscrowMilestone(input: PartiallyReleaseEscrowMilestoneInput): Promise<EscrowBundle> {
  const plan = localPlans().find((item) => item.commissionId === input.commissionId);
  if (!plan) throw new Error('托管计划不存在');
  if (plan.status === 'draft') throw new Error('托管计划尚未确认');
  if (plan.status === 'cancelled') throw new Error('托管计划已取消');

  const milestones = localMilestones().filter((item) => item.planId === plan.id);
  const milestone = milestones.find((item) => item.stageId === input.stageId);
  if (!milestone) throw new Error('托管节点不存在');
  if (isFinalMilestoneStatus(milestone.status)) return bundleForPlanLocal(plan);
  if (!Number.isFinite(input.releaseAmount) || input.releaseAmount <= 0) throw new Error('释放金额必须大于 0');
  if (input.releaseAmount >= milestone.amount) throw new Error('部分释放金额必须小于当前节点金额');

  const now = new Date().toISOString();
  const release: EscrowRelease = {
    id: generateId('escrow-partial-release'),
    planId: plan.id,
    commissionId: plan.commissionId,
    milestoneId: milestone.id,
    stageId: milestone.stageId,
    stageLabel: milestone.stageLabel,
    amount: Number(input.releaseAmount.toFixed(2)),
    releasedById: input.releasedById,
    releasedToId: input.releasedToId,
    releaseType: 'partial_release',
    note: input.note?.trim() || undefined,
    createdAt: now,
  };
  const refundAmount = Number((milestone.amount - release.amount).toFixed(2));
  const refund: EscrowRelease = {
    id: generateId('escrow-refund'),
    planId: plan.id,
    commissionId: plan.commissionId,
    milestoneId: milestone.id,
    stageId: milestone.stageId,
    stageLabel: milestone.stageLabel,
    amount: refundAmount,
    releasedById: input.releasedById,
    releasedToId: input.refundToId,
    releaseType: 'refund',
    note: input.note?.trim() ? `部分释放后退款：${input.note.trim()}` : '部分释放后的剩余退款',
    createdAt: now,
  };

  const updatedMilestones = localMilestones().map((item) => (
    item.id === milestone.id ? { ...item, status: 'partially_released' as const, releasedAt: now } : item
  ));
  const updatedReleases = [refund, release, ...localReleases()];
  const milestonesForPlan = updatedMilestones.filter((item) => item.planId === plan.id);
  const completed = milestonesForPlan.every((item) => isFinalMilestoneStatus(item.status));
  const updatedPlan: EscrowPlan = {
    ...plan,
    releasedAmount: creatorReleasedAmount(updatedReleases, plan.id),
    status: completed ? 'completed' : nextPlanStatusForMilestones(plan, milestonesForPlan),
    completedAt: completed ? now : plan.completedAt,
    updatedAt: now,
  };

  saveLocalPlans(localPlans().map((item) => (item.id === plan.id ? updatedPlan : item)));
  saveLocalMilestones(updatedMilestones);
  saveLocalReleases(updatedReleases);

  return withFallback(async () => {
    await updateRemoteMilestones(updatedPlan, updatedMilestones.filter((item) => item.planId === plan.id));
    await updateRemotePlan(updatedPlan);
    await insertRemoteRelease(release);
    await insertRemoteRelease(refund);
    return bundleForPlanLocal(updatedPlan);
  }, () => bundleForPlanLocal(updatedPlan));
}
