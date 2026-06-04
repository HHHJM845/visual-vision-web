import { projectStages } from '@/services/commissionService';
import { EscrowBundle, EscrowMilestone, EscrowPlan, EscrowRelease } from '@/types/escrow';

const PLANS_KEY = 'visionai.escrowPlans';
const MILESTONES_KEY = 'visionai.escrowMilestones';
const RELEASES_KEY = 'visionai.escrowReleases';

export interface CreateEscrowDraftInput {
  commissionId: number;
  totalAmount: number;
  createdById: string;
}

export interface MilestonePercentUpdate {
  milestoneId: string;
  percent: number;
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

function bundleForPlan(plan: EscrowPlan): EscrowBundle {
  return {
    plan,
    milestones: localMilestones().filter((item) => item.planId === plan.id),
    releases: localReleases().filter((item) => item.planId === plan.id),
  };
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

export async function createEscrowDraft(input: CreateEscrowDraftInput): Promise<EscrowBundle> {
  const existing = localPlans().find((plan) => plan.commissionId === input.commissionId);
  if (existing) {
    return bundleForPlan(existing);
  }

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

  saveLocalPlans([plan, ...localPlans()]);
  saveLocalMilestones([...milestones, ...localMilestones()]);

  return { plan, milestones, releases: [] };
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

  return bundleForPlan(plan);
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

  return bundleForPlan(funded);
}
