import { useState } from 'react';
import { matchApplicants, ApplicantInput } from '@/services/aiService';
import { ApplicantWithProfile } from '@/services/commissionService';

type MatchScore = { id: string; score: number };

export function useSmartMatch() {
  const [isLoading, setIsLoading] = useState(false);
  const [scores, setScores] = useState<MatchScore[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runMatch(
    commissionDescription: string,
    category: string,
    applicants: ApplicantWithProfile[]
  ) {
    if (scores) return; // cached
    setIsLoading(true);
    setError(null);
    try {
      const inputs: ApplicantInput[] = applicants.map((a) => ({
        id: a.aigcerId,
        bio: a.bio,
        styles: a.styles,
        tools: a.tools,
      }));
      const result = await matchApplicants(commissionDescription, category, inputs);
      setScores(result);
    } catch {
      setError('匹配分析失败，请重试');
    } finally {
      setIsLoading(false);
    }
  }

  return { isLoading, scores, error, runMatch };
}
