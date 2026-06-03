import { supabase } from '../supabase';

export interface GoldRate {
  id: string;
  rate_24k: number;     // 24K, 999 purity
  rate_24k_995: number; // 24K, 995 purity
  rate_22k: number;     // 22K, 916 purity
  rate_18k: number;     // 18K, 750 purity
  currency: string;
  updated_at: string;
}

const GOLD_RATE_FIELDS = 'id, rate_24k, rate_24k_995, rate_22k, rate_18k, currency, updated_at';

/** Fetch the single most recent gold rate. Returns null if no rate exists yet. */
export async function getLatestGoldRate(): Promise<GoldRate | null> {
  const { data, error } = await supabase
    .from('gold_rates')
    .select(GOLD_RATE_FIELDS)
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
    .select(GOLD_RATE_FIELDS)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.warn('[getGoldRateHistory]', error.message);
    return [];
  }
  return (data ?? []) as GoldRate[];
}

/** Admin: insert a new gold rate entry.
 *  Accepts the two base rates (24K 999 and 22K 916); the two derived
 *  purities are computed here and stored so the card can read all four
 *  directly from the DB without runtime arithmetic.
 */
export async function postGoldRate(rate22k: number, rate24k: number): Promise<void> {
  const rate24k_995 = Math.round(rate24k * 995 / 999);
  const rate18k     = Math.round(rate22k * 750 / 916);
  const { error } = await supabase
    .from('gold_rates')
    .insert({
      rate_24k:     rate24k,
      rate_24k_995: rate24k_995,
      rate_22k:     rate22k,
      rate_18k:     rate18k,
      currency:     'INR',
    });
  if (error) throw error;
}
