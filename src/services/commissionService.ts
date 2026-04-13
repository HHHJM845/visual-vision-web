// src/services/commissionService.ts
import { supabase } from '@/lib/supabase';
import { Commission, Application } from '@/types/commission';

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
  const { data, error } = await supabase
    .from('commissions')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(mapCommission);
}

export async function getCommissionById(id: number): Promise<Commission | null> {
  const { data, error } = await supabase
    .from('commissions')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return mapCommission(data);
}

export async function getCommissionsByAuthor(authorId: string): Promise<Commission[]> {
  const { data, error } = await supabase
    .from('commissions')
    .select('*')
    .eq('author_id', authorId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(mapCommission);
}

export async function createCommission(
  data: Omit<Commission, 'id' | 'applicants'>,
): Promise<Commission> {
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
}

export async function applyToCommission(
  commissionId: number,
  aigcerId: string,
  aigcerNickname: string,
  message: string,
  expectedPrice: string,
): Promise<Application> {
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
}

export async function getApplicationsByAigcer(aigcerId: string): Promise<Application[]> {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('aigcer_id', aigcerId);
  if (error) throw new Error(error.message);
  return (data || []).map(mapApplication);
}

export async function getApplicationsByCommission(commissionId: number): Promise<Application[]> {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('commission_id', commissionId);
  if (error) throw new Error(error.message);
  return (data || []).map(mapApplication);
}
