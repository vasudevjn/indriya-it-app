import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const D365_BASE = 'https://novel.operations.dynamics.com';

interface D365Item {
  Metal: string;
  Purity: string;
  Rate: number;
}

interface DailyGoldRates {
  entry_date: string;
  updated_at: string;
  rates: Record<string, number>; // purity → rate, Gold metal only
}

async function getD365Token(): Promise<string> {
  const body = new URLSearchParams({
    client_id:     Deno.env.get('D365_CLIENT_ID')!,
    client_secret: Deno.env.get('D365_CLIENT_SECRET')!,
    grant_type:    'client_credentials',
    resource:      D365_BASE,
  });
  const res = await fetch(
    `https://login.microsoftonline.com/${Deno.env.get('D365_TENANT_ID')}/oauth2/token`,
    { method: 'POST', body },
  );
  if (!res.ok) throw new Error(`OAuth failed: ${res.status}`);
  const { access_token } = await res.json();
  return access_token as string;
}

async function fetchD365Rates(token: string, dateIST: string): Promise<D365Item[]> {
  const filter =
    `RateType eq Microsoft.Dynamics.DataEntities.PwC_MetalRateType'Sale'` +
    ` and IsRetail eq Microsoft.Dynamics.DataEntities.NoYes'Yes'` +
    ` and EntryDate eq ${dateIST}` +
    ` and Warehouse eq 'NS0001'`;
  const url = `${D365_BASE}/data/C_JISchemeAppMetalRate?$filter=${encodeURIComponent(filter)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`D365 API failed: ${res.status}`);
  const { value } = await res.json();
  return value as D365Item[];
}

function buildDailyRates(
  rows: { purity: string; rate: number; updated_at: string }[],
  entryDate: string,
): DailyGoldRates {
  const rates: Record<string, number> = {};
  for (const row of rows) rates[row.purity] = row.rate;
  return {
    entry_date: entryDate,
    updated_at: rows[0]?.updated_at ?? new Date().toISOString(),
    rates,
  };
}

function formatRate(n: number): string {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function notifyRateUpdate(
  supabase: SupabaseClient,
  rates: Record<string, number>,
): Promise<void> {
  const rate22k = rates['22KT'];
  const rate24k = rates['24KT 999'];
  if (!rate22k || !rate24k) return;

  const RUPEE = '₹';
  const title = 'Gold Rate Updated';
  const body  = `22K: ${RUPEE}${formatRate(rate22k)} | 24K: ${RUPEE}${formatRate(rate24k)} per gram`;

  // 1. Create a broadcast record so the announcement appears in all stores' feeds.
  //    broadcasts.sender_id is NOT NULL → use the first available admin profile.
  const { data: admin } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .eq('approval_status', 'approved')
    .limit(1)
    .maybeSingle();

  if (admin) {
    await supabase.from('broadcasts').insert({
      sender_id: (admin as { id: string }).id,
      title,
      body,
      // target_store_id and target_store_ids both omitted → all stores
    }).catch((err: unknown) => console.error('[sync-gold-rate] broadcast insert failed:', err));
  }

  // 2. Send push notification to every registered device.
  const { data: profiles } = await supabase
    .from('profiles')
    .select('expo_push_token')
    .not('expo_push_token', 'is', null);

  const tokens = ((profiles ?? []) as { expo_push_token: string | null }[])
    .map((p) => p.expo_push_token)
    .filter(Boolean) as string[];

  if (!tokens.length) return;

  const messages = tokens.map((to) => ({
    to, title, body, sound: 'default', data: { type: 'broadcast' },
  }));

  for (let i = 0; i < messages.length; i += 100) {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages.slice(i, i + 100)),
    });
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  if (!req.headers.get('Authorization')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Today's date in IST (India Standard Time, UTC+5:30)
  const todayIST = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());

  // Return cached rates if today's Gold entries already exist
  const { data: existing } = await supabase
    .from('gold_rates')
    .select('purity, rate, updated_at')
    .eq('entry_date', todayIST)
    .eq('metal', 'Gold');

  if (existing && existing.length > 0) {
    const result = buildDailyRates(
      existing as { purity: string; rate: number; updated_at: string }[],
      todayIST,
    );
    return new Response(JSON.stringify(result), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  // Fetch from D365 and persist
  try {
    const token = await getD365Token();
    const items = await fetchD365Rates(token, todayIST);

    if (!items.length) throw new Error('D365 returned no rates');

    // Insert all metal/purity rows — idempotent on (entry_date, metal, purity)
    const rows = items.map((item) => ({
      entry_date: todayIST,
      metal:      item.Metal,
      purity:     item.Purity,
      rate:       item.Rate,
      currency:   'INR',
    }));

    const { error: upsertError } = await supabase
      .from('gold_rates')
      .upsert(rows, { onConflict: 'entry_date,metal,purity', ignoreDuplicates: true });

    if (upsertError) throw upsertError;

    // Re-fetch to get DB-stamped updated_at
    const { data: goldRows } = await supabase
      .from('gold_rates')
      .select('purity, rate, updated_at')
      .eq('entry_date', todayIST)
      .eq('metal', 'Gold');

    const result = buildDailyRates(
      (goldRows ?? []) as { purity: string; rate: number; updated_at: string }[],
      todayIST,
    );

    // Notify all users (fire-and-forget)
    void notifyRateUpdate(supabase, result.rates).catch(
      (err) => console.error('[sync-gold-rate] push failed:', err),
    );

    return new Response(JSON.stringify(result), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    // D365 unreachable — fall back to most recent day's Gold rates in DB
    console.error('[sync-gold-rate] D365 error, using DB fallback:', err);

    const { data: latestDay } = await supabase
      .from('gold_rates')
      .select('entry_date')
      .eq('metal', 'Gold')
      .order('entry_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!latestDay) {
      return new Response(JSON.stringify(null), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const { data: fallbackRows } = await supabase
      .from('gold_rates')
      .select('purity, rate, updated_at')
      .eq('entry_date', (latestDay as { entry_date: string }).entry_date)
      .eq('metal', 'Gold');

    const result = buildDailyRates(
      (fallbackRows ?? []) as { purity: string; rate: number; updated_at: string }[],
      (latestDay as { entry_date: string }).entry_date,
    );

    return new Response(JSON.stringify(result), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
