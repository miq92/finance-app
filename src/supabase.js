import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = 'https://xbwejouebmdwbgntfqzs.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhid2Vqb3VlYm1kd2JnbnRmcXpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1MTMxMzUsImV4cCI6MjA5NTA4OTEzNX0.Pz0A6PuBIOkKjpp_clH48Mn_VAH3F5ENECCzEd8rWvQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
