import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { ContractSignerRole, ContractStatus, ProjectContract } from '@/types/contract';

const CONTRACTS_KEY = 'visionai.projectContracts';

type DbRow = Record<string, unknown>;

export interface CreateContractDraftInput {
  commissionId: number;
  commissionTitle: string;
  clientId: string;
  clientName: string;
  aigcerId: string;
  aigcerName: string;
  budgetText: string;
  deliveryFormat: string;
  milestoneSummary: string;
  escrowSummary: string;
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

function localContracts() {
  return readStored<ProjectContract[]>(CONTRACTS_KEY, []);
}

function saveLocalContracts(contracts: ProjectContract[]) {
  writeStored(CONTRACTS_KEY, contracts);
}

async function withFallback<T>(remote: () => Promise<T>, fallback: () => T | Promise<T>): Promise<T> {
  if (!isSupabaseConfigured) return fallback();
  try {
    return await remote();
  } catch {
    return fallback();
  }
}

function defaultTerms(input: CreateContractDraftInput) {
  return [
    `项目交付：乙方需围绕「${input.commissionTitle}」完成约定创作内容。`,
    `交付格式：${input.deliveryFormat || '以双方确认的项目需求为准'}。`,
    `里程碑：${input.milestoneSummary || '以项目里程碑审核结果为准'}。`,
    `付款安排：${input.escrowSummary || '双方确认后按节点结算'}。`,
    '双方确认签署后合同生效，未尽事项以平台记录和双方补充约定为准。',
  ].join('\n');
}

function mapContract(row: DbRow): ProjectContract {
  return {
    id: row.id as string,
    commissionId: Number(row.commission_id),
    commissionTitle: row.commission_title as string,
    clientId: row.client_id as string,
    clientName: row.client_name as string,
    aigcerId: row.aigcer_id as string,
    aigcerName: row.aigcer_name as string,
    budgetText: row.budget_text as string,
    deliveryFormat: row.delivery_format as string,
    milestoneSummary: row.milestone_summary as string,
    escrowSummary: row.escrow_summary as string,
    terms: row.terms as string,
    status: row.status as ContractStatus,
    clientSignedAt: row.client_signed_at as string | undefined,
    aigcerSignedAt: row.aigcer_signed_at as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function contractToRow(contract: ProjectContract) {
  return {
    id: contract.id,
    commission_id: contract.commissionId,
    commission_title: contract.commissionTitle,
    client_id: contract.clientId,
    client_name: contract.clientName,
    aigcer_id: contract.aigcerId,
    aigcer_name: contract.aigcerName,
    budget_text: contract.budgetText,
    delivery_format: contract.deliveryFormat,
    milestone_summary: contract.milestoneSummary,
    escrow_summary: contract.escrowSummary,
    terms: contract.terms,
    status: contract.status,
    client_signed_at: contract.clientSignedAt ?? null,
    aigcer_signed_at: contract.aigcerSignedAt ?? null,
    created_at: contract.createdAt,
    updated_at: contract.updatedAt,
  };
}

function saveContractLocally(contract: ProjectContract) {
  saveLocalContracts([contract, ...localContracts().filter((item) => item.id !== contract.id)]);
}

function createLocalContractDraft(input: CreateContractDraftInput): ProjectContract {
  const existing = localContracts().find((contract) => contract.commissionId === input.commissionId);
  if (existing) return existing;

  const now = new Date().toISOString();
  const contract: ProjectContract = {
    id: generateId('project-contract'),
    ...input,
    terms: defaultTerms(input),
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  };

  saveContractLocally(contract);
  return contract;
}

async function getRemoteContractByCommission(commissionId: number): Promise<ProjectContract | null> {
  const { data, error } = await supabase
    .from('project_contracts')
    .select('*')
    .eq('commission_id', commissionId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  const contract = mapContract(data as DbRow);
  saveContractLocally(contract);
  return contract;
}

async function insertRemoteContract(contract: ProjectContract): Promise<ProjectContract> {
  const { data, error } = await supabase
    .from('project_contracts')
    .insert(contractToRow(contract))
    .select()
    .single();
  if (error) throw new Error(error.message);

  const remoteContract = mapContract(data as DbRow);
  saveContractLocally(remoteContract);
  return remoteContract;
}

async function updateRemoteContract(contract: ProjectContract): Promise<ProjectContract> {
  const { data, error } = await supabase
    .from('project_contracts')
    .update(contractToRow(contract))
    .eq('id', contract.id)
    .select()
    .single();
  if (error) throw new Error(error.message);

  const remoteContract = mapContract(data as DbRow);
  saveContractLocally(remoteContract);
  return remoteContract;
}

function statusAfterSign(contract: ProjectContract): ContractStatus {
  if (contract.clientSignedAt && contract.aigcerSignedAt) return 'active';
  if (contract.clientSignedAt) return 'client_signed';
  if (contract.aigcerSignedAt) return 'aigcer_signed';
  return 'draft';
}

export async function createContractDraft(input: CreateContractDraftInput): Promise<ProjectContract> {
  return withFallback(async () => {
    const existing = await getRemoteContractByCommission(input.commissionId);
    if (existing) return existing;
    return insertRemoteContract(createLocalContractDraft(input));
  }, () => createLocalContractDraft(input));
}

export async function getContractByCommission(commissionId: number): Promise<ProjectContract | null> {
  return withFallback(
    () => getRemoteContractByCommission(commissionId),
    () => localContracts().find((contract) => contract.commissionId === commissionId) ?? null,
  );
}

export async function signContract(contractId: string, role: ContractSignerRole): Promise<ProjectContract> {
  const contract = localContracts().find((item) => item.id === contractId);
  if (!contract) throw new Error('合同不存在');

  const now = new Date().toISOString();
  const signed: ProjectContract = {
    ...contract,
    clientSignedAt: role === 'client' ? contract.clientSignedAt ?? now : contract.clientSignedAt,
    aigcerSignedAt: role === 'aigcer' ? contract.aigcerSignedAt ?? now : contract.aigcerSignedAt,
    updatedAt: now,
  };
  const next = { ...signed, status: statusAfterSign(signed) };
  saveContractLocally(next);

  return withFallback(
    () => updateRemoteContract(next),
    () => next,
  );
}
