import { useState } from 'react';
import { enhanceBrief } from '@/services/aiService';

export function useAIBrief() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate(roughIdea: string) {
    setIsLoading(true);
    setError(null);
    try {
      const enhanced = await enhanceBrief(roughIdea);
      setResult(enhanced);
    } catch {
      setError('AI 生成失败，请重试');
    } finally {
      setIsLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setError(null);
  }

  return { isLoading, result, error, generate, reset };
}
