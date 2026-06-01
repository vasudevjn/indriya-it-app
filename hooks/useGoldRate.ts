import { useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../constants/queryKeys';
import { getLatestGoldRate, getGoldRateHistory } from '../lib/api/goldRate';

export function useGoldRate() {
  return useQuery({
    queryKey: QUERY_KEYS.goldRate(),
    queryFn: getLatestGoldRate,
    staleTime: 5 * 60 * 1000, // 5 minutes -- rate doesn't change every second
    retry: 1,
  });
}

export function useGoldRateHistory() {
  return useQuery({
    queryKey: QUERY_KEYS.goldRateHistory(),
    queryFn: () => getGoldRateHistory(20),
    staleTime: 60 * 1000,
    retry: 1,
  });
}

/** Returns a stable function that forces a fresh gold-rate fetch. */
export function useRefreshGoldRate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: QUERY_KEYS.goldRate() });
}
