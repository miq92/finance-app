import { createClient } from '@supabase/supabase-js';

// ─── Replace these two values with your own from supabase.com ─────────────────
const SUPABASE_URL  = 'https://xbwejouebmdwbgntfqzs.supabase.co';
const SUPABASE_ANON = 'sb_publishable_5StbYv_zCdY4T4Nm7tvgVg_M1zzltsT';
// ─────────────────────────────────────────────────────────────────────────────

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
