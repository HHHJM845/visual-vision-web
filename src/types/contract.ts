export type ContractStatus = 'draft' | 'client_signed' | 'aigcer_signed' | 'active';
export type ContractSignerRole = 'client' | 'aigcer';

export interface ProjectContract {
  id: string;
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
  terms: string;
  status: ContractStatus;
  clientSignedAt?: string;
  aigcerSignedAt?: string;
  createdAt: string;
  updatedAt: string;
}
