import { supabase } from '../supabase';

export interface GoldRate {
  id: string;
  rate_22k: number;
  rate_24k: number;
  currency: string;
  updated_at: string;
}

/** Fetch the single most recent gold rate. Returns null if no rate exists yet. */
export async function getLatestGoldRate(): Promise<GoldRate | null> {
  const { data, error } = await supabase
    .from('gold_rates')
    .select('id, rate_22k, rate_24k, currency, updated_at')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    // Table may not exist yet -- treat as no rate rather than throwing
    console.warn('[getLatestGoldRate]', error.message);
    return null;
  }
  return data as GoldRate | null;
}

/** Fetch the last N gold rate records (for the admin history list). */
export async function getGoldRateHistory(limit = 20): Promise<GoldRate[]> {
  const { data, error } = await supabase
    .from('gold_rates')
    .select('id, rate_22k, rate_24k, currency, updated_at')
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.warn('[getGoldRateHistory]', error.message);
    return [];
  }
  return (data ?? []) as GoldRate[];
}

/** Admin: insert a new gold rate entry. */
export async function postGoldRate(rate22k: number, rate24k: number): Promise<void> {
  const { error } = await supabase
    .from('gold_rates')
    .insert({ rate_22k: rate22k, rate_24k: rate24k, currency: 'INR' });
  if (error) throw error;
}
