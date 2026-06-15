import { supabase } from '../supabase';

export interface GoldRate {
  id: string;
  entry_date: string;
  metal: string;
  purity: string;
  rate: number;
  currency: string;
  updated_at: string;
}

/** Map of purity → rate for a single day, Gold metal only. */
export interface DailyGoldRates {
  entry_date: string;
  updated_at: string;
  rates: Record<string, number>;
}

/**
 * Invoke the sync-gold-rate edge function.
 * Fetches today's rates from D365, persists them if new, and returns the
 * current Gold rates keyed by purity. Falls back to the latest DB entry
 * if D365 is unreachable.
 */
export async function syncGoldRate(): Promise<DailyGoldRates | null> {
  const { data, error } = await supabase.functions.invoke('sync-gold-rate');
  if (error) {
    console.warn('[syncGoldRate]', error.message);
    return null;
  }
  return (data as DailyGoldRates) ?? null;
}
