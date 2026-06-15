import { useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../constants/queryKeys';
import { syncGoldRate } from '../lib/api/goldRate';

export function useGoldRate() {
  return useQuery({
    queryKey: QUERY_KEYS.goldRate(),
    queryFn: syncGoldRate,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: 'always', // always sync when home screen mounts (app start, tab focus)
    retry: 1,
  });
}

/** Returns a stable function that forces a fresh sync from D365. */
export function useRefreshGoldRate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: QUERY_KEYS.goldRate() });
}
