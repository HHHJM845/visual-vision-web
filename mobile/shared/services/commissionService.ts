import { supabase } from '../lib/supabase';
import { Commission, Application } from '../types/commission';

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

export async function getApplicationsByAigcer(aigcerId: string): Promise<Application[]> {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('aigcer_id', aigcerId)
    .order('applied_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(mapApplication);
}

export async function getApplicationsByCommission(commissionId: number): Promise<Application[]> {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('commission_id', commissionId)
    .order('applied_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(mapApplication);
}

export async function applyForCommission(
  commissionId: number,
  aigcerId: string,
  aigcerNickname: string,
  message: string,
  expectedPrice: string,
): Promise<Application> {
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
  return mapApplication(data);
}

export async function updateApplicationStatus(
  applicationId: string,
  status: Application['status'],
): Promise<void> {
  const { error } = await supabase
    .from('applications')
    .update({ status })
    .eq('id', applicationId);
  if (error) throw new Error(error.message);
}

export async function createCommission(
  params: Omit<Commission, 'id' | 'applicants' | 'rating' | 'reviews' | 'completionRate' | 'handlingFee'>,
): Promise<Commission> {
  const { data, error } = await supabase
    .from('commissions')
    .insert({
      title: params.title,
      description: params.description,
      category: params.category,
      price_range: params.priceRange,
      deadline: params.deadline,
      purpose: params.purpose,
      author_id: params.authorId,
      author_nickname: params.authorNickname,
      author_verification: params.authorVerification,
      tag: params.tag,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapCommission(data);
}
